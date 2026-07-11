import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { processLiveJobReminders } from "../_shared/notifications/reminders.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction("job-reminder-notifications", ["process_live_job_reminders"], async ({ context }) =>
  processLiveJobReminders(context)
);
