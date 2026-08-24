import { supabase } from "./supabase";
import { API_URL } from "./config";

export { API_URL } from "./config";

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

export async function fetchApiResponse(path: string, init: RequestInit = {}) {
  try {
    return await fetch(`${API_URL}${path}`, { ...init, cache: "no-store" });
  } catch (error) {
    throw new ApiError(
      "AnyJob could not reach the server. Check your connection and try again.",
      0,
      error instanceof Error ? error.message : error,
    );
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (!headers.has("Authorization") && session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);

  const response = await fetchApiResponse(path, { ...init, headers });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload ? String(payload.error) : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }
  return payload as T;
}

export const jsonBody = (value: unknown): RequestInit => ({ body: JSON.stringify(value) });
