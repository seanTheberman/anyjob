import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";
import { notifyJobEvent } from "@/lib/notifications/email-functions";

const actions = ["refresh", "approve", "request_info", "mark_live", "start", "complete", "reject", "cancel", "expire"] as const;
type JobAction = (typeof actions)[number];
type JobSource = "service_inquiry" | "business_work_post";

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
    const source: JobSource = body.source === "business_work_post" ? "business_work_post" : "service_inquiry";
    if (!jobId) return NextResponse.json({ error: "No job selected" }, { status: 400 });
    if (!isJobAction(action)) return NextResponse.json({ error: "Invalid job action" }, { status: 400 });

    const supabase = createAdminSupabaseClient() as never as {
      from(table: string): any;
    };
    const now = new Date().toISOString();
    const serviceStatusByAction: Partial<Record<JobAction, string>> = {
      approve: "approved",
      mark_live: "approved",
      request_info: "more_info_needed",
      reject: "rejected",
      start: "in_progress",
      complete: "completed",
      cancel: "rejected",
      expire: "expired",
    };
    const businessStatusByAction: Partial<Record<JobAction, string>> = {
      approve: "approved",
      mark_live: "approved",
      request_info: "more_info_needed",
      reject: "rejected",
      start: "filled",
      complete: "completed",
      cancel: "rejected",
      expire: "cancelled",
    };
    const legacyServiceStatusByAction: Partial<Record<JobAction, string>> = {
      approve: "submitted",
      mark_live: "submitted",
      request_info: "pending",
      reject: "expired",
      cancel: "expired",
      expire: "expired",
    };
    const legacyBusinessStatusByAction: Partial<Record<JobAction, string>> = {
      approve: "submitted",
      mark_live: "submitted",
      request_info: "draft",
      reject: "cancelled",
      cancel: "cancelled",
      expire: "cancelled",
    };

    const table = source === "business_work_post" ? "business_work_posts" : "service_inquiries";
    const selectColumns = source === "business_work_post"
      ? "id,owner_user_id,description,industry,niche,city"
      : "id,user_id,job_description,category_slug,subcategory_slug,city";
    const { data: job, error: jobError } = await supabase
      .from(table)
      .select(selectColumns)
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const preferredStatus = source === "business_work_post" ? businessStatusByAction[action] : serviceStatusByAction[action];
    const legacyStatus = source === "business_work_post" ? legacyBusinessStatusByAction[action] : legacyServiceStatusByAction[action];
    let nextStatus = preferredStatus;
    let update = nextStatus ? { status: nextStatus, updated_at: now } : { updated_at: now };
    let { error } = await supabase.from(table).update(update).eq("id", jobId);
    if (error && legacyStatus && legacyStatus !== preferredStatus && ["22P02", "23514"].includes(String(error.code || ""))) {
      nextStatus = legacyStatus;
      update = { status: legacyStatus, updated_at: now };
      const retry = await supabase.from(table).update(update).eq("id", jobId);
      error = retry.error;
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const recipientId = source === "business_work_post" ? job.owner_user_id : job.user_id;
    if (action === "request_info" && recipientId) {
      const note = typeof body.message === "string" && body.message.trim()
        ? body.message.trim()
        : "Please add more details, photos, timing, budget, or access instructions so providers can quote accurately.";

      const { error: notificationError } = await supabase.from("eloo_notifications").insert({
        user_id: recipientId,
        title: "More information needed for your job",
        message: note,
        type: "job_more_info_requested",
        action_url: source === "business_work_post" ? "/dashboard/business" : `/dashboard/requests/${jobId}`,
        is_read: false,
        data: {
          job_id: jobId,
          source,
          status: nextStatus,
          requested_by: admin.id,
        },
      });

      if (notificationError) return NextResponse.json({ error: notificationError.message }, { status: 500 });
    }

    if (["approve", "mark_live"].includes(action) && nextStatus && ["approved", "submitted"].includes(nextStatus)) {
      await notifyJobEvent({
        action: "job_marked_live",
        source,
        jobId,
        status: nextStatus,
      });
    }

    await logAdminAction({
      actorId: admin.id,
      action: `jobs.${action}`,
      targetType: source,
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
          : action === "reject"
            ? "Job rejected."
          : nextStatus === "approved" || nextStatus === "submitted"
            ? "Job marked live."
            : `Job marked ${nextStatus?.replaceAll("_", " ")}.`,
    });
  } catch (error) {
    console.error("Admin job action failed:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}
