import "server-only";

type InvokeOptions = {
  functionName: string;
  payload: Record<string, unknown>;
  useServiceRole?: boolean;
};

export async function invokeEmailFunction({ functionName, payload, useServiceRole = true }: InvokeOptions) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = useServiceRole ? serviceRoleKey : anonKey;

  if (!supabaseUrl || !apiKey) {
    return { ok: false, error: "Missing Supabase function environment variables" };
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, status: response.status, error: body?.error || "Function call failed" };
    }

    return { ok: true, body };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Function call failed",
    };
  }
}

const notificationFunctionByAction: Record<string, string> = {
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

export async function notifyJobEvent(payload: Record<string, unknown>) {
  const action = typeof payload.action === "string" ? payload.action : "";
  const result = await invokeEmailFunction({
    functionName: notificationFunctionByAction[action] || "job-notifications",
    payload: {
      tenantSlug: "default",
      ...payload,
    },
    useServiceRole: true,
  });

  if (!result.ok) {
    console.error("AnyJob email notification failed:", result);
  }

  return result;
}
