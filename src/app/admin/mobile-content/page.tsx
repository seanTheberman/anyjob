import { History } from "lucide-react";

import { MOBILE_CONTENT_CATALOG } from "@/lib/mobile-content/catalog";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AdminMobileContentPanel } from "../_components/AdminMobileContentPanel";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { AdminShell } from "../_components/AdminShell";

export const dynamic = "force-dynamic";

async function getSavedEntries() {
  const supabase = createAdminSupabaseClient() as never as {
    from(table: string): {
      select(columns: string): Promise<{
        data: Array<{ content_key: string; value: string; updated_at: string | null }> | null;
      }>;
    };
  };
  const { data } = await supabase.from("app_content_entries").select("content_key,value,updated_at");
  return (data || []).map((item) => ({
    key: String(item.content_key),
    value: String(item.value || ""),
    updatedAt: item.updated_at,
  }));
}

export default async function AdminMobileContentPage() {
  const savedEntries = await getSavedEntries();
  return (
    <AdminShell
      title="App content"
      description="Publish buyer-facing mobile headings, banner copy, imagery, request steps, and core screen text without submitting a new native build."
      actions={
        <AdminButtonLink href="/admin/history">
          <History className="h-4 w-4" />
          Audit changes
        </AdminButtonLink>
      }
    >
      <AdminMobileContentPanel catalog={MOBILE_CONTENT_CATALOG} savedEntries={savedEntries} />
    </AdminShell>
  );
}
