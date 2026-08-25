import { cleanText } from "../tokens.ts";
import type { TenantContext } from "../tenant-email.ts";
import { createInAppNotification, escapeHtml, fullAppUrl, profileForUser, sendNotificationEmail } from "./core.ts";

export async function notifyReviewReceived(context: TenantContext, body: Record<string, any>) {
  const reviewId = cleanText(body.reviewId);
  const revieweeId = cleanText(body.revieweeId);
  const reviewerId = cleanText(body.reviewerId);
  const rating = Number(body.rating || 0);
  if (!reviewId || !revieweeId) return { error: "reviewId and revieweeId are required" };

  const reviewer = await profileForUser(reviewerId);
  const reviewerName = [reviewer?.first_name, reviewer?.last_name].filter(Boolean).join(" ") || "Someone";
  const reviewPath = cleanText(body.reviewPath, "/dashboard/reviews");

  await createInAppNotification({
    userId: revieweeId,
    title: "New review received",
    message: `${reviewerName} left you a ${rating || "new"} star review.`,
    type: "review_received",
    actionUrl: reviewPath,
    data: { review_id: reviewId, reviewer_id: reviewerId, rating },
  });

  return sendNotificationEmail(context, {
    eventKey: "reviews.received",
    dedupeKey: `review-received:${reviewId}:${revieweeId}`,
    userId: revieweeId,
    subject: "You received a new AnyJob review",
    title: "New review received",
    body: [
      `<p>${escapeHtml(reviewerName)} left you a ${rating ? `<strong>${rating.toFixed(1)} star</strong>` : "new"} review on AnyJob.</p>`,
      body.title ? `<p><strong>${escapeHtml(body.title)}</strong></p>` : "",
      body.comment ? `<p>${escapeHtml(body.comment)}</p>` : "",
    ].join(""),
    actionLabel: "See all reviews",
    actionUrl: fullAppUrl(context, reviewPath),
    sourceTable: "eloo_reviews",
    sourceId: reviewId,
    metadata: {
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      review_type: cleanText(body.reviewType),
    },
  });
}
