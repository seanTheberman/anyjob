import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type NotificationRow = {
  id: string;
  title: string;
  message: string | null;
  type: string | null;
  action_url: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

function normalize(row: NotificationRow) {
  return {
    id: row.id,
    title: row.title,
    message: row.message || "",
    type: row.type || "system",
    actionUrl: row.action_url,
    isRead: row.is_read === true,
    createdAt: row.created_at,
  };
}

async function currentUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id || null;
}

async function notificationsClient() {
  try {
    return createAdminSupabaseClient();
  } catch {
    return createServerSupabaseClient();
  }
}

export async function GET(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 401 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit") || 100);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 100;
  const supabase = await notificationsClient();

  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("eloo_notifications")
      .select("id,title,message,type,action_url,is_read,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("eloo_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
  ]);

  if (error || !data) {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });
  }

  return NextResponse.json({
    notifications: data.map(normalize),
    unreadCount: count || 0,
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const markAll = body.markAll === true;

  if (!id && !markAll) {
    return NextResponse.json({ error: "Notification id or markAll is required" }, { status: 400 });
  }

  const supabase = await notificationsClient();
  const query = supabase
    .from("eloo_notifications")
    .update({ is_read: true })
    .eq("user_id", userId);

  const { error } = markAll ? await query.eq("is_read", false) : await query.eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
