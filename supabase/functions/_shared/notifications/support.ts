import { cleanText } from "../tokens.ts";
import type { TenantContext } from "../tenant-email.ts";
import { createInAppNotification, escapeHtml, fullAppUrl, sendNotificationEmail } from "./core.ts";

export async function notifySupportTicket(context: TenantContext, body: Record<string, any>) {
  const userId = cleanText(body.userId);
  const email = cleanText(body.email);
  const ticketId = cleanText(body.ticketId);
  const kind = cleanText(body.kind || body.action, "support_ticket_created");
  const title = cleanText(body.title, "Support ticket");
  const status = cleanText(body.status, "open");
  if (!ticketId || (!userId && !email)) return { error: "ticketId and userId/email are required" };

  const isReply = kind.includes("reply");
  const notificationTitle = isReply ? "Support replied" : "Support ticket received";
  const actionPath = cleanText(body.actionPath, "/dashboard/account?tab=support");

  if (userId) {
    await createInAppNotification({
      userId,
      title: notificationTitle,
      message: isReply ? `AnyJob support replied to ${title}.` : `We received your support ticket: ${title}.`,
      type: isReply ? "support_ticket_replied" : "support_ticket_created",
      actionUrl: actionPath,
      data: { ticket_id: ticketId, status },
    });
  }

  return sendNotificationEmail(context, {
    eventKey: isReply ? "support.ticket_replied" : "support.ticket_created",
    dedupeKey: `${isReply ? "support-reply" : "support-created"}:${ticketId}:${cleanText(body.messageId) || status}`,
    userId,
    email,
    subject: isReply ? `AnyJob support replied: ${title}` : `We received your AnyJob support ticket`,
    title: notificationTitle,
    body: [
      `<p><strong>${escapeHtml(title)}</strong></p>`,
      `<p>Status: <strong>${escapeHtml(status)}</strong></p>`,
      body.message ? `<p>${escapeHtml(body.message)}</p>` : "",
    ].join(""),
    actionLabel: "Open support",
    actionUrl: fullAppUrl(context, actionPath),
    sourceTable: "support_tickets",
    sourceId: ticketId,
    metadata: { status, category: cleanText(body.category), priority: cleanText(body.priority) },
  });
}
