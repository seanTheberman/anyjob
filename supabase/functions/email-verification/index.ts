import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { addHours, cleanText, createToken, isValidEmail, normalizeEmail, sha256Hex, toPublicUrl } from "../_shared/tokens.ts";
import { brandedEmail, getTenantContext, queueAndSendEmail } from "../_shared/tenant-email.ts";

async function findAccount(email: string, tenantId: string) {
  const supabase = createAdminClient();
  const { data: customUser, error: customError } = await supabase
    .from("custom_auth_users")
    .select("id, supabase_user_id, email, role")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .maybeSingle();

  if (customError) throw customError;

  const { data: profile, error: profileError } = await supabase
    .from("eloo_profiles")
    .select("id,email,first_name,last_name,role")
    .eq("email", email)
    .maybeSingle();

  if (profileError) throw profileError;

  return {
    customUser,
    profile,
    supabaseUserId: customUser?.supabase_user_id || profile?.id || null,
  };
}

async function requestVerification(req: Request, body: Record<string, unknown>) {
  const email = normalizeEmail(body.email);
  const tenantSlug = cleanText(body.tenantSlug, "default");

  if (!isValidEmail(email)) return jsonResponse({ error: "Enter a valid email address." }, 400);

  const supabase = createAdminClient();
  const context = await getTenantContext(tenantSlug);
  const account = await findAccount(email, context.tenant.id);

  if (account.customUser?.id || account.supabaseUserId) {
    const token = createToken();
    const tokenHash = await sha256Hex(token);
    const verifyPath = `/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const appUrl = cleanText(context.tenant.app_url) || cleanText(body.appUrl);
    const verifyUrl = appUrl ? `${appUrl.replace(/\/$/, "")}${verifyPath}` : toPublicUrl(req, verifyPath);
    const name = [account.profile?.first_name, account.profile?.last_name].filter(Boolean).join(" ") || "there";

    const { error: tokenError } = await supabase
      .from("email_verification_tokens")
      .insert({
        tenant_id: context.tenant.id,
        custom_auth_user_id: account.customUser?.id || null,
        supabase_user_id: account.supabaseUserId,
        email,
        token_hash: tokenHash,
        expires_at: addHours(24),
      });

    if (tokenError) throw tokenError;

    await queueAndSendEmail(context, {
      eventKey: "auth.email_verification_requested",
      dedupeKey: `email-verification:${email}:${tokenHash}`,
      recipientUserId: account.supabaseUserId,
      recipientEmail: email,
      subject: "Verify your AnyJob email",
      html: brandedEmail(
        "Verify your email",
        `<p>Hi ${name},</p><p>Please verify this email address so AnyJob can send account and job updates to the right inbox.</p>`,
        { label: "Verify email", url: verifyUrl }
      ),
      sourceTable: "email_verification_tokens",
      metadata: { tenant_slug: tenantSlug },
    });
  }

  return jsonResponse({ ok: true, message: "If an account exists, a verification email has been sent." });
}

async function confirmVerification(body: Record<string, unknown>) {
  const email = normalizeEmail(body.email);
  const token = cleanText(body.token);
  const tenantSlug = cleanText(body.tenantSlug, "default");

  if (!isValidEmail(email) || !token) return jsonResponse({ error: "Verification link is invalid." }, 400);

  const supabase = createAdminClient();
  const context = await getTenantContext(tenantSlug);
  const tokenHash = await sha256Hex(token);

  const { data: verification, error: tokenError } = await supabase
    .from("email_verification_tokens")
    .select("id, custom_auth_user_id, supabase_user_id, email, expires_at, used_at")
    .eq("tenant_id", context.tenant.id)
    .eq("email", email)
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (tokenError) throw tokenError;
  if (!verification) return jsonResponse({ error: "Verification link is invalid or expired." }, 400);

  const now = new Date().toISOString();

  if (verification.custom_auth_user_id) {
    const { error } = await supabase
      .from("custom_auth_users")
      .update({ email_verified_at: now, status: "active" })
      .eq("id", verification.custom_auth_user_id);
    if (error) throw error;
  }

  if (verification.supabase_user_id) {
    const { error: authError } = await supabase.auth.admin.updateUserById(verification.supabase_user_id, {
      email_confirm: true,
    });
    if (authError) throw authError;

    await supabase.from("buyers").update({ email_verified: true, updated_at: now }).eq("id", verification.supabase_user_id);
    await supabase.from("sellers").update({ email_verified: true, updated_at: now }).eq("id", verification.supabase_user_id);
  }

  const { error: markUsedError } = await supabase
    .from("email_verification_tokens")
    .update({ used_at: now })
    .eq("id", verification.id);

  if (markUsedError) throw markUsedError;

  return jsonResponse({ ok: true, message: "Email verified successfully." });
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const action = cleanText(body.action, "request");

    if (action === "confirm") return await confirmVerification(body);
    return await requestVerification(req, body);
  } catch (error) {
    console.error("email-verification failed", error);
    return jsonResponse({ error: "Email verification failed." }, 500);
  }
});
