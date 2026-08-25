import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifyQuoteActivity } from "../_shared/notifications/quotes.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction(
  "quote-notifications",
  ["quote_received", "quote_updated", "quote_declined"],
  async ({ body, context }) => notifyQuoteActivity(context, body)
);
