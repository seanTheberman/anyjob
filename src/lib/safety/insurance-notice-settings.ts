import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  DEFAULT_INSURANCE_NOTICE,
  INSURANCE_NOTICE_SETTING_KEYS,
  PLATFORM_WARNING_MESSAGES_KEY,
  parseInsuranceNoticeCopy,
  type InsuranceNoticeCopy,
} from "./insurance-notice-copy";

type AdminSettingRow = {
  key: string;
  value: string | null;
};

export async function getProviderInsuranceNotice(): Promise<InsuranceNoticeCopy> {
  try {
    const keys = [...Object.values(INSURANCE_NOTICE_SETTING_KEYS), PLATFORM_WARNING_MESSAGES_KEY];
    const supabase = createAdminSupabaseClient() as never as {
      from(table: string): {
        select(columns: string): {
          in(column: string, values: string[]): Promise<{ data: AdminSettingRow[] | null; error: { message: string } | null }>;
        };
      };
    };

    const { data, error } = await supabase.from("admin_settings").select("key,value").in("key", keys);
    if (error) {
      console.warn("Provider insurance notice settings fallback:", error.message);
      return DEFAULT_INSURANCE_NOTICE;
    }

    return parseInsuranceNoticeCopy(new Map((data || []).map((setting) => [setting.key, setting.value])));
  } catch (error) {
    console.warn("Provider insurance notice settings unavailable:", error);
    return DEFAULT_INSURANCE_NOTICE;
  }
}
