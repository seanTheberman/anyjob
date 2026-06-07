import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RoleLookupClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        single(): Promise<{ data: { role?: string | null } | null; error: unknown }>;
      };
    };
  };
};

export async function getCurrentAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const client = supabase as never as RoleLookupClient;
  const [elooProfile, userProfile] = await Promise.all([
    client.from("eloo_profiles").select("role").eq("id", user.id).single(),
    client.from("user_profiles").select("role").eq("id", user.id).single(),
  ]);

  const role = String(elooProfile.data?.role || userProfile.data?.role || "").toLowerCase();
  if (role !== "admin") return null;

  return user;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin-login");
  return admin;
}
