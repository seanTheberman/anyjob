import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifyWelcomeOrThankYou } from "../_shared/notifications/engagement.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction("welcome-notifications", ["welcome_email", "thank_you_email"], async ({ body, context }) =>
  notifyWelcomeOrThankYou(context, body)
);
