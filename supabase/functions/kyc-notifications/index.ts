import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { notifyBuyerKycPending, notifyProviderKycDocsRequested } from "../_shared/notifications/kyc.ts";
import { serveNotificationFunction } from "../_shared/notifications/request.ts";

serveNotificationFunction(
  "kyc-notifications",
  ["buyer_kyc_pending", "provider_kyc_docs_requested"],
  async ({ action, body, context }) => {
    if (action === "buyer_kyc_pending") return notifyBuyerKycPending(context, body);
    return notifyProviderKycDocsRequested(context, body);
  }
);
