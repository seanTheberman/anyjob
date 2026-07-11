import { createAdminClient } from "../supabase-admin.ts";
import { cleanText } from "../tokens.ts";
import type { TenantContext } from "../tenant-email.ts";
import {
  type AnyRow,
  createInAppNotification,
  fullAppUrl,
  label,
  LIVE_STATUSES,
  sendNotificationEmail,
} from "./core.ts";

const PROVIDER_PLAN_RULES_SETTING_KEY = "pricing_provider_plan_rules";
const DEFAULT_EXPIRY_DAYS = 7;

function olderThanDays(value: unknown, days: number) {
  const date = new Date(cleanText(value));
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() >= days * 24 * 60 * 60 * 1000;
}

async function configuredExpiryDays() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", PROVIDER_PLAN_RULES_SETTING_KEY)
    .maybeSingle();

  if (error || !data?.value) return DEFAULT_EXPIRY_DAYS;

  try {
    const parsed = JSON.parse(String(data.value)) as { jobQuoteAcceptanceExpiryDays?: unknown };
    const days = Number(parsed.jobQuoteAcceptanceExpiryDays);
    return Number.isFinite(days) && days > 0 ? Math.round(days) : DEFAULT_EXPIRY_DAYS;
  } catch {
    return DEFAULT_EXPIRY_DAYS;
  }
}

async function expireServiceInquiry(context: TenantContext, job: AnyRow, expiryDays: number) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("service_inquiries")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("id", job.id)
    .in("status", LIVE_STATUSES);

  if (error) throw error;

  await createInAppNotification({
    userId: String(job.user_id || ""),
    title: "Job expired",
    message: `Your ${label(job.subcategory_slug || job.category_slug)} request expired because it was open for ${expiryDays} days.`,
    type: "job_expired",
    actionUrl: `/dashboard/requests/${job.id}`,
    data: { job_id: job.id, expiry_days: expiryDays },
  });

  const emailResult = await sendNotificationEmail(context, {
    eventKey: "jobs.buyer_job_expired",
    dedupeKey: `buyer-job-expired:service_inquiries:${job.id}`,
    userId: String(job.user_id || ""),
    email: cleanText(job.email),
    subject: "Your AnyJob request expired",
    title: "Job expired",
    body: `<p>Your ${label(job.subcategory_slug || job.category_slug)} request expired because it was open for ${expiryDays} days.</p><p>You can post the job again whenever you are ready.</p>`,
    actionLabel: "Open request",
    actionUrl: fullAppUrl(context, `/dashboard/requests/${job.id}`),
    sourceTable: "service_inquiries",
    sourceId: String(job.id),
    metadata: { expiry_days: expiryDays },
  });

  return { id: job.id, expired: true, emailResult };
}

async function expireBusinessPost(context: TenantContext, post: AnyRow, expiryDays: number) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("business_work_posts")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("id", post.id)
    .in("status", LIVE_STATUSES);

  if (error) throw error;

  await createInAppNotification({
    userId: String(post.owner_user_id || ""),
    title: "Business post expired",
    message: `${label(post.role_title || post.niche)} expired because it was open for ${expiryDays} days.`,
    type: "business_post_expired",
    actionUrl: "/dashboard/business",
    data: { post_id: post.id, expiry_days: expiryDays },
  });

  const emailResult = await sendNotificationEmail(context, {
    eventKey: "jobs.business_post_expired",
    dedupeKey: `business-post-expired:business_work_posts:${post.id}`,
    userId: String(post.owner_user_id || ""),
    subject: "Your AnyJob business post expired",
    title: "Business post expired",
    body: `<p>Your ${label(post.role_title || post.niche)} business post expired because it was open for ${expiryDays} days.</p><p>You can post the role again from the business portal.</p>`,
    actionLabel: "Open business portal",
    actionUrl: fullAppUrl(context, "/dashboard/business"),
    sourceTable: "business_work_posts",
    sourceId: String(post.id),
    metadata: { expiry_days: expiryDays },
  });

  return { id: post.id, expired: true, emailResult };
}

export async function processJobExpirations(context: TenantContext, body: Record<string, unknown> = {}) {
  const explicitDays = Number(body.expiryDays);
  const expiryDays = Number.isFinite(explicitDays) && explicitDays > 0 ? Math.round(explicitDays) : await configuredExpiryDays();
  const supabase = createAdminClient();
  const results: AnyRow[] = [];

  const { data: inquiries, error: inquiryError } = await supabase
    .from("service_inquiries")
    .select("id,user_id,email,category_slug,subcategory_slug,status,submitted_at,created_at")
    .in("status", LIVE_STATUSES)
    .limit(200);

  if (inquiryError) throw inquiryError;

  for (const job of inquiries || []) {
    const postedAt = job.submitted_at || job.created_at;
    if (!olderThanDays(postedAt, expiryDays)) continue;
    results.push({ source: "service_inquiries", ...(await expireServiceInquiry(context, job, expiryDays)) });
  }

  const { data: posts, error: postError } = await supabase
    .from("business_work_posts")
    .select("id,owner_user_id,role_title,niche,status,created_at")
    .in("status", LIVE_STATUSES)
    .limit(200);

  if (postError) throw postError;

  for (const post of posts || []) {
    if (!olderThanDays(post.created_at, expiryDays)) continue;
    results.push({ source: "business_work_posts", ...(await expireBusinessPost(context, post, expiryDays)) });
  }

  return { expiryDays, processed: results.length, results };
}
