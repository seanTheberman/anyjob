import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";

const actions = ["refresh", "approve", "request_info", "mark_live", "start", "complete", "cancel", "expire"] as const;
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
      from(table: string): any;
    };
    const now = new Date().toISOString();
    const statusByAction: Partial<Record<JobAction, string>> = {
      approve: "submitted",
      mark_live: "submitted",
      request_info: "needs_more_info",
      start: "in_progress",
      complete: "completed",
      cancel: "cancelled",
      expire: "expired",
    };

    const { data: job, error: jobError } = await supabase
      .from("service_inquiries")
      .select("id,user_id,job_description,category_slug,subcategory_slug,city")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const nextStatus = statusByAction[action];
    const update = nextStatus ? { status: nextStatus, updated_at: now } : { updated_at: now };
    const { error } = await supabase.from("service_inquiries").update(update).eq("id", jobId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (action === "request_info" && job.user_id) {
      const note = typeof body.message === "string" && body.message.trim()
        ? body.message.trim()
        : "Please add more details, photos, timing, budget, or access instructions so providers can quote accurately.";

      const { error: notificationError } = await supabase.from("eloo_notifications").insert({
        user_id: job.user_id,
        title: "More information needed for your job",
        message: note,
        type: "job_more_info_requested",
        action_url: `/dashboard/requests/${jobId}`,
        is_read: false,
        data: {
          job_id: jobId,
          status: nextStatus,
          requested_by: admin.id,
        },
      });

      if (notificationError) return NextResponse.json({ error: notificationError.message }, { status: 500 });
    }

    await logAdminAction({
      actorId: admin.id,
      action: `jobs.${action}`,
      targetType: "service_inquiry",
      targetId: jobId,
      metadata: {
        ...update,
        message: typeof body.message === "string" ? body.message : undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      message:
        action === "refresh"
          ? "Job refreshed."
          : action === "request_info"
            ? "Information request sent to the buyer."
            : action === "approve"
              ? "Job approved and live for providers."
          : nextStatus === "submitted"
            ? "Job marked live."
            : `Job marked ${nextStatus?.replaceAll("_", " ")}.`,
    });
  } catch (error) {
    console.error("Admin job action failed:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}
