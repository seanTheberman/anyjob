import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifyPromoCampaign } from "../_shared/notifications/engagement.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction("promo-notifications", ["promo_campaign", "admin_broadcast_email"], async ({ body, context }) =>
  notifyPromoCampaign(context, body)
);
