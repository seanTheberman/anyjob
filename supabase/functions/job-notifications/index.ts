import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient, requireServiceRole } from "../_shared/supabase-admin.ts";
import { cleanText } from "../_shared/tokens.ts";
import { brandedEmail, getTenantContext, queueAndSendEmail, type TenantContext } from "../_shared/tenant-email.ts";

type AnyRow = Record<string, any>;

const LIVE_STATUSES = ["submitted", "approved"];
const CLOSED_STATUSES = ["accepted", "bid_accepted", "in_progress", "completed", "cancelled", "expired", "rejected", "filled"];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function label(value: unknown, fallback = "job") {
  const text = String(value || fallback).replaceAll("-", " ").replaceAll("_", " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : fallback;
}

function compactDescription(value: unknown) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

async function profileForUser(userId?: string | null) {
  if (!userId) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("eloo_profiles")
    .select("id,email,first_name,last_name,role")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

async function createInAppNotification(input: {
  userId?: string | null;
  title: string;
  message: string;
  type: string;
  actionUrl?: string | null;
  data?: Record<string, unknown>;
}) {
  if (!input.userId) return;
  const supabase = createAdminClient();
  await supabase.from("eloo_notifications").insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    action_url: input.actionUrl || null,
    is_read: false,
    data: input.data || {},
  });
}

async function emailForUser(userId?: string | null, fallback?: string | null) {
  if (fallback) return fallback;
  const profile = await profileForUser(userId);
  return profile?.email || null;
}

async function sendJobEmail(
  context: TenantContext,
  input: {
    eventKey: string;
    dedupeKey: string;
    userId?: string | null;
    email?: string | null;
    subject: string;
    title: string;
    body: string;
    actionLabel?: string;
    actionUrl?: string;
    sourceTable?: string;
    sourceId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const recipientEmail = await emailForUser(input.userId, input.email);
  if (!recipientEmail) return { skipped: true, reason: "missing_recipient_email" };

  return queueAndSendEmail(context, {
    eventKey: input.eventKey,
    dedupeKey: input.dedupeKey,
    recipientUserId: input.userId || null,
    recipientEmail,
    subject: input.subject,
    html: brandedEmail(
      input.title,
      input.body,
      input.actionUrl && input.actionLabel ? { label: input.actionLabel, url: input.actionUrl } : undefined
    ),
    sourceTable: input.sourceTable || null,
    sourceId: input.sourceId || null,
    metadata: input.metadata || {},
  });
}

async function getServiceInquiry(jobId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("service_inquiries")
    .select("id,user_id,email,first_name,last_name,category_slug,subcategory_slug,job_description,city,status,submitted_at,created_at")
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getBusinessPost(jobId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("business_work_posts")
    .select("id,owner_user_id,business_id,work_type,industry,niche,role_title,description,city,status,created_at")
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

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
      await sendJobEmail(context, {
        eventKey: "jobs.provider_live_job",
        dedupeKey: `provider-live-job:service_inquiries:${job.id}:${seller.id}`,
        userId: seller.id,
        email: seller.email,
        subject: `New AnyJob lead: ${title}`,
        title: "New job available",
        body,
        actionLabel: "View job",
        actionUrl: `${context.tenant.app_url || "https://anyjob.eu"}/pro/jobs/${job.id}`,
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
      await sendJobEmail(context, {
        eventKey: "jobs.shift_live_post",
        dedupeKey: `shift-live-post:business_work_posts:${post.id}:${profile.user_id}`,
        userId: profile.user_id,
        subject: `New shift opportunity: ${title}`,
        title: "New shift work available",
        body,
        actionLabel: "View shifts",
        actionUrl: `${context.tenant.app_url || "https://anyjob.eu"}/pro/shifts`,
        sourceTable: "business_work_posts",
        sourceId: post.id,
        metadata: { niche: post.niche, industry: post.industry, work_type: post.work_type },
      })
    );
  }

  return { sent: results.filter((result) => (result as AnyRow).sent).length, total: results.length };
}

async function notifyJobMarkedLive(context: TenantContext, source: string, jobId: string) {
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

    await sendJobEmail(context, {
      eventKey: "jobs.business_owner_live",
      dedupeKey: `business-owner-live:${jobId}`,
      userId: post.owner_user_id,
      subject: "Your AnyJob business post is live",
      title: "Your post is live",
      body: `<p>${label(post.role_title || post.niche)} has been approved and is visible to eligible workers.</p>`,
      actionLabel: "Open business portal",
      actionUrl: `${context.tenant.app_url || "https://anyjob.eu"}/dashboard/business`,
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

  await sendJobEmail(context, {
    eventKey: "jobs.buyer_live",
    dedupeKey: `buyer-live:${jobId}`,
    userId: job.user_id,
    email: job.email,
    subject: "Your AnyJob request is live",
    title: "Your job is live",
    body: `<p>Your ${label(job.subcategory_slug || job.category_slug)} request has been approved and is visible to providers.</p>`,
    actionLabel: "Open request",
    actionUrl: `${context.tenant.app_url || "https://anyjob.eu"}/dashboard/requests/${job.id}`,
    sourceTable: "service_inquiries",
    sourceId: jobId,
  });

  const providerResult = await notifyProvidersForServiceJob(context, job);
  return { buyer: true, providers: providerResult };
}

async function notifyPaymentAccepted(context: TenantContext, body: AnyRow) {
  const job = await getServiceInquiry(cleanText(body.jobId || body.inquiryId));
  if (!job) return { error: "service_inquiry_not_found" };

  const providerUserId = cleanText(body.providerUserId);
  const buyerUserId = cleanText(body.buyerUserId || job.user_id);
  const providerProfile = await profileForUser(providerUserId);

  await createInAppNotification({
    userId: buyerUserId,
    title: "Booking confirmed",
    message: "Your first payment is complete. Chat and job coordination are now unlocked.",
    type: "booking_payment_confirmed",
    actionUrl: `/dashboard/requests/${job.id}`,
    data: { job_id: job.id, provider_user_id: providerUserId },
  });

  await createInAppNotification({
    userId: providerUserId,
    title: "Your quote was accepted",
    message: "The buyer has paid the booking confirmation. You can now coordinate the job.",
    type: "provider_quote_accepted",
    actionUrl: `/pro/jobs/${job.id}`,
    data: { job_id: job.id, buyer_user_id: buyerUserId },
  });

  await sendJobEmail(context, {
    eventKey: "jobs.buyer_payment_accepted",
    dedupeKey: `buyer-payment-accepted:${job.id}:${body.bidId || ""}`,
    userId: buyerUserId,
    email: job.email,
    subject: "Your AnyJob booking is confirmed",
    title: "Booking confirmed",
    body: `<p>Your first payment is complete and the provider can now coordinate the job with you.</p><p>${providerProfile?.first_name ? `Provider: ${providerProfile.first_name}` : ""}</p>`,
    actionLabel: "Open request",
    actionUrl: `${context.tenant.app_url || "https://anyjob.eu"}/dashboard/requests/${job.id}`,
    sourceTable: "service_inquiries",
    sourceId: job.id,
  });

  await sendJobEmail(context, {
    eventKey: "jobs.provider_quote_accepted",
    dedupeKey: `provider-quote-accepted:${job.id}:${body.bidId || ""}`,
    userId: providerUserId,
    subject: "Your AnyJob quote was accepted",
    title: "Quote accepted",
    body: "<p>The buyer has paid the booking confirmation. Chat and coordination are now unlocked.</p>",
    actionLabel: "Open job",
    actionUrl: `${context.tenant.app_url || "https://anyjob.eu"}/pro/jobs/${job.id}`,
    sourceTable: "service_inquiries",
    sourceId: job.id,
  });

  return { ok: true };
}

async function processLiveJobReminders(context: TenantContext) {
  const supabase = createAdminClient();
  const date = todayKey();
  const results: AnyRow[] = [];

  const { data: inquiries, error: inquiriesError } = await supabase
    .from("service_inquiries")
    .select("id,user_id,email,category_slug,subcategory_slug,job_description,city,status,submitted_at,created_at")
    .in("status", LIVE_STATUSES)
    .limit(100);

  if (inquiriesError) throw inquiriesError;

  for (const job of inquiries || []) {
    if (CLOSED_STATUSES.includes(String(job.status || "").toLowerCase())) continue;
    const result = await sendJobEmail(context, {
      eventKey: "jobs.buyer_live_reminder",
      dedupeKey: `buyer-live-reminder:service_inquiries:${job.id}:${date}`,
      userId: job.user_id,
      email: job.email,
      subject: "Your AnyJob request is still live",
      title: "Your request is still live",
      body: `<p>Your ${label(job.subcategory_slug || job.category_slug)} request is still visible to providers.</p><p>We will keep reminding you every 24 hours until it is accepted or started.</p>`,
      actionLabel: "Open request",
      actionUrl: `${context.tenant.app_url || "https://anyjob.eu"}/dashboard/requests/${job.id}`,
      sourceTable: "service_inquiries",
      sourceId: job.id,
    });
    results.push({ source: "service_inquiries", id: job.id, result });
  }

  const { data: posts, error: postsError } = await supabase
    .from("business_work_posts")
    .select("id,owner_user_id,role_title,niche,industry,work_type,description,city,status,created_at")
    .in("status", LIVE_STATUSES)
    .limit(100);

  if (postsError) throw postsError;

  for (const post of posts || []) {
    if (CLOSED_STATUSES.includes(String(post.status || "").toLowerCase())) continue;
    const result = await sendJobEmail(context, {
      eventKey: "jobs.business_live_reminder",
      dedupeKey: `business-live-reminder:business_work_posts:${post.id}:${date}`,
      userId: post.owner_user_id,
      subject: "Your AnyJob business post is still live",
      title: "Your business post is still live",
      body: `<p>Your ${label(post.role_title || post.niche)} post is still visible to eligible workers.</p><p>We will keep reminding you every 24 hours until it is filled, accepted, or started.</p>`,
      actionLabel: "Open business portal",
      actionUrl: `${context.tenant.app_url || "https://anyjob.eu"}/dashboard/business`,
      sourceTable: "business_work_posts",
      sourceId: post.id,
    });
    results.push({ source: "business_work_posts", id: post.id, result });
  }

  return { processed: results.length, results };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  if (!requireServiceRole(req)) return jsonResponse({ error: "Unauthorized" }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    const action = cleanText(body.action);
    const tenantSlug = cleanText(body.tenantSlug, "default");
    const context = await getTenantContext(tenantSlug);

    if (action === "job_marked_live") {
      const jobId = cleanText(body.jobId);
      const source = cleanText(body.source, "service_inquiry");
      if (!jobId) return jsonResponse({ error: "jobId is required" }, 400);
      return jsonResponse(await notifyJobMarkedLive(context, source, jobId));
    }

    if (action === "job_payment_accepted" || action === "job_status_changed") {
      return jsonResponse(await notifyPaymentAccepted(context, body));
    }

    if (action === "process_live_job_reminders") {
      return jsonResponse(await processLiveJobReminders(context));
    }

    return jsonResponse({ error: "Unknown notification action" }, 400);
  } catch (error) {
    console.error("job-notifications failed", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Notification processing failed" }, 500);
  }
});
