import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";

const actions = ["refresh", "expire"] as const;
type JobAction = (typeof actions)[number];

function isJobAction(value: unknown): value is JobAction {
  return typeof value === "string" && actions.includes(value as JobAction);
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminApiUser();
    if (!admin) return adminForbidden();

    const body = await request.json();
    const action = String(body.action || "").toLowerCase();
    const jobId = typeof body.jobId === "string" ? body.jobId : "";
    if (!jobId) return NextResponse.json({ error: "No job selected" }, { status: 400 });
    if (!isJobAction(action)) return NextResponse.json({ error: "Invalid job action" }, { status: 400 });

    const supabase = createAdminSupabaseClient() as never as {
      from(table: string): {
        update(values: Record<string, unknown>): {
          eq(column: string, value: string): Promise<{ error: { message: string } | null }>;
        };
      };
    };
    const now = new Date().toISOString();
    const update = action === "expire" ? { status: "expired", updated_at: now } : { updated_at: now };
    const { error } = await supabase.from("service_inquiries").update(update).eq("id", jobId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAdminAction({
      actorId: admin.id,
      action: `jobs.${action}`,
      targetType: "service_inquiry",
      targetId: jobId,
      metadata: update,
    });

    return NextResponse.json({
      ok: true,
      status: action === "expire" ? "expired" : undefined,
      message: action === "expire" ? "Job marked expired." : "Job refreshed.",
    });
  } catch (error) {
    console.error("Admin job action failed:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}
