import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serveNotificationFunction } from "../_shared/notifications/request.ts";
import {
  escapeHtml,
  fullAppUrl,
  sendNotificationEmail,
} from "../_shared/notifications/core.ts";

serveNotificationFunction("select-quote-notifications", ["anyjob_select_quote_received"], async ({ body, context }) => {
  const inquiryId = String(body.jobId || body.inquiryId || "");
  const bidId = String(body.bidId || "");
  const recipientEmail = String(body.recipientEmail || "").trim().toLowerCase();
  const token = String(body.token || "");
  const providerName = String(body.providerName || "Provider");
  const jobTitle = String(body.jobTitle || "AnyJob Select job");
  const buyerTotal = String(body.buyerTotal || "");
  const sellerQuote = String(body.sellerQuote || "");
  const message = String(body.message || "No quote note added.");

  if (!inquiryId || !bidId || !recipientEmail || !token) {
    throw new Error("Missing AnyJob Select quote notification fields");
  }

  const acceptUrl = fullAppUrl(context, `/api/anyjob-select/accept?token=${encodeURIComponent(token)}&bid=${encodeURIComponent(bidId)}`);
  const bodyHtml = [
    `<p>A provider has sent a quote for your AnyJob Select request.</p>`,
    `<p><strong>Job:</strong> ${escapeHtml(jobTitle)}</p>`,
    `<p><strong>Provider:</strong> ${escapeHtml(providerName)}</p>`,
    buyerTotal ? `<p><strong>Total shown to you:</strong> ${escapeHtml(buyerTotal)}</p>` : "",
    sellerQuote ? `<p><strong>Provider quote:</strong> ${escapeHtml(sellerQuote)}</p>` : "",
    `<p><strong>Provider message:</strong></p>`,
    `<p style="padding:14px 16px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px">${escapeHtml(message)}</p>`,
    `<p>Use the button below to tell AnyJob admin you want to continue with this quote.</p>`,
  ].join("");

  return sendNotificationEmail(context, {
    eventKey: "anyjob_select.quote_received",
    dedupeKey: `anyjob-select-quote:${inquiryId}:${bidId}:${recipientEmail}`,
    email: recipientEmail,
    subject: `Quote received for ${jobTitle}`,
    title: "A provider sent a quote",
    body: bodyHtml,
    actionLabel: "Accept quote",
    actionUrl: acceptUrl,
    sourceTable: "admin_select_quote_acceptances",
    sourceId: bidId,
    metadata: {
      inquiry_id: inquiryId,
      bid_id: bidId,
      recipient_email: recipientEmail,
      token,
    },
  });
});
