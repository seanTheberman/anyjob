import { createAdminClient } from "../supabase-admin.ts";
import type { TenantContext } from "../tenant-email.ts";
import {
  type AnyRow,
  CLOSED_STATUSES,
  fullAppUrl,
  label,
  LIVE_STATUSES,
  sendNotificationEmail,
  todayKey,
} from "./core.ts";

export async function processLiveJobReminders(context: TenantContext) {
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
    const result = await sendNotificationEmail(context, {
      eventKey: "jobs.buyer_live_reminder",
      dedupeKey: `buyer-live-reminder:service_inquiries:${job.id}:${date}`,
      userId: job.user_id,
      email: job.email,
      subject: "Your AnyJob request is still live",
      title: "Your request is still live",
      body: `<p>Your ${label(job.subcategory_slug || job.category_slug)} request is still visible to providers.</p><p>We will keep reminding you every 24 hours until it is accepted or started.</p>`,
      actionLabel: "Open request",
      actionUrl: fullAppUrl(context, `/dashboard/requests/${job.id}`),
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
    const result = await sendNotificationEmail(context, {
      eventKey: "jobs.business_live_reminder",
      dedupeKey: `business-live-reminder:business_work_posts:${post.id}:${date}`,
      userId: post.owner_user_id,
      subject: "Your AnyJob business post is still live",
      title: "Your business post is still live",
      body: `<p>Your ${label(post.role_title || post.niche)} post is still visible to eligible workers.</p><p>We will keep reminding you every 24 hours until it is filled, accepted, or started.</p>`,
      actionLabel: "Open business portal",
      actionUrl: fullAppUrl(context, "/dashboard/business"),
      sourceTable: "business_work_posts",
      sourceId: post.id,
    });
    results.push({ source: "business_work_posts", id: post.id, result });
  }

  return { processed: results.length, results };
}
