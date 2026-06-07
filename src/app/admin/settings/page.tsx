import { ShieldCheck } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AdminSettingsPanel } from "../_components/AdminSettingsPanel";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";

export const dynamic = "force-dynamic";

async function getSavedSettings() {
  const supabase = createAdminSupabaseClient() as never as {
    from(table: string): {
      select(columns: string): Promise<{ data: Array<{ key: string; value: string | null }> | null }>;
    };
  };
  const { data } = await supabase.from("admin_settings").select("key,value");
  return (data || []).map((setting) => ({ key: String(setting.key), value: String(setting.value || "") }));
}

export default async function AdminSettingsPage() {
  const savedSettings = await getSavedSettings();

  return (
    <AdminShell
      title="Settings"
      description="Configure marketplace rules, trust requirements, notification policy, payments, categories, and operational thresholds."
      actions={
        <>
          <AdminButtonLink href="/admin/history">
            <ShieldCheck className="h-4 w-4" />
            Audit changes
          </AdminButtonLink>
        </>
      }
    >
      <AdminSettingsPanel savedSettings={savedSettings} />
    </AdminShell>
  );
}
