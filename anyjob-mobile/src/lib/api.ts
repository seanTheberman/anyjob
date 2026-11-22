import { supabase } from "./supabase";
import { API_URL } from "./config";

export { API_URL } from "./config";

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

type FetchApiOptions = {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
};

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function fetchApiResponse(
  path: string,
  init: RequestInit = {},
  options: FetchApiOptions = {},
) {
  const retries = Math.max(0, options.retries || 0);
  const timeoutMs = Math.max(0, options.timeoutMs || 0);
  let lastError: unknown;
  let lastAttemptTimedOut = false;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = timeoutMs ? new AbortController() : null;
    const sourceSignal = init.signal;
    let timedOut = false;
    const abortFromSource = () => controller?.abort();
    const timeout = controller
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs)
      : null;

    if (controller && sourceSignal) {
      if (sourceSignal.aborted) controller.abort();
      else sourceSignal.addEventListener("abort", abortFromSource, { once: true });
    }

    try {
      return await fetch(`${API_URL}${path}`, {
        ...init,
        signal: controller?.signal || sourceSignal,
        cache: "no-store",
      });
    } catch (error) {
      if (sourceSignal?.aborted) throw error;
      lastError = error;
      lastAttemptTimedOut = timedOut;
      if (attempt < retries) {
        await delay((options.retryDelayMs || 400) * (attempt + 1));
      }
    } finally {
      if (timeout) clearTimeout(timeout);
      sourceSignal?.removeEventListener("abort", abortFromSource);
    }
  }

  throw new ApiError(
    lastAttemptTimedOut
      ? "AnyJob took too long to respond. Please try again."
      : "AnyJob could not reach the server. Check your connection and try again.",
    0,
    lastError instanceof Error ? lastError.message : lastError,
  );
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  const method = (init.method || "GET").toUpperCase();
  headers.set("Accept", "application/json");
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (!headers.has("Authorization") && session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);

  const response = await fetchApiResponse(path, { ...init, headers }, {
    timeoutMs: method === "GET" ? 12_000 : 45_000,
    retries: method === "GET" ? 1 : 0,
    retryDelayMs: 350,
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload ? String(payload.error) : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }
  return payload as T;
}

export const jsonBody = (value: unknown): RequestInit => ({ body: JSON.stringify(value) });
