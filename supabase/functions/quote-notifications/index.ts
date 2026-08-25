import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifyQuoteActivity } from "../_shared/notifications/quotes.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction(
  "quote-notifications",
  [
    "quote_received",
    "quote_updated",
    "quote_declined",
    "direct_request_received",
    "direct_request_accepted",
    "direct_request_rejected",
  ],
  async ({ body, context }) => notifyQuoteActivity(context, body)
);
