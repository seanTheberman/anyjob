import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifyShiftActivity } from "../_shared/notifications/shifts.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction(
  "shift-notifications",
  [
    "shift_application_received",
    "shift_application_accepted",
    "shift_application_rejected",
    "shift_payment_received",
    "shift_completed",
    "shift_review_received",
  ],
  async ({ body, context }) => notifyShiftActivity(context, body)
);
