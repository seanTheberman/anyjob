import "server-only";

import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RoleResult = { data: { role?: string | null } | null; error: unknown };

export async function getAdminApiUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const client = supabase as never as {
    from(table: string): {
      select(columns: string): {
        eq(column: string, value: string): {
          single(): Promise<RoleResult>;
        };
      };
    };
  };

  const [elooProfile, userProfile] = await Promise.all([
    client.from("eloo_profiles").select("role").eq("id", user.id).single(),
    client.from("user_profiles").select("role").eq("id", user.id).single(),
  ]);

  const role = String(elooProfile.data?.role || userProfile.data?.role || "").toLowerCase();
  return role === "admin" ? user : null;
}

export function adminForbidden() {
  return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
}

export async function logAdminAction(input: {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminSupabaseClient() as never as {
    from(table: string): {
      insert(values: Record<string, unknown>): Promise<{ error: unknown }>;
    };
  };
  await supabase.from("admin_action_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    target_type: input.targetType || "admin_item",
    target_id: input.targetId || null,
    metadata: input.metadata || {},
  });
}
