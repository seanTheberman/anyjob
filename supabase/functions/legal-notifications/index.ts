import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifyProviderTermsAccepted } from "../_shared/notifications/legal.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction("legal-notifications", ["provider_terms_accepted"], async ({ body, context }) =>
  notifyProviderTermsAccepted(context, body)
);
