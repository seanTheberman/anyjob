alter table if exists public.service_inquiries
  add column if not exists admin_posted boolean not null default false,
  add column if not exists admin_posted_by uuid references auth.users(id) on delete set null,
  add column if not exists anyjob_select boolean not null default false,
  add column if not exists select_quote_recipient_email text,
  add column if not exists select_quote_recipient_name text,
  add column if not exists select_quote_note text,
  add column if not exists select_quote_selected_bid_id uuid references public.bids(id) on delete set null,
  add column if not exists select_quote_selected_at timestamptz,
  add column if not exists select_quote_payment_status text not null default 'unpaid';

create table if not exists public.admin_select_quote_acceptances (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.service_inquiries(id) on delete cascade,
  bid_id uuid not null references public.bids(id) on delete cascade,
  recipient_email text not null,
  token text not null unique,
  status text not null default 'emailed',
  selected_at timestamptz,
  paid_at timestamptz,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint admin_select_quote_acceptances_status_check check (status in ('emailed', 'selected', 'paid', 'expired'))
);

create index if not exists idx_service_inquiries_anyjob_select
  on public.service_inquiries(anyjob_select, status, submitted_at desc)
  where anyjob_select = true;

create index if not exists idx_admin_select_quote_acceptances_inquiry
  on public.admin_select_quote_acceptances(inquiry_id, created_at desc);

create index if not exists idx_admin_select_quote_acceptances_bid
  on public.admin_select_quote_acceptances(bid_id);

drop trigger if exists set_public_admin_select_quote_acceptances_updated_at on public.admin_select_quote_acceptances;
create trigger set_public_admin_select_quote_acceptances_updated_at
  before update on public.admin_select_quote_acceptances
  for each row execute function public.set_updated_at();

alter table public.admin_select_quote_acceptances enable row level security;
revoke all on public.admin_select_quote_acceptances from anon, authenticated;
grant select, insert, update, delete on public.admin_select_quote_acceptances to service_role;

comment on column public.service_inquiries.anyjob_select is
  'Admin-posted marketplace job shown to providers with the AnyJob Select badge.';

comment on column public.service_inquiries.select_quote_recipient_email is
  'External email chosen by admin. Every quote for an AnyJob Select job is sent to this address.';
