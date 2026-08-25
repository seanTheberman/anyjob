import { cleanText } from "../tokens.ts";
import type { TenantContext } from "../tenant-email.ts";
import { createInAppNotification, escapeHtml, fullAppUrl, getServiceInquiry, profileForUser, sendNotificationEmail } from "./core.ts";

export async function notifyQuoteActivity(context: TenantContext, body: Record<string, any>) {
  const action = cleanText(body.action);
  const jobId = cleanText(body.jobId || body.inquiryId);
  const bidId = cleanText(body.bidId);
  const providerUserId = cleanText(body.providerUserId);
  if (!jobId) return { error: "jobId is required" };

  const job = await getServiceInquiry(jobId);
  if (!job) return { error: "service_inquiry_not_found" };

  if (action.startsWith("direct_request_")) {
    const buyerUserId = cleanText(body.buyerUserId || job.user_id);
    const targetProviderId = cleanText(body.providerUserId || job.target_provider_id);
    const provider = await profileForUser(targetProviderId);
    const providerName = [provider?.first_name, provider?.last_name].filter(Boolean).join(" ")
      || cleanText(body.providerName, "The provider");
    const isReceived = action === "direct_request_received";
    const isAccepted = action === "direct_request_accepted";
    const recipientId = isReceived ? targetProviderId : buyerUserId;
    const recipientEmail = isReceived ? cleanText(body.providerEmail || provider?.email) : cleanText(job.email);
    const actionPath = isReceived ? `/pro/jobs/${job.id}` : `/dashboard/requests/${job.id}`;
    const title = isReceived
      ? "New private job request"
      : isAccepted
        ? "Provider accepted your request"
        : "Provider declined your request";
    const message = isReceived
      ? "A buyer sent job requirements for you to review."
      : isAccepted
        ? `${providerName} accepted your requirements and sent a quote. You can now review it and pay to confirm.`
        : `${providerName} declined your private request.${body.reason ? ` Reason: ${cleanText(body.reason)}` : ""}`;

    await createInAppNotification({
      userId: recipientId,
      title,
      message,
      type: action,
      actionUrl: actionPath,
      data: { job_id: job.id, provider_user_id: targetProviderId, bid_id: cleanText(body.bidId) || null },
    });

    return sendNotificationEmail(context, {
      eventKey: `private_requests.${action}`,
      dedupeKey: `${action}:${job.id}:${recipientId || recipientEmail}`,
      userId: recipientId,
      email: recipientEmail,
      subject: title,
      title,
      body: [
        `<p>${escapeHtml(message)}</p>`,
        isReceived ? `<p>Review the full requirements, then accept with your quote or reject the request.</p>` : "",
        isAccepted && body.amount ? `<p>Your total quote: <strong>${escapeHtml(body.amount)}</strong></p>` : "",
      ].join(""),
      actionLabel: isReceived ? "Review requirements" : isAccepted ? "Review quote and pay" : "Open order",
      actionUrl: fullAppUrl(context, actionPath),
      sourceTable: "service_inquiries",
      sourceId: job.id,
      metadata: { provider_user_id: targetProviderId, bid_id: cleanText(body.bidId) || null },
    });
  }

  if (!bidId) return { error: "bidId is required" };

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
