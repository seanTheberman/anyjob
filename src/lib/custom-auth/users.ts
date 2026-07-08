import "server-only";

import bcrypt from "bcryptjs";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type UpsertCustomAuthUserInput = {
  supabaseUserId: string;
  email: string;
  password: string;
  role: "buyer" | "client" | "provider" | "seller" | "business" | "admin";
  metadata?: Record<string, unknown>;
};

export async function upsertCustomAuthUser(input: UpsertCustomAuthUserInput) {
  try {
    const supabase = createAdminSupabaseClient() as any;
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", "default")
      .maybeSingle();

    if (tenantError || !tenant) {
      console.error("Custom auth tenant lookup failed:", tenantError);
      return { ok: false };
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const { error } = await supabase
      .from("custom_auth_users")
      .upsert(
        {
          tenant_id: tenant.id,
          supabase_user_id: input.supabaseUserId,
          email: input.email.toLowerCase(),
          password_hash: passwordHash,
          role: input.role,
          status: "active",
          metadata: input.metadata || {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,email" }
      );

    if (error) {
      console.error("Custom auth user upsert failed:", error);
      return { ok: false };
    }

    return { ok: true };
  } catch (error) {
    console.error("Custom auth user upsert failed:", error);
    return { ok: false };
  }
}
