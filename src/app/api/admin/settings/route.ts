import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";

export async function POST(request: Request) {
  try {
    const admin = await getAdminApiUser();
    if (!admin) return adminForbidden();

    const body = await request.json();
    const settings: unknown[] = Array.isArray(body.settings) ? body.settings : [];
    const now = new Date().toISOString();
    const rows = settings
      .filter((item: unknown): item is { key: string; value: string; groupTitle: string } => {
        if (!item || typeof item !== "object") return false;
        const record = item as Record<string, unknown>;
        return typeof record.key === "string" && typeof record.value === "string";
      })
      .map((item) => ({
        key: item.key,
        value: item.value,
        group_title: item.groupTitle || "General",
        updated_by: admin.id,
        updated_at: now,
      }));

    if (!rows.length) {
      return NextResponse.json({ error: "No settings provided" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient() as never as {
      from(table: string): {
        upsert(values: Record<string, unknown>[], options?: { onConflict?: string }): Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await supabase.from("admin_settings").upsert(rows, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAdminAction({
      actorId: admin.id,
      action: "settings.save",
      targetType: "admin_settings",
      metadata: { keys: rows.map((row) => row.key) },
    });

    return NextResponse.json({ ok: true, message: `Saved ${rows.length} setting${rows.length === 1 ? "" : "s"}.` });
  } catch (error) {
    console.error("Admin settings save failed:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
