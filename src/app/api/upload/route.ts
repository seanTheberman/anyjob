import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createServerSupabaseClient } from "@/lib/supabase/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_TYPES = ["profile", "portfolio", "work_image", "id_document", "selfie_video"] as const;
type UploadType = (typeof UPLOAD_TYPES)[number];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

function getUploadRules(imageType: UploadType) {
  if (imageType === "selfie_video") {
    return {
      allowedTypes: VIDEO_TYPES,
      maxSize: 100 * 1024 * 1024,
      resourceType: "video" as const,
      error: "Invalid file type. Allowed: MP4, WebM, MOV",
    };
  }

  if (imageType === "id_document") {
    return {
      allowedTypes: DOCUMENT_TYPES,
      maxSize: 25 * 1024 * 1024,
      resourceType: "auto" as const,
      error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF",
    };
  }

  return {
    allowedTypes: IMAGE_TYPES,
    maxSize: 10 * 1024 * 1024,
    resourceType: "image" as const,
    error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF",
  };
}

async function syncKycUpload(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  imageType: UploadType,
  url: string
) {
  if (imageType !== "id_document" && imageType !== "selfie_video") return;

  const timestamp = new Date().toISOString();
  const column = imageType === "id_document" ? "id_document_url" : "selfie_video_url";

  await supabase
    .from("buyers")
    .update({ [column]: url, kyc_status: "submitted", kyc_submitted_at: timestamp })
    .eq("id", userId);

  await supabase
    .from("sellers")
    .update({ [column]: url, verification_status: "pending", kyc_submitted_at: timestamp })
    .eq("id", userId);

  await supabase
    .from("eloo_profiles")
    .update({ kyc_status: "submitted", kyc_submitted_at: timestamp })
    .eq("id", userId);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = (await request.formData()) as unknown as globalThis.FormData;
    const file = formData.get("file") as File;
    const imageType = formData.get("image_type") as UploadType;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const inquiryId = formData.get("inquiry_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!imageType || !UPLOAD_TYPES.includes(imageType)) {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    const rules = getUploadRules(imageType);
    if (!rules.allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: rules.error }, { status: 400 });
    }

    if (file.size > rules.maxSize) {
      return NextResponse.json({ error: `File too large. Max ${Math.round(rules.maxSize / 1024 / 1024)}MB` }, { status: 400 });
    }

    // Convert file to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const folder = `anyjob/${imageType}s/${user.id}`;
    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: rules.resourceType,
          transformation: rules.resourceType !== "image" ? undefined : imageType === "profile"
            ? [{ width: 400, height: 400, crop: "fill", gravity: "face" }]
            : [{ width: 1200, height: 900, crop: "limit" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string; public_id: string });
        }
      ).end(buffer);
    });

    // Save to database
    const { data: image, error: dbError } = await supabase
      .from("user_images")
      .insert({
        user_id: user.id,
        image_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        image_type: imageType,
        title: title || null,
        description: description || null,
        inquiry_id: inquiryId || null,
      })
      .select()
      .single();

    if (dbError) {
      // Try to clean up Cloudinary upload if DB save fails
      await cloudinary.uploader.destroy(uploadResult.public_id).catch(() => {});
      return NextResponse.json({ error: "Failed to save image record" }, { status: 500 });
    }

    // If it's a profile image, update the user's profile
    if (imageType === "profile") {
      // Update sellers table
      await supabase
        .from("sellers")
        .update({ profile_image_url: uploadResult.secure_url })
        .eq("id", user.id);

      // Update buyers table
      await supabase
        .from("buyers")
        .update({ profile_image_url: uploadResult.secure_url })
        .eq("id", user.id);
    }

    await syncKycUpload(supabase, user.id, imageType, uploadResult.secure_url);

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("id");

    if (!imageId) {
      return NextResponse.json({ error: "Image ID required" }, { status: 400 });
    }

    // Get image record
    const { data: image, error: fetchError } = await supabase
      .from("user_images")
      .select("*")
      .eq("id", imageId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.public_id).catch(() => {});

    // Delete from database
    await supabase.from("user_images").delete().eq("id", imageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
