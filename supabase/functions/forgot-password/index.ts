import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { addHours, cleanText, createToken, isValidEmail, normalizeEmail, sha256Hex, toPublicUrl } from "../_shared/tokens.ts";
import { brandedEmail, getTenantContext, queueAndSendEmail } from "../_shared/tenant-email.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const tenantSlug = typeof body.tenantSlug === "string" && body.tenantSlug.trim() ? body.tenantSlug.trim() : "default";

    if (!isValidEmail(email)) {
      return jsonResponse({ error: "Enter a valid email address." }, 400);
    }

    const supabase = createAdminClient();
    const context = await getTenantContext(tenantSlug);

    const { data: customUser, error: customUserError } = await supabase
      .from("custom_auth_users")
      .select("id, supabase_user_id, email, status")
      .eq("tenant_id", context.tenant.id)
      .eq("email", email)
      .maybeSingle();

    if (customUserError) throw customUserError;

    const { data: profile, error: profileError } = await supabase
      .from("eloo_profiles")
      .select("id,email,first_name,last_name,role")
      .eq("email", email)
      .maybeSingle();

    if (profileError) throw profileError;

    const supabaseUserId = customUser?.supabase_user_id || profile?.id || null;
    const hasAccount = Boolean(customUser?.id || supabaseUserId);

    if (hasAccount) {
      const token = createToken();
      const tokenHash = await sha256Hex(token);
      const resetPath = `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
      const appUrl = cleanText(context.tenant.app_url) || cleanText(body.appUrl);
      const resetUrl = appUrl ? `${appUrl.replace(/\/$/, "")}${resetPath}` : toPublicUrl(req, resetPath);
      const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "there";

      const { error: tokenError } = await supabase
        .from("password_reset_tokens")
        .insert({
          tenant_id: context.tenant.id,
          custom_auth_user_id: customUser?.id || null,
          supabase_user_id: supabaseUserId,
          email,
          token_hash: tokenHash,
          expires_at: addHours(1),
        });

      if (tokenError) throw tokenError;

      await queueAndSendEmail(context, {
        eventKey: "auth.password_reset_requested",
        dedupeKey: `password-reset:${email}:${tokenHash}`,
        recipientUserId: supabaseUserId,
        recipientEmail: email,
        subject: "Reset your AnyJob password",
        html: brandedEmail(
          "Reset your password",
          `<p>Hi ${name},</p><p>Use the button below to choose a new AnyJob password. This link expires in 1 hour.</p><p>If you did not request this, you can ignore this email.</p>`,
          { label: "Reset password", url: resetUrl }
        ),
        sourceTable: "password_reset_tokens",
        metadata: { tenant_slug: tenantSlug },
      });
    }

    return jsonResponse({
      ok: true,
      message: "If an AnyJob account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("forgot-password failed", error);
    return jsonResponse({ error: "Password reset email could not be sent." }, 500);
  }
});
