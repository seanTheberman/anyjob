import { createAdminClient } from "../supabase-admin.ts";
import { cleanText } from "../tokens.ts";
import { brandedEmail, queueAndSendEmail, type TenantContext } from "../tenant-email.ts";

export type AnyRow = Record<string, any>;

export const LIVE_STATUSES = ["submitted", "approved"];
export const CLOSED_STATUSES = [
  "accepted",
  "bid_accepted",
  "in_progress",
  "completed",
  "cancelled",
  "expired",
  "rejected",
  "filled",
];

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function label(value: unknown, fallback = "job") {
  const text = String(value || fallback).replaceAll("-", " ").replaceAll("_", " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : fallback;
}

export function compactDescription(value: unknown) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

export function fullTermsUrl(context: TenantContext, value: unknown) {
  const text = cleanText(value, "/pricing#terms");
  if (/^https?:\/\//i.test(text)) return text;
  return fullAppUrl(context, text);
}

export function fullAppUrl(context: TenantContext, path: string) {
  const baseUrl = cleanText(context.tenant.app_url, "https://anyjob.eu").replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function escapeHtml(value: unknown) {
  return cleanText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatAcceptedAt(value: unknown) {
  const date = new Date(cleanText(value) || new Date().toISOString());
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

export async function profileForUser(userId?: string | null) {
  if (!userId) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("eloo_profiles")
    .select("id,email,first_name,last_name,role")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function createInAppNotification(input: {
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

export async function emailForUser(userId?: string | null, fallback?: string | null) {
  if (fallback) return fallback;
  const profile = await profileForUser(userId);
  return profile?.email || null;
}

export async function sendNotificationEmail(
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

export async function getServiceInquiry(jobId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("service_inquiries")
    .select("id,user_id,email,first_name,last_name,category_slug,subcategory_slug,job_description,city,status,submitted_at,created_at")
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBusinessPost(jobId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("business_work_posts")
    .select("id,owner_user_id,business_id,work_type,industry,niche,role_title,description,city,status,created_at")
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
