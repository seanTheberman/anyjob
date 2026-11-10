import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { timingSafeEqual } from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_TYPES = ["profile", "portfolio", "portfolio_video", "work_image", "id_document", "selfie_video", "gig_image", "gig_video"] as const;
type UploadType = (typeof UPLOAD_TYPES)[number];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

function getUploadRules(imageType: UploadType) {
  if (imageType === "selfie_video" || imageType === "portfolio_video" || imageType === "gig_video") {
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

  const [{ data: buyer }, { data: seller }, { data: profile }] = await Promise.all([
    supabase.from("buyers").select("kyc_status").eq("id", userId).maybeSingle(),
    supabase.from("sellers").select("status").eq("id", userId).maybeSingle(),
    supabase.from("eloo_profiles").select("is_verified,kyc_status").eq("id", userId).maybeSingle(),
  ]);

  const buyerApproved = ["approved", "confirmed", "verified", "manual_override", "manually_verified"]
    .includes(String(buyer?.kyc_status || "").toLowerCase());
  const sellerApproved = String(seller?.status || "").toLowerCase() === "approved";
  const profileApproved = profile?.is_verified === true || ["approved", "confirmed", "verified", "manual_override", "manually_verified"]
    .includes(String(profile?.kyc_status || "").toLowerCase());

  await supabase
    .from("buyers")
    .update({ [column]: url, ...(!buyerApproved ? { kyc_status: "submitted" } : {}), kyc_submitted_at: timestamp })
    .eq("id", userId);

  await supabase
    .from("sellers")
    .update({ [column]: url, kyc_submitted_at: timestamp })
    .eq("id", userId);

  await supabase
    .from("eloo_profiles")
    .update({ ...(!buyerApproved && !sellerApproved && !profileApproved ? { kyc_status: "submitted" } : {}), kyc_submitted_at: timestamp })
    .eq("id", userId);
}

function marketplaceUploadLimit(imageType: UploadType) {
  if (imageType === "portfolio") return 4;
  if (imageType === "portfolio_video") return 1;
  return null;
}

function resourceTypeForDelete(imageType: UploadType | string) {
  return imageType === "selfie_video" || imageType === "portfolio_video" || imageType === "gig_video" ? "video" as const : "image" as const;
}

function isUploadType(value: unknown): value is UploadType {
  return typeof value === "string" && UPLOAD_TYPES.includes(value as UploadType);
}

function uploadFolder(imageType: UploadType, userId: string) {
  return `anyjob/${imageType}s/${userId}`;
}

function uploadTransformation(imageType: UploadType) {
  if (imageType === "profile") return "c_fill,g_face,h_400,w_400";
  const rules = getUploadRules(imageType);
  return rules.resourceType === "image" ? "c_limit,h_900,w_1200" : null;
}

async function validateMarketplaceUploadLimit(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  imageType: UploadType,
) {
  const uploadLimit = marketplaceUploadLimit(imageType);
  if (uploadLimit === null) return null;

  const { count, error } = await supabase
    .from("user_images")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("image_type", imageType);

  if (error) return NextResponse.json({ error: "Could not validate upload limit" }, { status: 500 });
  if ((count || 0) < uploadLimit) return null;

  const noun = imageType === "portfolio_video" ? "portfolio video" : "portfolio images";
  return NextResponse.json({ error: `Maximum ${uploadLimit} ${noun} allowed` }, { status: 400 });
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

type DirectUploadBody = {
  mode?: unknown;
  imageType?: unknown;
  title?: unknown;
  description?: unknown;
  inquiryId?: unknown;
  upload?: {
    public_id?: unknown;
    version?: unknown;
    signature?: unknown;
    resource_type?: unknown;
  };
};

async function handleDirectUpload(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  body: DirectUploadBody,
) {
  if (!isUploadType(body.imageType)) {
    return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
  }

  const imageType = body.imageType;
  const limitError = await validateMarketplaceUploadLimit(supabase, userId, imageType);
  if (limitError) return limitError;

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!apiKey || !apiSecret || !cloudName) {
    return NextResponse.json({ error: "Upload service is not configured" }, { status: 503 });
  }

  const rules = getUploadRules(imageType);
  const folder = uploadFolder(imageType, userId);
  const transformation = uploadTransformation(imageType);

  if (body.mode === "sign") {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedFields: Record<string, string | number> = { folder, timestamp };
    if (transformation) signedFields.transformation = transformation;

    return NextResponse.json({
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${rules.resourceType}/upload`,
      fields: {
        apiKey,
        timestamp,
        signature: cloudinary.utils.api_sign_request(signedFields, apiSecret),
        folder,
        transformation,
      },
      maxBytes: rules.maxSize,
    });
  }

  if (body.mode !== "complete") {
    return NextResponse.json({ error: "Invalid upload action" }, { status: 400 });
  }

  const upload = body.upload;
  const publicId = typeof upload?.public_id === "string" ? upload.public_id : "";
  const version = typeof upload?.version === "number" || typeof upload?.version === "string" ? upload.version : "";
  const responseSignature = typeof upload?.signature === "string" ? upload.signature : "";
  const resourceType = upload?.resource_type === "video" || upload?.resource_type === "raw" || upload?.resource_type === "image"
    ? upload.resource_type
    : "";
  const expectedPrefix = `${folder}/`;

  if (!publicId.startsWith(expectedPrefix) || !version || !responseSignature || !resourceType) {
    return NextResponse.json({ error: "Invalid upload response" }, { status: 400 });
  }

  const expectedResourceTypes = rules.resourceType === "auto" ? ["image", "raw"] : [rules.resourceType];
  if (!expectedResourceTypes.includes(resourceType)) {
    return NextResponse.json({ error: "Unexpected uploaded file type" }, { status: 400 });
  }

  const expectedSignature = cloudinary.utils.api_sign_request({ public_id: publicId, version }, apiSecret);
  if (!signaturesMatch(responseSignature, expectedSignature)) {
    return NextResponse.json({ error: "Upload verification failed" }, { status: 400 });
  }

  const existing = await supabase
    .from("user_images")
    .select("*")
    .eq("user_id", userId)
    .eq("public_id", publicId)
    .maybeSingle();
  if (existing.data) return NextResponse.json({ image: existing.data }, { status: 200 });

  let resource: { secure_url?: string; bytes?: number };
  try {
    resource = await cloudinary.api.resource(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error("Cloudinary upload verification error:", error);
    return NextResponse.json({ error: "Uploaded file could not be verified" }, { status: 400 });
  }

  if (!resource.secure_url || typeof resource.bytes !== "number" || resource.bytes > rules.maxSize) {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => undefined);
    return NextResponse.json({ error: `File too large. Max ${Math.round(rules.maxSize / 1024 / 1024)}MB` }, { status: 400 });
  }

  const { data: image, error: dbError } = await supabase
    .from("user_images")
    .insert({
      user_id: userId,
      image_url: resource.secure_url,
      public_id: publicId,
      image_type: imageType,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : null,
      description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
      inquiry_id: typeof body.inquiryId === "string" && body.inquiryId ? body.inquiryId : null,
    })
    .select()
    .single();

  if (dbError || !image) {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => undefined);
    return NextResponse.json({ error: "Failed to save image record" }, { status: 500 });
  }

  if (imageType === "profile") {
    await Promise.all([
      supabase.from("sellers").update({ profile_image_url: resource.secure_url }).eq("id", userId),
      supabase.from("buyers").update({ profile_image_url: resource.secure_url }).eq("id", userId),
    ]);
  }

  await syncKycUpload(supabase, userId, imageType, resource.secure_url);
  return NextResponse.json({ image }, { status: 201 });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json().catch(() => ({})) as DirectUploadBody;
      return handleDirectUpload(supabase, user.id, body);
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

    const limitError = await validateMarketplaceUploadLimit(supabase, user.id, imageType);
    if (limitError) return limitError;

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
      await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: rules.resourceType }).catch(() => {});
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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("id");
    const body = await request.json().catch(() => ({})) as { title?: unknown; description?: unknown };

    if (!imageId) {
      return NextResponse.json({ error: "Image ID required" }, { status: 400 });
    }

    const update: { title?: string | null; description?: string | null } = {};
    if ("title" in body) update.title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;
    if ("description" in body) update.description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }

    const { data: image, error } = await supabase
      .from("user_images")
      .update(update)
      .eq("id", imageId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ image });
  } catch (error) {
    console.error("Upload update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
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
    await cloudinary.uploader.destroy(image.public_id, { resource_type: resourceTypeForDelete(image.image_type) }).catch(() => {});

    // Delete from database
    await supabase.from("user_images").delete().eq("id", imageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
