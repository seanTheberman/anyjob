import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { processJobExpirations } from "../_shared/notifications/job-expiry.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction("job-expiry-notifications", ["process_job_expirations"], async ({ body, context }) =>
  processJobExpirations(context, body)
);
