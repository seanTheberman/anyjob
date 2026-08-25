import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifyReviewReceived } from "../_shared/notifications/reviews.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction("review-notifications", ["review_received"], async ({ body, context }) =>
  notifyReviewReceived(context, body)
);
