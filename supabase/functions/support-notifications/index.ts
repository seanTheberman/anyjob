import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifySupportTicket } from "../_shared/notifications/support.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction(
  "support-notifications",
  ["support_ticket_created", "support_ticket_replied", "support_ticket_updated"],
  async ({ body, context }) => notifySupportTicket(context, body)
);
