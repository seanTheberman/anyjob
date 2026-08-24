import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient() as never as {
      from(table: string): {
        select(columns: string): {
          eq(column: string, value: boolean): Promise<{
            data: Array<{ content_key: string; value: string; updated_at: string }> | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    const { data, error } = await supabase
      .from("app_content_entries")
      .select("content_key,value,updated_at")
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const content = Object.fromEntries(
      (data || []).map((item) => [String(item.content_key), String(item.value || "")]),
    );
    const updatedAt = (data || []).reduce<string | null>((latest, item) => {
      if (!latest || item.updated_at > latest) return item.updated_at;
      return latest;
    }, null);

    return NextResponse.json(
      { content, updatedAt },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Mobile content fetch failed:", error);
    return NextResponse.json({ error: "Failed to load mobile content" }, { status: 500 });
  }
}
