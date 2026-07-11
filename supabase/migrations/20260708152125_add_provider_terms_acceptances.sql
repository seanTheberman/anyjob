create extension if not exists pgcrypto;

create table if not exists public.provider_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references auth.users(id) on delete cascade,
  provider_email text not null,
  inquiry_id uuid not null references public.service_inquiries(id) on delete cascade,
  bid_id uuid references public.bids(id) on delete set null,
  terms_version text not null default 'provider_quote_terms_v1',
  terms_url text not null default '/pricing#terms',
  accepted_at timestamptz not null default now(),
  accepted_ip inet,
  accepted_user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_terms_acceptances_provider_email_check check (position('@' in provider_email) > 1),
  constraint provider_terms_acceptances_terms_version_check check (length(trim(terms_version)) > 0),
  constraint provider_terms_acceptances_terms_url_check check (length(trim(terms_url)) > 0)
);

create unique index if not exists idx_provider_terms_acceptances_provider_job_version
  on public.provider_terms_acceptances(provider_id, inquiry_id, terms_version);

create unique index if not exists idx_provider_terms_acceptances_bid
  on public.provider_terms_acceptances(bid_id)
  where bid_id is not null;

create index if not exists idx_provider_terms_acceptances_inquiry
  on public.provider_terms_acceptances(inquiry_id, accepted_at desc);

drop trigger if exists set_provider_terms_acceptances_updated_at on public.provider_terms_acceptances;
create trigger set_provider_terms_acceptances_updated_at
  before update on public.provider_terms_acceptances
  for each row execute function public.set_updated_at();

alter table public.provider_terms_acceptances enable row level security;

revoke all on public.provider_terms_acceptances from anon, authenticated;
grant select on public.provider_terms_acceptances to authenticated;
grant select, insert, update, delete on public.provider_terms_acceptances to service_role;

drop policy if exists "Providers can read their own quote terms acceptances" on public.provider_terms_acceptances;
create policy "Providers can read their own quote terms acceptances"
  on public.provider_terms_acceptances
  for select
  to authenticated
  using ((select auth.uid()) = provider_id);
