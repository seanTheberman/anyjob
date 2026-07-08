import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import bcrypt from "bcryptjs";

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { isValidEmail, normalizeEmail, sha256Hex } from "../_shared/tokens.ts";
import { brandedEmail, getTenantContext, queueAndSendEmail } from "../_shared/tenant-email.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const tenantSlug = typeof body.tenantSlug === "string" && body.tenantSlug.trim() ? body.tenantSlug.trim() : "default";

    if (!isValidEmail(email) || !token) {
      return jsonResponse({ error: "Reset link is invalid." }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters long." }, 400);
    }

    const supabase = createAdminClient();
    const context = await getTenantContext(tenantSlug);
    const tokenHash = await sha256Hex(token);

    const { data: resetToken, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("id, tenant_id, custom_auth_user_id, supabase_user_id, email, expires_at, used_at")
      .eq("tenant_id", context.tenant.id)
      .eq("email", email)
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (tokenError) throw tokenError;
    if (!resetToken) {
      return jsonResponse({ error: "Reset link is invalid or expired." }, 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    if (resetToken.custom_auth_user_id) {
      const { error: customUpdateError } = await supabase
        .from("custom_auth_users")
        .update({
          password_hash: passwordHash,
          status: "active",
          email_verified_at: new Date().toISOString(),
        })
        .eq("id", resetToken.custom_auth_user_id);

      if (customUpdateError) throw customUpdateError;
    }

    if (resetToken.supabase_user_id) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        resetToken.supabase_user_id,
        {
          password,
          email_confirm: true,
        }
      );

      if (authUpdateError) throw authUpdateError;
    }

    const { error: markUsedError } = await supabase
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", resetToken.id);

    if (markUsedError) throw markUsedError;

    await queueAndSendEmail(context, {
      eventKey: "auth.password_reset_completed",
      dedupeKey: `password-reset-complete:${resetToken.id}`,
      recipientUserId: resetToken.supabase_user_id,
      recipientEmail: email,
      subject: "Your AnyJob password was changed",
      html: brandedEmail(
        "Password changed",
        "<p>Your AnyJob password was updated successfully.</p><p>If you did not make this change, contact AnyJob support immediately.</p>"
      ),
      sourceTable: "password_reset_tokens",
      sourceId: resetToken.id,
      metadata: { tenant_slug: tenantSlug },
    });

    return jsonResponse({ ok: true, message: "Password reset successful." });
  } catch (error) {
    console.error("reset-password failed", error);
    return jsonResponse({ error: "Password could not be reset." }, 500);
  }
});
