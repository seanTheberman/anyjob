import { cleanText } from "../tokens.ts";
import type { TenantContext } from "../tenant-email.ts";
import { createInAppNotification, escapeHtml, fullAppUrl, profileForUser, sendNotificationEmail } from "./core.ts";

export async function notifyShiftActivity(context: TenantContext, body: Record<string, any>) {
  const action = cleanText(body.action);
  const applicationId = cleanText(body.applicationId || body.shiftApplicationId);
  const postId = cleanText(body.postId || body.businessWorkPostId);
  const ownerUserId = cleanText(body.ownerUserId);
  const providerUserId = cleanText(body.providerUserId);
  if (!applicationId && !postId) return { error: "applicationId or postId is required" };

  const provider = await profileForUser(providerUserId);
  const providerName = [provider?.first_name, provider?.last_name].filter(Boolean).join(" ") || "A worker";
  const notifyBusiness = ["shift_application_received", "shift_completed", "shift_review_received"].includes(action);
  const recipientId = notifyBusiness ? ownerUserId : providerUserId;
  const actionPath = notifyBusiness ? "/dashboard/business" : "/pro/shifts";
  const title =
    action === "shift_application_received" ? "New shift application" :
    action === "shift_application_accepted" ? "Shift application accepted" :
    action === "shift_payment_received" ? "Shift payment confirmed" :
    action === "shift_completed" ? "Shift completed" :
    "Shift update";

  if (recipientId) {
    await createInAppNotification({
      userId: recipientId,
      title,
      message: notifyBusiness ? `${providerName} has an update on your shift.` : "Your shift has an update.",
      type: action,
      actionUrl: actionPath,
      data: { application_id: applicationId, post_id: postId, provider_user_id: providerUserId },
    });
  }

  return sendNotificationEmail(context, {
    eventKey: `shifts.${action}`,
    dedupeKey: `${action}:${applicationId || postId}:${recipientId}`,
    userId: recipientId,
    subject: `AnyJob shift update: ${title}`,
    title,
    body: [
      notifyBusiness ? `<p>${escapeHtml(providerName)} has an update on your shift post.</p>` : `<p>Your shift application has an update.</p>`,
      body.message ? `<p>${escapeHtml(body.message)}</p>` : "",
    ].join(""),
    actionLabel: notifyBusiness ? "Open business portal" : "Open shifts",
    actionUrl: fullAppUrl(context, actionPath),
    sourceTable: applicationId ? "shift_applications" : "business_work_posts",
    sourceId: applicationId || postId,
    metadata: { post_id: postId, provider_user_id: providerUserId },
  });
}
