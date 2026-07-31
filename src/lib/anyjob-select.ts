import crypto from "crypto";

const marker = "[ANYJOB_SELECT]";

export function anyJobSelectRequirements(note?: string | null) {
  const cleanNote = String(note || "").trim();
  return cleanNote ? `${marker}\n${cleanNote}` : marker;
}

export function isAnyJobSelectInquiry(inquiry: Record<string, any>) {
  return (
    inquiry.anyjob_select === true ||
    inquiry.admin_posted === true ||
    String(inquiry.specific_requirements || "").includes(marker) ||
    (String(inquiry.first_name || "").toLowerCase() === "anyjob" &&
      String(inquiry.last_name || "").toLowerCase() === "select")
  );
}

function tokenSecret() {
  return (
    process.env.ANYJOB_SELECT_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "anyjob-select-dev-token"
  );
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
}

export type AnyJobSelectTokenPayload = {
  inquiryId: string;
  bidId: string;
  recipientEmail: string;
  adminUserId?: string | null;
  createdAt: string;
};

export function createAnyJobSelectToken(payload: Omit<AnyJobSelectTokenPayload, "createdAt"> & { createdAt?: string }) {
  const body = base64Url(JSON.stringify({ ...payload, createdAt: payload.createdAt || new Date().toISOString() }));
  return `${body}.${sign(body)}`;
}

export function verifyAnyJobSelectToken(token: string): AnyJobSelectTokenPayload | null {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature || sign(body) !== signature) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AnyJobSelectTokenPayload;
    if (!payload.inquiryId || !payload.bidId || !payload.recipientEmail) return null;
    return payload;
  } catch {
    return null;
  }
}
