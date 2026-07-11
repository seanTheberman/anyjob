import "server-only";

type SupabaseLike = {
  from: (table: string) => any;
};

export type BuyerKycStatus = {
  isComplete: boolean;
  status: string;
  adminOverride: boolean;
  missing: string[];
};

function normalizedTitle(row: { title?: string | null; description?: string | null }) {
  return `${row.title || ""} ${row.description || ""}`.toLowerCase();
}

export async function getBuyerKycStatus(supabase: SupabaseLike, userId: string): Promise<BuyerKycStatus> {
  const [{ data: files }, { data: buyer }, { data: profile }] = await Promise.all([
    supabase
      .from("user_images")
      .select("id,image_type,title,description")
      .eq("user_id", userId)
      .in("image_type", ["id_document", "selfie_video"]),
    supabase
      .from("buyers")
      .select("id_document_url,selfie_video_url,kyc_status")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("eloo_profiles")
      .select("is_verified,kyc_status")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const imageRows = (files || []) as Array<{ image_type?: string | null; title?: string | null; description?: string | null }>;
  const idDocuments = imageRows.filter((file) => file.image_type === "id_document");
  const selfieVideos = imageRows.filter((file) => file.image_type === "selfie_video");
  const hasLegacyIdDocument = Boolean(buyer?.id_document_url);
  const hasLegacySelfieVideo = Boolean(buyer?.selfie_video_url);

  const hasFront = idDocuments.some((file) => normalizedTitle(file).includes("front")) || idDocuments.length >= 1 || hasLegacyIdDocument;
  const hasBack = idDocuments.some((file) => normalizedTitle(file).includes("back")) || idDocuments.length >= 2;
  const hasSelfieVideo = selfieVideos.length >= 1 || hasLegacySelfieVideo;
  const status = String(buyer?.kyc_status || profile?.kyc_status || "not_started").toLowerCase();
  const adminOverride =
    ["approved", "confirmed", "verified", "manual_override", "manually_verified"].includes(status) ||
    profile?.is_verified === true;

  if (adminOverride) {
    return {
      isComplete: true,
      status,
      adminOverride,
      missing: [],
    };
  }

  const missing = [
    hasFront ? null : "government ID front",
    hasBack ? null : "government ID back",
    hasSelfieVideo ? null : "selfie video",
    status === "rejected" ? "valid KYC status" : null,
  ].filter(Boolean) as string[];

  return {
    isComplete: missing.length === 0,
    status,
    adminOverride,
    missing,
  };
}
