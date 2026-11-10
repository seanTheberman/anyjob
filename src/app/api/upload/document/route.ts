import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { timingSafeEqual } from "node:crypto";

import { createServerSupabaseClient } from "@/lib/supabase/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
const DOCUMENT_FOLDERS = ["anyjob/documents", "anyjob/business-documents", "anyjob/insurance"];

function cleanFolder(value: unknown) {
  return typeof value === "string" && DOCUMENT_FOLDERS.includes(value) ? value : "anyjob/documents";
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json().catch(() => ({})) as {
        mode?: unknown;
        folder?: unknown;
        fileName?: unknown;
        contentType?: unknown;
        upload?: {
          public_id?: unknown;
          version?: unknown;
          signature?: unknown;
          resource_type?: unknown;
        };
      };
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!apiKey || !apiSecret || !cloudName) {
        return NextResponse.json({ error: "Upload service is not configured" }, { status: 503 });
      }

      const folder = `${cleanFolder(body.folder)}/${user.id}`;
      if (body.mode === "sign") {
        const timestamp = Math.floor(Date.now() / 1000);
        return NextResponse.json({
          uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          fields: {
            apiKey,
            timestamp,
            signature: cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret),
            folder,
          },
          maxBytes: MAX_DOCUMENT_BYTES,
        });
      }

      if (body.mode !== "complete") {
        return NextResponse.json({ error: "Invalid upload action" }, { status: 400 });
      }

      const publicId = typeof body.upload?.public_id === "string" ? body.upload.public_id : "";
      const version = typeof body.upload?.version === "number" || typeof body.upload?.version === "string"
        ? body.upload.version
        : "";
      const signature = typeof body.upload?.signature === "string" ? body.upload.signature : "";
      const resourceType = body.upload?.resource_type === "image" || body.upload?.resource_type === "raw"
        ? body.upload.resource_type
        : "";
      if (!publicId.startsWith(`${folder}/`) || !version || !signature || !resourceType) {
        return NextResponse.json({ error: "Invalid upload response" }, { status: 400 });
      }

      const expectedSignature = cloudinary.utils.api_sign_request({ public_id: publicId, version }, apiSecret);
      if (!signaturesMatch(signature, expectedSignature)) {
        return NextResponse.json({ error: "Upload verification failed" }, { status: 400 });
      }

      let resource: { secure_url?: string; bytes?: number; format?: string };
      try {
        resource = await cloudinary.api.resource(publicId, { resource_type: resourceType });
      } catch (error) {
        console.error("Cloudinary document verification error:", error);
        return NextResponse.json({ error: "Uploaded document could not be verified" }, { status: 400 });
      }

      const allowedFormats = ["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif"];
      if (!resource.secure_url || typeof resource.bytes !== "number" || resource.bytes > MAX_DOCUMENT_BYTES || !allowedFormats.includes(resource.format || "")) {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => undefined);
        return NextResponse.json({ error: "Upload a PDF, JPG, PNG, WebP, HEIC, or HEIF document under 25MB." }, { status: 400 });
      }

      const fileName = typeof body.fileName === "string"
        ? body.fileName.split(/[\\/]/).pop()?.slice(0, 255) || "document"
        : "document";
      return NextResponse.json({
        url: resource.secure_url,
        publicId,
        fileName,
        contentType: typeof body.contentType === "string" ? body.contentType : "application/octet-stream",
      });
    }

    const formData = (await request.formData()) as unknown as globalThis.FormData;
    const file = formData.get("file") as File | null;
    const folder = cleanFolder(formData.get("folder"));

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!DOCUMENT_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Upload a PDF, JPG, PNG, or WebP document." }, { status: 400 });
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "Document must be under 25MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `${folder}/${user.id}`,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string; public_id: string });
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileName: file.name,
      contentType: file.type,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Document upload failed" }, { status: 500 });
  }
}
