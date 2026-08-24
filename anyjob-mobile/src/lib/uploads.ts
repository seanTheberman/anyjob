import type { DocumentPickerAsset } from "expo-document-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import { Platform } from "react-native";
import { api } from "./api";

type UploadAsset = DocumentPickerAsset | ImagePickerAsset;

function appendAsset(form: FormData, asset: UploadAsset) {
  const webFile = "file" in asset ? asset.file : undefined;
  if (Platform.OS === "web" && webFile) {
    form.append("file", webFile);
    return;
  }

  const fileName =
    "fileName" in asset ? asset.fileName : "name" in asset ? asset.name : null;
  form.append("file", {
    uri: asset.uri,
    name: fileName || `anyjob-upload-${Date.now()}`,
    type: asset.mimeType || "application/octet-stream",
  } as unknown as Blob);
}

export async function uploadMarketplaceFile(
  asset: UploadAsset,
  imageType: "profile" | "portfolio" | "id_document" | "selfie_video",
  metadata?: { title?: string; description?: string },
) {
  const form = new FormData();
  appendAsset(form, asset);
  form.append("image_type", imageType);
  if (metadata?.title) form.append("title", metadata.title);
  if (metadata?.description) form.append("description", metadata.description);
  return api<{ image: { id: string; image_url: string; image_type: string } }>(
    "/api/upload",
    { method: "POST", body: form },
  );
}

export async function uploadWorkImage(
  asset: ImagePickerAsset,
  inquiryId: string,
) {
  const form = new FormData();
  appendAsset(form, asset);
  form.append("image_type", "work_image");
  form.append("inquiry_id", inquiryId);
  return api<{ image: { id: string; image_url: string; image_type: string } }>(
    "/api/upload",
    {
      method: "POST",
      body: form,
    },
  );
}

export async function uploadDocumentFile(
  asset: UploadAsset,
  folder = "anyjob/documents",
) {
  const form = new FormData();
  appendAsset(form, asset);
  form.append("folder", folder);
  return api<{
    url: string;
    publicId: string;
    fileName: string;
    contentType: string;
  }>("/api/upload/document", { method: "POST", body: form });
}
