import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifyPaymentAccepted } from "../_shared/notifications/job-payments.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction(
  "job-payment-notifications",
  ["job_payment_accepted", "job_status_changed"],
  async ({ body, context }) => notifyPaymentAccepted(context, body)
);
