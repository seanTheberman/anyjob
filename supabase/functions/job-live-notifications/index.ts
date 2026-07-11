import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifyJobMarkedLive } from "../_shared/notifications/job-live.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";
import { cleanText } from "../_shared/tokens.ts";

serveNotificationFunction("job-live-notifications", ["job_marked_live"], async ({ body, context }) => {
  const jobId = cleanText(body.jobId);
  const source = cleanText(body.source, "service_inquiry");
  if (!jobId) return { error: "jobId is required" };
  return notifyJobMarkedLive(context, source, jobId);
});
