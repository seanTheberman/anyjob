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

async function readActionBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return { body: await request.json(), isFormPost: false };
  }

  const formData = await request.formData();
  const body: Record<string, any> = {};
  for (const [key, value] of (formData as any).entries()) {
    body[key] = typeof value === "string" ? value : "";
  }
  return {
    body,
    isFormPost: true,
  };
}

function redirectAfterFormPost(request: Request, redirectTo: unknown, params: Record<string, string>) {
  const fallback = new URL("/admin/jobs", request.url);
  let url = fallback;
  if (typeof redirectTo === "string" && redirectTo.trim()) {
    try {
      const candidate = new URL(redirectTo, request.url);
      if (candidate.origin === fallback.origin) {
        url = candidate;
      }
    } catch {
      url = fallback;
    }
  }
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  let isFormPost = false;
  let body: Record<string, any> = {};
  try {
    const admin = await getAdminApiUser();
    if (!admin) return adminForbidden();

    const parsed = await readActionBody(request);
    body = parsed.body;
    isFormPost = parsed.isFormPost;
    const action = String(body.action || "").toLowerCase();
    const jobId = typeof body.jobId === "string" ? body.jobId : "";
    const source: JobSource = body.source === "business_work_post" ? "business_work_post" : "service_inquiry";
    if (!jobId) {
      if (isFormPost) return redirectAfterFormPost(request, body.redirectTo, { adminJobError: "No job selected" });
      return NextResponse.json({ error: "No job selected" }, { status: 400 });
    }
    if (!isJobAction(action)) {
      if (isFormPost) return redirectAfterFormPost(request, body.redirectTo, { adminJobError: "Invalid job action" });
      return NextResponse.json({ error: "Invalid job action" }, { status: 400 });
    }

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
      expire: "expired",
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

    if (jobError) {
      if (isFormPost) return redirectAfterFormPost(request, body.redirectTo, { adminJobError: jobError.message });
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }
    if (!job) {
      if (isFormPost) return redirectAfterFormPost(request, body.redirectTo, { adminJobError: "Job not found" });
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const preferredStatus = source === "business_work_post" ? businessStatusByAction[action] : serviceStatusByAction[action];
    const legacyStatus = source === "business_work_post" ? legacyBusinessStatusByAction[action] : legacyServiceStatusByAction[action];
    let nextStatus = preferredStatus;
    let update = nextStatus ? { status: nextStatus, updated_at: now } : { updated_at: now };
    let updateResult = await supabase.from(table).update(update).eq("id", jobId).select("id,status").maybeSingle();
    let error = updateResult.error;
    if (error && legacyStatus && legacyStatus !== preferredStatus && ["22P02", "23514"].includes(String(error.code || ""))) {
      nextStatus = legacyStatus;
      update = { status: legacyStatus, updated_at: now };
      updateResult = await supabase.from(table).update(update).eq("id", jobId).select("id,status").maybeSingle();
      error = updateResult.error;
    }
    if (error) {
      if (isFormPost) return redirectAfterFormPost(request, body.redirectTo, { adminJobError: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!updateResult.data) {
      if (isFormPost) return redirectAfterFormPost(request, body.redirectTo, { adminJobError: "Job update did not affect any row" });
      return NextResponse.json({ error: "Job update did not affect any row" }, { status: 409 });
    }
    nextStatus = nextStatus ? String(updateResult.data.status || nextStatus) : nextStatus;

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

      if (notificationError) {
        if (isFormPost) return redirectAfterFormPost(request, body.redirectTo, { adminJobError: notificationError.message });
        return NextResponse.json({ error: notificationError.message }, { status: 500 });
      }
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

    const message =
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
          : `Job marked ${nextStatus?.replaceAll("_", " ")}.`;

    if (isFormPost) {
      return redirectAfterFormPost(request, body.redirectTo, {
        adminJobAction: action,
        adminJobStatus: String(nextStatus || ""),
        adminJobMessage: message,
      });
    }

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      message,
    });
  } catch (error) {
    console.error("Admin job action failed:", error);
    if (isFormPost) return redirectAfterFormPost(request, body.redirectTo, { adminJobError: "Failed to update job" });
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}
