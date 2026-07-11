import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  POLICY_DOCUMENTS,
  mergePolicySettings,
  policySettingKey,
  type CmsPolicyDocument,
} from "./policy-definitions";

type AdminSettingRow = {
  key: string;
  value: string | null;
};

export async function getCmsPolicyDocument(slug: CmsPolicyDocument["slug"]) {
  const fallback = POLICY_DOCUMENTS.find((document) => document.slug === slug);
  if (!fallback) return null;

  try {
    const keys = fallback.blocks.map((block) => policySettingKey(fallback.slug, block.key));
    const supabase = createAdminSupabaseClient() as never as {
      from(table: string): {
        select(columns: string): {
          in(column: string, values: string[]): Promise<{ data: AdminSettingRow[] | null; error: { message: string } | null }>;
        };
      };
    };

    const { data, error } = await supabase.from("admin_settings").select("key,value").in("key", keys);
    if (error) {
      console.warn("CMS policy settings fallback:", error.message);
      return fallback;
    }

    return mergePolicySettings(new Map((data || []).map((setting) => [setting.key, setting.value])), fallback);
  } catch (error) {
    console.warn("CMS policy settings unavailable:", error);
    return fallback;
  }
}
