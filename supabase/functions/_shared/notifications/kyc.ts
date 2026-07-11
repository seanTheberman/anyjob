import { cleanText } from "../tokens.ts";
import type { TenantContext } from "../tenant-email.ts";
import {
  createInAppNotification,
  escapeHtml,
  fullAppUrl,
  getServiceInquiry,
  label,
  sendNotificationEmail,
} from "./core.ts";

export async function notifyBuyerKycPending(context: TenantContext, body: Record<string, any>) {
  const jobId = cleanText(body.jobId || body.inquiryId);
  if (!jobId) return { error: "jobId is required" };

  const job = await getServiceInquiry(jobId);
  if (!job) return { error: "service_inquiry_not_found" };

  const buyerUserId = cleanText(body.buyerUserId || job.user_id);
  const missing = Array.isArray(body.missingKyc)
    ? body.missingKyc.map((item: unknown) => cleanText(item)).filter(Boolean)
    : [];
  const missingLabel = missing.length ? missing.join(", ") : "your ID front, ID back, and selfie video";
  const accountUrl = fullAppUrl(context, "/dashboard/account#kyc");
  const jobTitle = label(job.subcategory_slug || job.category_slug, "your job");

  await createInAppNotification({
    userId: buyerUserId,
    title: "KYC required before quotes",
    message: `Your ${jobTitle} request is saved, but providers cannot send quotes until buyer KYC is complete.`,
    type: "buyer_kyc_pending",
    actionUrl: "/dashboard/account#kyc",
    data: { job_id: job.id, missing_kyc: missing },
  });

  return sendNotificationEmail(context, {
    eventKey: "kyc.buyer_pending_after_job_post",
    dedupeKey: `buyer-kyc-pending:service_inquiries:${job.id}`,
    userId: buyerUserId,
    email: job.email,
    subject: "Complete KYC to receive quotes on AnyJob",
    title: "Complete KYC to receive quotes",
    body: [
      `<p>Your ${jobTitle} request has been posted.</p>`,
      `<p>Before providers can send quotes, please complete buyer KYC by uploading <strong>${missingLabel}</strong>.</p>`,
      `<p>This keeps quote requests safer and avoids providers spending time on unverified jobs.</p>`,
    ].join(""),
    actionLabel: "Complete KYC",
    actionUrl: accountUrl,
    sourceTable: "service_inquiries",
    sourceId: job.id,
    metadata: { job_id: job.id, missing_kyc: missing },
  });
}

export async function notifyProviderKycDocsRequested(context: TenantContext, body: Record<string, any>) {
  const providerUserId = cleanText(body.providerUserId);
  const providerEmail = cleanText(body.providerEmail);
  if (!providerUserId && !providerEmail) return { error: "providerUserId or providerEmail is required" };

  const providerName = cleanText(body.providerName, "Provider");
  const missing = Array.isArray(body.missingKyc)
    ? body.missingKyc.map((item: unknown) => cleanText(item)).filter(Boolean)
    : [];
  const missingLabel = missing.length ? missing.map(escapeHtml).join(", ") : "your KYC documents";
  const requestReason = cleanText(body.requestReason, "Additional KYC documents requested");
  const requestedAt = cleanText(body.requestedAt) || new Date().toISOString();
  const profilePath = "/pro/profile#kyc";
  const profileUrl = fullAppUrl(context, profilePath);

  await createInAppNotification({
    userId: providerUserId,
    title: "KYC documents requested",
    message: "Please check AnyJob and upload the requested KYC documents so your provider account can be reviewed.",
    type: "provider_kyc_docs_requested",
    actionUrl: profilePath,
    data: { missing_kyc: missing, request_reason: requestReason, requested_at: requestedAt },
  });

  return sendNotificationEmail(context, {
    eventKey: "kyc.provider_docs_requested",
    dedupeKey: `provider-kyc-docs-requested:${providerUserId || providerEmail}:${requestedAt}`,
    userId: providerUserId,
    email: providerEmail,
    subject: "Upload your AnyJob KYC documents",
    title: "KYC documents requested",
    body: [
      `<p>Hi ${escapeHtml(providerName)},</p>`,
      `<p>Please check your AnyJob provider profile and upload the requested KYC documents.</p>`,
      `<p><strong>Requested documents:</strong> ${missingLabel}</p>`,
      `<p><strong>Admin note:</strong> ${escapeHtml(requestReason)}</p>`,
      `<p>Your provider account stays limited until the requested documents are uploaded and approved by AnyJob.</p>`,
    ].join(""),
    actionLabel: "Upload KYC documents",
    actionUrl: profileUrl,
    sourceTable: "sellers",
    sourceId: providerUserId || undefined,
    metadata: { missing_kyc: missing, request_reason: requestReason, requested_at: requestedAt },
  });
}
