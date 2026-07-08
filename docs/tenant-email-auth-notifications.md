# Tenant Email, Custom Auth, and Job Notifications

## What was added

- `public.tenants`: one row per tenant, locked by RLS.
- `public.tenant_email_configs`: tenant SMTP configuration read by Edge Functions, locked by RLS.
- `public.custom_auth_users`: replacement auth-store foundation populated by new buyer/provider registrations.
- `public.password_reset_tokens` and `public.email_verification_tokens`: token tables for owned email flows.
- `public.email_outbox`: SMTP delivery audit and dedupe table.
- `email-verification`, `forgot-password`, `reset-password`, and `job-notifications` Supabase Edge Functions.
- `/verify-email`, `/forgot-password`, and `/reset-password` app pages.
- `/api/cron/job-reminders`: daily trigger for live job reminders.

## SMTP tenant setup

The migration creates the default tenant and an email config shell for `info@anyjob.eu`, but leaves the password empty on purpose. Put the SMTP password into the database after applying the migration:

```sql
update public.tenant_email_configs
set smtp_password = '<app-password-from-mail-provider>',
    updated_at = now()
where tenant_id = (select id from public.tenants where slug = 'default')
  and is_active = true;
```

## Public link URL

Password reset, email verification, and job notification links use `public.tenants.app_url`.
Change the public app URL with one database update:

```sql
update public.tenants
set app_url = 'https://anyjob.eu',
    updated_at = now()
where slug = 'default';
```

## Edge Function deployment

Deploy these functions after the migration is applied:

```bash
supabase functions deploy email-verification --project-ref egtpwmzzjvyptmswddip
supabase functions deploy forgot-password --project-ref egtpwmzzjvyptmswddip
supabase functions deploy reset-password --project-ref egtpwmzzjvyptmswddip
supabase functions deploy job-notifications --project-ref egtpwmzzjvyptmswddip
```

Deploy with JWT verification enabled. The app invokes the auth email endpoints from Next.js API routes using the service role key, and the user-facing pages return generic success messages to avoid account enumeration. `job-notifications` also checks for a service-role JWT before processing notification actions.

## Production environment

Set these in Vercel:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
```

For the daily reminder cron, configure Vercel Cron to send:

```txt
Authorization: Bearer <CRON_SECRET>
```

The cron route invokes `job-notifications` with `process_live_job_reminders`, which emails live jobs every 24 hours until the status leaves `submitted` or `approved`.

## Current bridge behavior

The existing app still uses Supabase sessions in many routes. New buyer/provider registrations now also write a bcrypt hash to `public.custom_auth_users`, and password reset supports both the new table and current Supabase Auth user ids. A complete auth migration still requires replacing all `supabase.auth.getUser()` and `signInWithPassword()` call sites with first-party session cookies/JWTs.
