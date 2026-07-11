import { cleanText } from "../tokens.ts";
import type { TenantContext } from "../tenant-email.ts";
import {
  createInAppNotification,
  fullAppUrl,
  label,
  profileForUser,
  sendNotificationEmail,
} from "./core.ts";

function limitLabel(value: unknown, windowDays: unknown) {
  const limit = Number(value);
  const days = Number(windowDays) || 30;
  if (Number.isFinite(limit) && limit < 0) return "unlimited job and shift applications";
  if (Number.isFinite(limit)) return `${limit} job and shift applications every ${days} days`;
  return "your plan benefits";
}

export async function notifyProviderPlanSubscriptionSuccess(context: TenantContext, body: Record<string, any>) {
  const userId = cleanText(body.userId);
  const planId = cleanText(body.planId);
  const planName = label(body.planName || planId, "Provider plan");
  if (!userId) return { error: "userId is required" };

  const profile = await profileForUser(userId);
  const benefits = limitLabel(body.applicationLimit, body.usageWindowDays);
  const periodEnd = cleanText(body.currentPeriodEnd);
  const periodText = periodEnd ? `<p>Your current billing period runs until <strong>${periodEnd}</strong>.</p>` : "";

  await createInAppNotification({
    userId,
    title: "Provider plan activated",
    message: `${planName} is active. You can now use ${benefits}.`,
    type: "provider_plan_subscription_success",
    actionUrl: "/pricing",
    data: {
      plan_id: planId,
      plan_name: planName,
      application_limit: body.applicationLimit,
      usage_window_days: body.usageWindowDays,
      current_period_end: periodEnd || null,
    },
  });

  return sendNotificationEmail(context, {
    eventKey: "billing.provider_plan_subscription_success",
    dedupeKey: `provider-plan-success:${userId}:${planId}:${cleanText(body.sessionId) || new Date().toISOString().slice(0, 10)}`,
    userId,
    email: cleanText(body.email || profile?.email),
    subject: `Your AnyJob ${planName} plan is active`,
    title: "Provider plan activated",
    body: [
      `<p>Hi ${cleanText(profile?.first_name, "there")},</p>`,
      `<p>Your <strong>${planName}</strong> subscription was successful.</p>`,
      `<p>You can now use <strong>${benefits}</strong> and enjoy the plan benefits configured by AnyJob.</p>`,
      periodText,
    ].join(""),
    actionLabel: "View pricing",
    actionUrl: fullAppUrl(context, "/pricing"),
    sourceTable: "provider_plan_subscriptions",
    sourceId: userId,
    metadata: {
      plan_id: planId,
      plan_name: planName,
      application_limit: body.applicationLimit,
      usage_window_days: body.usageWindowDays,
      current_period_end: periodEnd || null,
    },
  });
}
