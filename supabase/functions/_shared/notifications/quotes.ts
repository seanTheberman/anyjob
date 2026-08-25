import { cleanText } from "../tokens.ts";
import type { TenantContext } from "../tenant-email.ts";
import { createInAppNotification, escapeHtml, fullAppUrl, getServiceInquiry, profileForUser, sendNotificationEmail } from "./core.ts";

export async function notifyQuoteActivity(context: TenantContext, body: Record<string, any>) {
  const action = cleanText(body.action);
  const jobId = cleanText(body.jobId || body.inquiryId);
  const bidId = cleanText(body.bidId);
  const providerUserId = cleanText(body.providerUserId);
  if (!jobId || !bidId) return { error: "jobId and bidId are required" };

  const job = await getServiceInquiry(jobId);
  if (!job) return { error: "service_inquiry_not_found" };

  const provider = await profileForUser(providerUserId);
  const providerName = [provider?.first_name, provider?.last_name].filter(Boolean).join(" ") || cleanText(body.providerName, "A provider");
  const buyerUserId = cleanText(body.buyerUserId || job.user_id);
  const isReceived = action === "quote_received";
  const recipientId = isReceived ? buyerUserId : providerUserId;
  const recipientEmail = isReceived ? cleanText(job.email) : cleanText(body.providerEmail);
  const actionPath = isReceived ? `/dashboard/requests/${job.id}` : `/pro/jobs/${job.id}`;

  await createInAppNotification({
    userId: recipientId,
    title: isReceived ? "New quote received" : "Quote update",
    message: isReceived ? `${providerName} sent a quote for your job.` : "Your quote status changed.",
    type: action,
    actionUrl: actionPath,
    data: { job_id: job.id, bid_id: bidId, provider_user_id: providerUserId },
  });

  return sendNotificationEmail(context, {
    eventKey: `quotes.${action}`,
    dedupeKey: `${action}:${job.id}:${bidId}:${recipientId || recipientEmail}`,
    userId: recipientId,
    email: recipientEmail,
    subject: isReceived ? "You received a new AnyJob quote" : "Your AnyJob quote was updated",
    title: isReceived ? "New quote received" : "Quote update",
    body: [
      isReceived ? `<p>${escapeHtml(providerName)} sent a quote for your job.</p>` : `<p>Your quote has a new update on AnyJob.</p>`,
      body.amount ? `<p>Quote amount: <strong>${escapeHtml(body.amount)}</strong></p>` : "",
      body.message ? `<p>${escapeHtml(body.message)}</p>` : "",
    ].join(""),
    actionLabel: isReceived ? "Review quote" : "Open job",
    actionUrl: fullAppUrl(context, actionPath),
    sourceTable: "bids",
    sourceId: bidId,
    metadata: { job_id: job.id, provider_user_id: providerUserId },
  });
}
