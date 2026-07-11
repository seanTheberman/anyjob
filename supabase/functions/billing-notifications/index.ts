import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifyProviderPlanSubscriptionSuccess } from "../_shared/notifications/billing.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction(
  "billing-notifications",
  ["provider_plan_subscription_success"],
  async ({ body, context }) => notifyProviderPlanSubscriptionSuccess(context, body)
);
