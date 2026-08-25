import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { requireServiceRole } from "../_shared/supabase-admin.ts";
import { cleanText } from "../_shared/tokens.ts";

const ACTION_FUNCTIONS: Record<string, string> = {
  job_marked_live: "job-live-notifications",
  job_payment_accepted: "job-payment-notifications",
  job_status_changed: "job-payment-notifications",
  provider_terms_accepted: "legal-notifications",
  buyer_kyc_pending: "kyc-notifications",
  provider_kyc_docs_requested: "kyc-notifications",
  process_live_job_reminders: "job-reminder-notifications",
  provider_plan_subscription_success: "billing-notifications",
  process_job_expirations: "job-expiry-notifications",
  process_unread_alerts: "unread-alert-notifications",
  anyjob_select_quote_received: "select-quote-notifications",
  welcome_email: "welcome-notifications",
  thank_you_email: "welcome-notifications",
  promo_campaign: "promo-notifications",
  admin_broadcast_email: "promo-notifications",
  review_received: "review-notifications",
  support_ticket_created: "support-notifications",
  support_ticket_replied: "support-notifications",
  support_ticket_updated: "support-notifications",
  quote_received: "quote-notifications",
  quote_updated: "quote-notifications",
  quote_declined: "quote-notifications",
  shift_application_received: "shift-notifications",
  shift_application_accepted: "shift-notifications",
  shift_application_rejected: "shift-notifications",
  shift_payment_received: "shift-notifications",
  shift_completed: "shift-notifications",
  shift_review_received: "shift-notifications",
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  if (!requireServiceRole(req)) return jsonResponse({ error: "Unauthorized" }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    const action = cleanText(body.action);
    const functionName = ACTION_FUNCTIONS[action];

    if (!functionName) {
      return jsonResponse({ error: "Unknown notification action" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Missing Supabase function environment variables" }, 500);
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json().catch(() => ({}));
    return jsonResponse(result, response.status);
  } catch (error) {
    console.error("job-notifications forwarder failed", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Notification forwarding failed" }, 500);
  }
});
