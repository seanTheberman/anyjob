import nodemailer from "nodemailer";

import { createAdminClient } from "./supabase-admin.ts";

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  app_url: string | null;
};

type EmailConfigRow = {
  id: string;
  tenant_id: string;
  from_email: string;
  from_name: string;
  reply_to_email: string | null;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password: string | null;
};

export type TenantContext = {
  tenant: TenantRow;
  emailConfig: EmailConfigRow;
};

export type OutboxInput = {
  eventKey: string;
  dedupeKey?: string | null;
  recipientUserId?: string | null;
  recipientEmail: string;
  subject: string;
  html: string;
  text?: string | null;
  sourceTable?: string | null;
  sourceId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function getTenantContext(tenantSlug = "default"): Promise<TenantContext> {
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name, app_url")
    .eq("slug", tenantSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (tenantError) throw tenantError;
  if (!tenant) throw new Error(`Tenant '${tenantSlug}' is not configured`);

  const { data: emailConfig, error: configError } = await supabase
    .from("tenant_email_configs")
    .select("id, tenant_id, from_email, from_name, reply_to_email, smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .maybeSingle();

  if (configError) throw configError;
  if (!emailConfig) throw new Error(`No active email config for tenant '${tenantSlug}'`);
  if (!emailConfig.smtp_password) throw new Error(`SMTP password is missing for tenant '${tenantSlug}'`);

  return { tenant, emailConfig };
}

function textFromHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function sendTenantEmail(context: TenantContext, input: OutboxInput) {
  const config = context.emailConfig;
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_secure,
    auth: {
      user: config.smtp_username,
      pass: config.smtp_password || "",
    },
  });

  return transporter.sendMail({
    from: `"${config.from_name}" <${config.from_email}>`,
    to: input.recipientEmail,
    replyTo: config.reply_to_email || config.from_email,
    subject: input.subject,
    html: input.html,
    text: input.text || textFromHtml(input.html),
  });
}

export async function queueAndSendEmail(context: TenantContext, input: OutboxInput) {
  const supabase = createAdminClient();
  const outboxPayload = {
    tenant_id: context.tenant.id,
    event_key: input.eventKey,
    dedupe_key: input.dedupeKey || null,
    recipient_user_id: input.recipientUserId || null,
    recipient_email: input.recipientEmail,
    subject: input.subject,
    html_body: input.html,
    text_body: input.text || null,
    source_table: input.sourceTable || null,
    source_id: input.sourceId || null,
    metadata: input.metadata || {},
    status: "pending",
  };

  const { data: row, error: insertError } = await supabase
    .from("email_outbox")
    .insert(outboxPayload)
    .select("id,status")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { skipped: true, reason: "duplicate" };
    }
    throw insertError;
  }

  try {
    await supabase
      .from("email_outbox")
      .update({ status: "sending", attempts: 1 })
      .eq("id", row.id);

    await sendTenantEmail(context, input);

    await supabase
      .from("email_outbox")
      .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
      .eq("id", row.id);

    return { sent: true, id: row.id };
  } catch (error) {
    await supabase
      .from("email_outbox")
      .update({
        status: "failed",
        attempts: 1,
        last_error: error instanceof Error ? error.message : "Email send failed",
      })
      .eq("id", row.id);
    throw error;
  }
}

export function brandedEmail(title: string, body: string, action?: { label: string; url: string }) {
  const actionHtml = action
    ? `<p style="margin:28px 0 6px"><a href="${action.url}" style="display:inline-block;background:#e11d2e;color:#fff;text-decoration:none;border-radius:12px;padding:13px 20px;font-weight:700">${action.label}</a></p>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f5f7fb;font-family:Inter,Arial,sans-serif;color:#172033">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:32px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#fff;border:1px solid #e4e8f0;border-radius:18px;overflow:hidden">
            <tr>
              <td style="padding:28px 30px 12px;font-size:28px;font-weight:900;color:#e11d2e">AnyJob</td>
            </tr>
            <tr>
              <td style="padding:12px 30px 32px">
                <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:#111827">${title}</h1>
                <div style="font-size:16px;line-height:1.65;color:#4b5563">${body}</div>
                ${actionHtml}
                <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#8b95a7">This message was sent by AnyJob because of activity on your account or job posts.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
