export function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function createToken(bytes = 32) {
  const raw = new Uint8Array(bytes);
  crypto.getRandomValues(raw);
  return Array.from(raw, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function addHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function toPublicUrl(req: Request, path: string) {
  const configured =
    Deno.env.get("APP_URL") ||
    Deno.env.get("SITE_URL") ||
    req.headers.get("origin") ||
    "https://anyjob.eu";
  return `${configured.replace(/\/$/, "")}${path}`;
}
