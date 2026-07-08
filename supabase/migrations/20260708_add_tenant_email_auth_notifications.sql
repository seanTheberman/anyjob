create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  primary_domain text,
  app_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_email_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  from_email text not null,
  from_name text not null default 'AnyJob',
  reply_to_email text,
  smtp_host text not null,
  smtp_port integer not null default 587,
  smtp_secure boolean not null default false,
  smtp_username text not null,
  smtp_password text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_email_configs_port_check check (smtp_port > 0 and smtp_port < 65536)
);

create unique index if not exists idx_tenant_email_configs_one_active
  on public.tenant_email_configs(tenant_id)
  where is_active = true;

create table if not exists public.custom_auth_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supabase_user_id uuid references auth.users(id) on delete set null,
  email text not null,
  password_hash text not null,
  role text not null default 'client',
  email_verified_at timestamptz,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_auth_users_tenant_email_unique unique (tenant_id, email),
  constraint custom_auth_users_status_check check (status in ('active', 'pending_verification', 'suspended', 'deleted')),
  constraint custom_auth_users_role_check check (role in ('client', 'buyer', 'provider', 'seller', 'business', 'admin'))
);

create unique index if not exists idx_custom_auth_users_tenant_email
  on public.custom_auth_users(tenant_id, lower(email));
create index if not exists idx_custom_auth_users_supabase_user_id
  on public.custom_auth_users(supabase_user_id);

create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  custom_auth_user_id uuid references public.custom_auth_users(id) on delete cascade,
  supabase_user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  custom_auth_user_id uuid references public.custom_auth_users(id) on delete cascade,
  supabase_user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_tokens_lookup
  on public.password_reset_tokens(lower(email), token_hash, expires_at)
  where used_at is null;

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_key text not null,
  dedupe_key text,
  recipient_user_id uuid,
  recipient_email text not null,
  subject text not null,
  html_body text not null,
  text_body text,
  status text not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  source_table text,
  source_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_outbox_status_check check (status in ('pending', 'sending', 'sent', 'failed', 'skipped'))
);

create unique index if not exists idx_email_outbox_dedupe
  on public.email_outbox(tenant_id, dedupe_key)
  where dedupe_key is not null;
create index if not exists idx_email_outbox_due
  on public.email_outbox(status, send_after);
create index if not exists idx_email_outbox_source
  on public.email_outbox(source_table, source_id);

create table if not exists public.job_notification_cursors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source_table text not null,
  source_id uuid not null,
  last_reminder_at timestamptz,
  last_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, source_table, source_id)
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_public_tenants_updated_at on public.tenants;
create trigger set_public_tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

drop trigger if exists set_public_tenant_email_configs_updated_at on public.tenant_email_configs;
create trigger set_public_tenant_email_configs_updated_at
  before update on public.tenant_email_configs
  for each row execute function public.set_updated_at();

drop trigger if exists set_public_custom_auth_users_updated_at on public.custom_auth_users;
create trigger set_public_custom_auth_users_updated_at
  before update on public.custom_auth_users
  for each row execute function public.set_updated_at();

drop trigger if exists set_public_email_outbox_updated_at on public.email_outbox;
create trigger set_public_email_outbox_updated_at
  before update on public.email_outbox
  for each row execute function public.set_updated_at();

drop trigger if exists set_public_job_notification_cursors_updated_at on public.job_notification_cursors;
create trigger set_public_job_notification_cursors_updated_at
  before update on public.job_notification_cursors
  for each row execute function public.set_updated_at();

alter table public.tenants enable row level security;
alter table public.tenant_email_configs enable row level security;
alter table public.custom_auth_users enable row level security;
alter table public.email_verification_tokens enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.email_outbox enable row level security;
alter table public.job_notification_cursors enable row level security;

revoke all on public.tenants from anon, authenticated;
revoke all on public.tenant_email_configs from anon, authenticated;
revoke all on public.custom_auth_users from anon, authenticated;
revoke all on public.email_verification_tokens from anon, authenticated;
revoke all on public.password_reset_tokens from anon, authenticated;
revoke all on public.email_outbox from anon, authenticated;
revoke all on public.job_notification_cursors from anon, authenticated;

grant select, insert, update, delete on public.tenants to service_role;
grant select, insert, update, delete on public.tenant_email_configs to service_role;
grant select, insert, update, delete on public.custom_auth_users to service_role;
grant select, insert, update, delete on public.email_verification_tokens to service_role;
grant select, insert, update, delete on public.password_reset_tokens to service_role;
grant select, insert, update, delete on public.email_outbox to service_role;
grant select, insert, update, delete on public.job_notification_cursors to service_role;

insert into public.tenants (slug, name, primary_domain, app_url)
values ('default', 'AnyJob', 'anyjob.eu', 'https://anyjob.eu')
on conflict (slug) do update
set name = excluded.name,
    primary_domain = excluded.primary_domain,
    app_url = coalesce(public.tenants.app_url, excluded.app_url),
    updated_at = now();

insert into public.tenant_email_configs (
  tenant_id,
  from_email,
  from_name,
  reply_to_email,
  smtp_host,
  smtp_port,
  smtp_secure,
  smtp_username,
  smtp_password,
  is_active
)
select
  id,
  'info@anyjob.eu',
  'AnyJob',
  'info@anyjob.eu',
  'smtp.gmail.com',
  587,
  false,
  'info@anyjob.eu',
  null,
  true
from public.tenants
where slug = 'default'
on conflict (tenant_id) where is_active = true do update
set from_email = excluded.from_email,
    from_name = excluded.from_name,
    reply_to_email = excluded.reply_to_email,
    smtp_host = excluded.smtp_host,
    smtp_port = excluded.smtp_port,
    smtp_secure = excluded.smtp_secure,
    smtp_username = excluded.smtp_username,
    updated_at = now();
