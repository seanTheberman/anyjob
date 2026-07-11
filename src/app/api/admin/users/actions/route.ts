import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";

const actions = ["message", "watchlist", "suspend", "block", "unsuspend", "unblock", "open"] as const;
type UserAction = (typeof actions)[number];

function isUserAction(value: unknown): value is UserAction {
  return typeof value === "string" && actions.includes(value as UserAction);
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminApiUser();
    if (!admin) return adminForbidden();

    const body = await request.json();
    const action = String(body.action || "").toLowerCase();
    const userIds: string[] = Array.isArray(body.userIds)
      ? body.userIds.filter((id: unknown) => typeof id === "string" && id.length > 0)
      : [];

    if (!isUserAction(action)) {
      return NextResponse.json({ error: "Invalid user action" }, { status: 400 });
    }
    if (!userIds.length) {
      return NextResponse.json({ error: "No users selected" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient() as never as {
      from(table: string): {
        upsert(values: Record<string, unknown>[], options?: { onConflict?: string }): Promise<{ error: { message: string } | null }>;
        update(values: Record<string, unknown>): {
          in(column: string, values: string[]): Promise<{ error: { message: string } | null }>;
        };
      };
    };
    const now = new Date().toISOString();
    let status: "active" | "watchlisted" | "blocked" | null = null;
    if (action === "block" || action === "suspend") status = "blocked";
    if (action === "watchlist") status = "watchlisted";
    if (action === "unblock" || action === "unsuspend") status = "active";

    if (status) {
      const rows = userIds.map((userId) => ({
        user_id: userId,
        status,
        risk_override: status === "blocked" ? "High" : status === "watchlisted" ? "Medium" : null,
        note: `${action} by admin`,
        updated_by: admin.id,
        updated_at: now,
      }));

      const { error } = await supabase.from("admin_user_flags").upsert(rows, { onConflict: "user_id" });
      const flagWriteSkipped = error && /admin_user_flags|relation .*does not exist|schema cache/i.test(error.message);
      if (error && !flagWriteSkipped) return NextResponse.json({ error: error.message }, { status: 500 });

      if (status === "blocked" || status === "active") {
        const isActive = status === "active";
        const updates = [
          supabase.from("user_profiles").update({ is_active: isActive, updated_at: now }).in("id", userIds),
          supabase.from("eloo_profiles").update({ is_active: isActive, updated_at: now }).in("id", userIds),
          supabase.from("buyers").update({ is_active: isActive, updated_at: now }).in("id", userIds),
        ];
        const results = await Promise.allSettled(updates);
        const hardError = results.find((result) => result.status === "fulfilled" && result.value.error && !/column .*is_active|schema cache/i.test(result.value.error.message));
        if (hardError?.status === "fulfilled") {
          return NextResponse.json({ error: hardError.value.error?.message || "Failed to update user active state" }, { status: 500 });
        }
      }
    }

    await logAdminAction({
      actorId: admin.id,
      action: `users.${action}`,
      targetType: "user",
      targetId: userIds.join(","),
      metadata: { userIds },
    });

    return NextResponse.json({
      ok: true,
      action,
      userIds,
      status,
      message: `${action} completed for ${userIds.length} user${userIds.length === 1 ? "" : "s"}.`,
    });
  } catch (error) {
    console.error("Admin user action failed:", error);
    return NextResponse.json({ error: "Failed to update users" }, { status: 500 });
  }
}
