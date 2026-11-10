import type { DocumentPickerAsset } from "expo-document-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";
import { api } from "./api";

type UploadAsset = DocumentPickerAsset | ImagePickerAsset;
const TARGET_IMAGE_BYTES = Math.floor(4.75 * 1024 * 1024);

function assetSize(asset: UploadAsset) {
  const declaredSize = "fileSize" in asset
    ? asset.fileSize
    : "size" in asset
      ? asset.size
      : undefined;
  if (typeof declaredSize === "number") return declaredSize;

  try {
    return new File(asset.uri).size;
  } catch {
    return undefined;
  }
}

function isCompressibleImage(asset: UploadAsset) {
  if (asset.mimeType === "image/gif" || asset.mimeType === "application/pdf") return false;
  return asset.mimeType?.startsWith("image/") || ("width" in asset && "height" in asset);
}

function jpegFileName(asset: UploadAsset) {
  const currentName = "fileName" in asset ? asset.fileName : "name" in asset ? asset.name : null;
  return `${currentName?.replace(/\.[^.]+$/, "") || "anyjob-photo"}.jpg`;
}

async function optimizeNativeImage(asset: UploadAsset): Promise<UploadAsset> {
  if (Platform.OS === "web" || !isCompressibleImage(asset)) return asset;
  const originalSize = assetSize(asset);
  if (typeof originalSize === "number" && originalSize <= TARGET_IMAGE_BYTES) return asset;

  const attempts = [
    { maxDimension: 2560, quality: 0.84 },
    { maxDimension: 2200, quality: 0.72 },
    { maxDimension: 1900, quality: 0.6 },
    { maxDimension: 1600, quality: 0.48 },
    { maxDimension: 1280, quality: 0.38 },
    { maxDimension: 960, quality: 0.3 },
  ];
  let smallest: { uri: string; width: number; height: number; size: number } | null = null;

  for (const attempt of attempts) {
    const context = ImageManipulator.manipulate(asset.uri, {
      maxWidth: attempt.maxDimension,
      maxHeight: attempt.maxDimension,
    });
    const image = await context.renderAsync();
    const result = await image.saveAsync({ compress: attempt.quality, format: SaveFormat.JPEG });
    const size = new File(result.uri).size;
    if (typeof size !== "number") continue;
    if (!smallest || size < smallest.size) smallest = { ...result, size };
    if (size <= TARGET_IMAGE_BYTES) break;
  }

  if (!smallest || (typeof originalSize === "number" && smallest.size >= originalSize)) return asset;
  const name = jpegFileName(asset);
  return {
    ...asset,
    uri: smallest.uri,
    mimeType: "image/jpeg",
    ...( "fileName" in asset ? { fileName: name, fileSize: smallest.size } : {}),
    ...( "name" in asset ? { name, size: smallest.size } : {}),
    ...( "width" in asset ? { width: smallest.width, height: smallest.height } : {}),
  } as UploadAsset;
}

function appendAsset(form: FormData, asset: UploadAsset) {
  const webFile = "file" in asset ? asset.file : undefined;
  if (Platform.OS === "web" && webFile) {
    form.append("file", webFile);
    return;
  }

  const fileName =
    "fileName" in asset ? asset.fileName : "name" in asset ? asset.name : null;
  const isImageAsset = "width" in asset && "height" in asset;
  form.append("file", {
    uri: asset.uri,
    name: fileName || `anyjob-upload-${Date.now()}`,
    type: asset.mimeType || (isImageAsset ? "image/jpeg" : "application/octet-stream"),
  } as unknown as Blob);
}

type MarketplaceImageType = "profile" | "portfolio" | "id_document" | "selfie_video" | "work_image";

type DirectUploadAuthorization = {
  uploadUrl: string;
  fields: {
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
    transformation?: string | null;
  };
  maxBytes: number;
};

type CloudinaryUploadResponse = {
  public_id?: string;
  version?: number;
  signature?: string;
  resource_type?: string;
  secure_url?: string;
  error?: { message?: string };
};

async function uploadMarketplaceAsset(
  asset: UploadAsset,
  imageType: MarketplaceImageType,
  metadata?: { title?: string; description?: string; inquiryId?: string },
) {
  const preparedAsset = await optimizeNativeImage(asset);
  const authorization = await api<DirectUploadAuthorization>("/api/upload", {
    method: "POST",
    body: JSON.stringify({ mode: "sign", imageType }),
  });

  const fileSize = assetSize(preparedAsset);
  if (typeof fileSize === "number" && fileSize > authorization.maxBytes) {
    throw new Error(`File too large. Max ${Math.round(authorization.maxBytes / 1024 / 1024)}MB`);
  }

  const form = new FormData();
  appendAsset(form, preparedAsset);
  form.append("api_key", authorization.fields.apiKey);
  form.append("timestamp", String(authorization.fields.timestamp));
  form.append("signature", authorization.fields.signature);
  form.append("folder", authorization.fields.folder);
  if (authorization.fields.transformation) {
    form.append("transformation", authorization.fields.transformation);
  }

  const response = await fetch(authorization.uploadUrl, { method: "POST", body: form });
  const uploaded = await response.json().catch(() => ({})) as CloudinaryUploadResponse;
  if (!response.ok) {
    throw new Error(uploaded.error?.message || `Cloud upload failed (${response.status})`);
  }

  return api<{ image: { id: string; image_url: string; image_type: string } }>("/api/upload", {
    method: "POST",
    body: JSON.stringify({
      mode: "complete",
      imageType,
      title: metadata?.title,
      description: metadata?.description,
      inquiryId: metadata?.inquiryId,
      upload: {
        public_id: uploaded.public_id,
        version: uploaded.version,
        signature: uploaded.signature,
        resource_type: uploaded.resource_type,
      },
    }),
  });
}

export async function uploadMarketplaceFile(
  asset: UploadAsset,
  imageType: "profile" | "portfolio" | "id_document" | "selfie_video",
  metadata?: { title?: string; description?: string },
) {
  return uploadMarketplaceAsset(asset, imageType, metadata);
}

export async function uploadWorkImage(
  asset: ImagePickerAsset,
  inquiryId: string,
) {
  return uploadMarketplaceAsset(asset, "work_image", { inquiryId });
}

export async function uploadDocumentFile(
  asset: UploadAsset,
  folder = "anyjob/documents",
) {
  const preparedAsset = await optimizeNativeImage(asset);
  const authorization = await api<DirectUploadAuthorization>("/api/upload/document", {
    method: "POST",
    body: JSON.stringify({ mode: "sign", folder }),
  });
  const fileSize = assetSize(preparedAsset);
  if (typeof fileSize === "number" && fileSize > authorization.maxBytes) {
    throw new Error(`Document must be under ${Math.round(authorization.maxBytes / 1024 / 1024)}MB.`);
  }

  const form = new FormData();
  appendAsset(form, preparedAsset);
  form.append("api_key", authorization.fields.apiKey);
  form.append("timestamp", String(authorization.fields.timestamp));
  form.append("signature", authorization.fields.signature);
  form.append("folder", authorization.fields.folder);
  const response = await fetch(authorization.uploadUrl, { method: "POST", body: form });
  const uploaded = await response.json().catch(() => ({})) as CloudinaryUploadResponse;
  if (!response.ok) {
    throw new Error(uploaded.error?.message || `Cloud upload failed (${response.status})`);
  }

  const fileName = "fileName" in preparedAsset
    ? preparedAsset.fileName
    : "name" in preparedAsset
      ? preparedAsset.name
      : null;
  return api<{
    url: string;
    publicId: string;
    fileName: string;
    contentType: string;
  }>("/api/upload/document", {
    method: "POST",
    body: JSON.stringify({
      mode: "complete",
      folder,
      fileName: fileName || `anyjob-document-${Date.now()}`,
      contentType: preparedAsset.mimeType || "application/octet-stream",
      upload: {
        public_id: uploaded.public_id,
        version: uploaded.version,
        signature: uploaded.signature,
        resource_type: uploaded.resource_type,
      },
    }),
  });
}
