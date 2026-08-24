import { NextResponse } from "next/server";

import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";
import { MOBILE_CONTENT_CATALOG, MOBILE_CONTENT_KEYS } from "@/lib/mobile-content/catalog";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const admin = await getAdminApiUser();
    if (!admin) return adminForbidden();

    const body = (await request.json().catch(() => ({}))) as { entries?: unknown };
    const entries = Array.isArray(body.entries) ? body.entries : [];
    const catalog = new Map(MOBILE_CONTENT_CATALOG.map((item) => [item.key, item]));
    const now = new Date().toISOString();
    const rows: Array<Record<string, unknown>> = [];

    for (const input of entries) {
      if (!input || typeof input !== "object") continue;
      const record = input as Record<string, unknown>;
      const key = typeof record.key === "string" ? record.key : "";
      const value = typeof record.value === "string" ? record.value.trim() : "";
      const definition = catalog.get(key);
      if (!definition || !MOBILE_CONTENT_KEYS.has(key)) continue;
      if (value.length > 4000) {
        return NextResponse.json({ error: `${definition.label} is too long.` }, { status: 400 });
      }
      if (definition.type === "url" && value) {
        let url: URL;
        try {
          url = new URL(value);
        } catch {
          return NextResponse.json({ error: `${definition.label} must be a valid HTTPS URL.` }, { status: 400 });
        }
        if (url.protocol !== "https:") {
          return NextResponse.json({ error: `${definition.label} must use HTTPS.` }, { status: 400 });
        }
      }
      rows.push({
        content_key: key,
        section: definition.section,
        label: definition.label,
        value,
        default_value: definition.defaultValue,
        description: definition.description,
        content_type: definition.type,
        is_active: true,
        updated_by: admin.id,
        updated_at: now,
      });
    }

    if (!rows.length) {
      return NextResponse.json({ error: "No valid content entries provided." }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient() as never as {
      from(table: string): {
        upsert(values: Array<Record<string, unknown>>, options: { onConflict: string }): Promise<{
          error: { message: string } | null;
        }>;
      };
    };
    const { error } = await supabase
      .from("app_content_entries")
      .upsert(rows, { onConflict: "content_key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAdminAction({
      actorId: admin.id,
      action: "mobile_content.save",
      targetType: "app_content_entries",
      metadata: { keys: rows.map((row) => row.content_key) },
    });

    return NextResponse.json({ ok: true, message: `Published ${rows.length} content updates.` });
  } catch (error) {
    console.error("Mobile content save failed:", error);
    return NextResponse.json({ error: "Failed to publish mobile content" }, { status: 500 });
  }
}
