import { createClient } from "@/lib/supabase/client";

const LOGOUT_TIMEOUT_MS = 1800;

async function postServerLogout() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), LOGOUT_TIMEOUT_MS);

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    // Client-side signOut below is the important part for unblocking the UI.
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function logoutClientSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("anyjob.headerAccount");
  }

  const supabase = createClient();
  await Promise.allSettled([
    supabase.auth.signOut(),
    postServerLogout(),
  ]);
}
