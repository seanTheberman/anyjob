import { cleanText } from "../tokens.ts";
import type { TenantContext } from "../tenant-email.ts";
import { createInAppNotification, escapeHtml, fullAppUrl, sendNotificationEmail } from "./core.ts";

function recipientName(value: unknown) {
  return escapeHtml(cleanText(value, "there"));
}

export async function notifyWelcomeOrThankYou(context: TenantContext, body: Record<string, any>) {
  const userId = cleanText(body.userId);
  const email = cleanText(body.email);
  const name = recipientName(body.name || body.firstName);
  const role = cleanText(body.role, "member");
  const kind = cleanText(body.kind || body.action, "welcome");
  const isThanks = kind.includes("thank");
  const title = isThanks ? "Thank you from AnyJob" : "Welcome to AnyJob";
  const subject = isThanks ? "Thank you for using AnyJob" : "Welcome to AnyJob";
  const actionPath = cleanText(body.actionPath, role === "provider" || role === "seller" || role === "contractor" ? "/pro" : "/dashboard");

  if (!userId && !email) return { error: "userId or email is required" };

  if (userId) {
    await createInAppNotification({
      userId,
      title,
      message: isThanks ? "Thanks for using AnyJob. Your update has been received." : "Your AnyJob account is ready.",
      type: isThanks ? "thank_you_email" : "welcome_email",
      actionUrl: actionPath,
      data: { role, kind },
    });
  }

  return sendNotificationEmail(context, {
    eventKey: isThanks ? "engagement.thank_you" : "engagement.welcome",
    dedupeKey: `${isThanks ? "thank-you" : "welcome"}:${userId || email}:${cleanText(body.dedupeKey) || new Date().toISOString().slice(0, 10)}`,
    userId,
    email,
    subject,
    title,
    body: [
      `<p>Hi ${name},</p>`,
      isThanks
        ? `<p>Thanks for using AnyJob. We have received your latest update and will keep your account timeline in sync.</p>`
        : `<p>Your AnyJob account is ready. You can now manage jobs, messages, reviews, verification, and marketplace activity in one place.</p>`,
      body.message ? `<p>${escapeHtml(body.message)}</p>` : "",
    ].join(""),
    actionLabel: isThanks ? "Open AnyJob" : "Go to dashboard",
    actionUrl: fullAppUrl(context, actionPath),
    sourceTable: cleanText(body.sourceTable) || undefined,
    sourceId: cleanText(body.sourceId) || undefined,
    metadata: { role, kind },
  });
}

export async function notifyPromoCampaign(context: TenantContext, body: Record<string, any>) {
  const userId = cleanText(body.userId);
  const email = cleanText(body.email);
  const campaignId = cleanText(body.campaignId || body.dedupeKey || crypto.randomUUID());
  const title = cleanText(body.title, "AnyJob update");
  const message = cleanText(body.message, "Open AnyJob to see what is new.");
  const actionLabel = cleanText(body.actionLabel, "Open AnyJob");
  const actionPath = cleanText(body.actionPath || body.actionUrl, "/");

  if (!userId && !email) return { error: "userId or email is required" };

  return sendNotificationEmail(context, {
    eventKey: "marketing.promo_campaign",
    dedupeKey: `promo:${campaignId}:${userId || email}`,
    userId,
    email,
    subject: cleanText(body.subject, title),
    title: escapeHtml(title),
    body: `<p>${escapeHtml(message)}</p>`,
    actionLabel,
    actionUrl: /^https?:\/\//i.test(actionPath) ? actionPath : fullAppUrl(context, actionPath),
    sourceTable: "eloo_notifications",
    sourceId: campaignId,
    metadata: {
      campaign_id: campaignId,
      audience: cleanText(body.audience),
    },
  });
}
