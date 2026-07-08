import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function requireServiceRole(req: Request) {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  const apiKey = req.headers.get("apikey") || "";

  if (serviceRoleKey && (bearer === serviceRoleKey || apiKey === serviceRoleKey)) {
    return true;
  }

  try {
    const payload = JSON.parse(atob(bearer.split(".")[1] || "")) as { role?: string };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}
