import { cleanText } from "../tokens.ts";
import type { TenantContext } from "../tenant-email.ts";
import {
  compactDescription,
  createInAppNotification,
  formatAcceptedAt,
  fullTermsUrl,
  getServiceInquiry,
  label,
  sendNotificationEmail,
} from "./core.ts";

export async function notifyProviderTermsAccepted(context: TenantContext, body: Record<string, any>) {
  const jobId = cleanText(body.jobId || body.inquiryId);
  if (!jobId) return { error: "jobId is required" };

  const job = await getServiceInquiry(jobId);
  if (!job) return { error: "service_inquiry_not_found" };

  const providerUserId = cleanText(body.providerUserId);
  const providerEmail = cleanText(body.providerEmail);
  const providerName = cleanText(body.providerName, "Provider");
  const bidId = cleanText(body.bidId);
  const termsVersion = cleanText(body.termsVersion, "provider_quote_terms_v1");
  const termsUrl = fullTermsUrl(context, body.termsUrl);
  const acceptedAt = cleanText(body.acceptedAt) || new Date().toISOString();
  const acceptedAtLabel = formatAcceptedAt(acceptedAt);
  const jobTitle = label(job.subcategory_slug || job.category_slug, "AnyJob job");
  const jobDescription = compactDescription(job.job_description);

  await createInAppNotification({
    userId: providerUserId,
    title: "Provider terms accepted",
    message: `You accepted the provider service terms on ${acceptedAtLabel} for ${jobTitle}.`,
    type: "provider_terms_accepted",
    actionUrl: `/pro/jobs/${job.id}`,
    data: { job_id: job.id, bid_id: bidId, terms_version: termsVersion, accepted_at: acceptedAt },
  });

  return sendNotificationEmail(context, {
    eventKey: "legal.provider_terms_accepted",
    dedupeKey: `provider-terms-accepted:${job.id}:${providerUserId}:${termsVersion}`,
    userId: providerUserId,
    email: providerEmail,
    subject: "You accepted AnyJob provider terms",
    title: "Provider terms accepted",
    body: [
      `<p>Hi ${providerName},</p>`,
      `<p>You accepted the AnyJob provider service terms and conditions on <strong>${acceptedAtLabel}</strong> for this job:</p>`,
      `<p><strong>${jobTitle}</strong>${job.city ? ` in ${job.city}` : ""}</p>`,
      jobDescription ? `<p>${jobDescription}</p>` : "",
      `<p>Terms version: <strong>${termsVersion}</strong></p>`,
      `<p>This timestamp is saved with your quote record for compliance and audit history.</p>`,
    ].join(""),
    actionLabel: "View accepted terms",
    actionUrl: termsUrl,
    sourceTable: "provider_terms_acceptances",
    sourceId: bidId || job.id,
    metadata: { job_id: job.id, bid_id: bidId, terms_version: termsVersion, accepted_at: acceptedAt },
  });
}
