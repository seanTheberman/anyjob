import { createAdminClient } from "../supabase-admin.ts";
import type { TenantContext } from "../tenant-email.ts";
import {
  type AnyRow,
  compactDescription,
  createInAppNotification,
  fullAppUrl,
  getBusinessPost,
  getServiceInquiry,
  label,
  LIVE_STATUSES,
  sendNotificationEmail,
} from "./core.ts";

async function notifyProvidersForServiceJob(context: TenantContext, job: AnyRow) {
  if (!LIVE_STATUSES.includes(String(job.status || "").toLowerCase())) {
    return { sent: 0, skipped: "not_live" };
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("sellers")
    .select("id,email,first_name,last_name,service_category,status")
    .eq("status", "approved")
    .neq("id", job.user_id)
    .limit(50);

  if (job.category_slug) {
    query = query.eq("service_category", job.category_slug);
  }

  const { data: sellers, error } = await query;
  if (error) throw error;

  const title = label(job.subcategory_slug || job.category_slug, "New job");
  const body = `<p>A new ${label(job.category_slug)} job is live near ${job.city || "your service area"}.</p><p>${compactDescription(job.job_description)}</p>`;
  const results = [];

  for (const seller of sellers || []) {
    results.push(
      await sendNotificationEmail(context, {
        eventKey: "jobs.provider_live_job",
        dedupeKey: `provider-live-job:service_inquiries:${job.id}:${seller.id}`,
        userId: seller.id,
        email: seller.email,
        subject: `New AnyJob lead: ${title}`,
        title: "New job available",
        body,
        actionLabel: "View job",
        actionUrl: fullAppUrl(context, `/pro/jobs/${job.id}`),
        sourceTable: "service_inquiries",
        sourceId: job.id,
        metadata: { category_slug: job.category_slug, subcategory_slug: job.subcategory_slug },
      })
    );
  }

  return { sent: results.filter((result) => (result as AnyRow).sent).length, total: results.length };
}

async function notifyShiftWorkersForBusinessPost(context: TenantContext, post: AnyRow) {
  if (!LIVE_STATUSES.includes(String(post.status || "").toLowerCase())) {
    return { sent: 0, skipped: "not_live" };
  }

  const supabase = createAdminClient();
  const { data: profiles, error } = await supabase
    .from("shift_worker_profiles")
    .select("user_id,niches,status")
    .eq("status", "available")
    .contains("niches", post.niche ? [post.niche] : [])
    .limit(50);

  if (error) throw error;

  const title = label(post.role_title || post.niche, "Shift work");
  const body = `<p>A business posted ${label(post.work_type)} work for ${label(post.niche || post.industry)} in ${post.city || "your area"}.</p><p>${compactDescription(post.description)}</p>`;
  const results = [];

  for (const profile of profiles || []) {
    results.push(
      await sendNotificationEmail(context, {
        eventKey: "jobs.shift_live_post",
        dedupeKey: `shift-live-post:business_work_posts:${post.id}:${profile.user_id}`,
        userId: profile.user_id,
        subject: `New shift opportunity: ${title}`,
        title: "New shift work available",
        body,
        actionLabel: "View shifts",
        actionUrl: fullAppUrl(context, "/pro/shifts"),
        sourceTable: "business_work_posts",
        sourceId: post.id,
        metadata: { niche: post.niche, industry: post.industry, work_type: post.work_type },
      })
    );
  }

  return { sent: results.filter((result) => (result as AnyRow).sent).length, total: results.length };
}

export async function notifyJobMarkedLive(context: TenantContext, source: string, jobId: string) {
  if (source === "business_work_post") {
    const post = await getBusinessPost(jobId);
    if (!post) return { error: "business_post_not_found" };

    await createInAppNotification({
      userId: post.owner_user_id,
      title: "Your business post is live",
      message: `${label(post.role_title || post.niche)} is now visible to eligible shift workers.`,
      type: "business_post_live",
      actionUrl: "/dashboard/business",
      data: { source, job_id: jobId },
    });

    await sendNotificationEmail(context, {
      eventKey: "jobs.business_owner_live",
      dedupeKey: `business-owner-live:${jobId}`,
      userId: post.owner_user_id,
      subject: "Your AnyJob business post is live",
      title: "Your post is live",
      body: `<p>${label(post.role_title || post.niche)} has been approved and is visible to eligible workers.</p>`,
      actionLabel: "Open business portal",
      actionUrl: fullAppUrl(context, "/dashboard/business"),
      sourceTable: "business_work_posts",
      sourceId: jobId,
    });

    const providerResult = await notifyShiftWorkersForBusinessPost(context, post);
    return { owner: true, providers: providerResult };
  }

  const job = await getServiceInquiry(jobId);
  if (!job) return { error: "service_inquiry_not_found" };

  await createInAppNotification({
    userId: job.user_id,
    title: "Your job is live",
    message: `${label(job.subcategory_slug || job.category_slug)} is now visible to providers.`,
    type: "job_live",
    actionUrl: `/dashboard/requests/${job.id}`,
    data: { source, job_id: jobId },
  });

  await sendNotificationEmail(context, {
    eventKey: "jobs.buyer_live",
    dedupeKey: `buyer-live:${jobId}`,
    userId: job.user_id,
    email: job.email,
    subject: "Your AnyJob request is live",
    title: "Your job is live",
    body: `<p>Your ${label(job.subcategory_slug || job.category_slug)} request has been approved and is visible to providers.</p>`,
    actionLabel: "Open request",
    actionUrl: fullAppUrl(context, `/dashboard/requests/${job.id}`),
    sourceTable: "service_inquiries",
    sourceId: jobId,
  });

  const providerResult = await notifyProvidersForServiceJob(context, job);
  return { buyer: true, providers: providerResult };
}
