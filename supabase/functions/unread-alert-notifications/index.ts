import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { cleanText } from "../_shared/tokens.ts";
import { processUnreadAlerts } from "../_shared/notifications/unread-alerts.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction("unread-alert-notifications", ["process_unread_alerts"], async ({ body, context }) =>
  processUnreadAlerts(context, {
    userId: cleanText(body.userId),
    limit: Number(body.limit || 250),
  })
);
