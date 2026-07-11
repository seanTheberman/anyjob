import type { TenantContext } from "../tenant-email.ts";
import {
  createInAppNotification,
  fullAppUrl,
  getServiceInquiry,
  profileForUser,
  sendNotificationEmail,
} from "./core.ts";
import { cleanText } from "../tokens.ts";

export async function notifyPaymentAccepted(context: TenantContext, body: Record<string, any>) {
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

  await sendNotificationEmail(context, {
    eventKey: "jobs.buyer_payment_accepted",
    dedupeKey: `buyer-payment-accepted:${job.id}:${body.bidId || ""}`,
    userId: buyerUserId,
    email: job.email,
    subject: "Your AnyJob booking is confirmed",
    title: "Booking confirmed",
    body: `<p>Your first payment is complete and the provider can now coordinate the job with you.</p><p>${providerProfile?.first_name ? `Provider: ${providerProfile.first_name}` : ""}</p>`,
    actionLabel: "Open request",
    actionUrl: fullAppUrl(context, `/dashboard/requests/${job.id}`),
    sourceTable: "service_inquiries",
    sourceId: job.id,
  });

  await sendNotificationEmail(context, {
    eventKey: "jobs.provider_quote_accepted",
    dedupeKey: `provider-quote-accepted:${job.id}:${body.bidId || ""}`,
    userId: providerUserId,
    subject: "Your AnyJob quote was accepted",
    title: "Quote accepted",
    body: "<p>The buyer has paid the booking confirmation. Chat and coordination are now unlocked.</p>",
    actionLabel: "Open job",
    actionUrl: fullAppUrl(context, `/pro/jobs/${job.id}`),
    sourceTable: "service_inquiries",
    sourceId: job.id,
  });

  return { ok: true };
}
