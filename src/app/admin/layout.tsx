import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getAdminAccess() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const client = supabase as never as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: { role?: string } | null; error: unknown }>;
        };
      };
    };
  };

  const [elooProfile, userProfile] = await Promise.all([
    client.from("eloo_profiles").select("role").eq("id", user.id).single(),
    client.from("user_profiles").select("role").eq("id", user.id).single(),
  ]);

  return elooProfile.data?.role === "admin" || userProfile.data?.role === "admin";
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const canAccessAdmin = await getAdminAccess();

  if (!canAccessAdmin) {
    redirect("/login");
  }

  return children;
}
