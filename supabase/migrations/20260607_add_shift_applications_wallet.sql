create table if not exists public.shift_applications (
  id uuid primary key default gen_random_uuid(),
  business_work_post_id uuid not null references public.business_work_posts(id) on delete cascade,
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  provider_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'applied',
  proposed_hourly_rate numeric(10, 2),
  proposed_day_rate numeric(10, 2),
  message text,
  applied_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shift_applications_status_check check (status in ('applied', 'accepted', 'rejected', 'withdrawn', 'completed', 'cancelled')),
  constraint shift_applications_unique_provider unique (business_work_post_id, provider_user_id)
);

create index if not exists idx_shift_applications_post_id on public.shift_applications(business_work_post_id);
create index if not exists idx_shift_applications_business_id on public.shift_applications(business_id);
create index if not exists idx_shift_applications_owner_user_id on public.shift_applications(owner_user_id);
create index if not exists idx_shift_applications_provider_user_id on public.shift_applications(provider_user_id);
create index if not exists idx_shift_applications_status on public.shift_applications(status);

create table if not exists public.shift_escrow_payments (
  id uuid primary key default gen_random_uuid(),
  business_work_post_id uuid not null references public.business_work_posts(id) on delete cascade,
  shift_application_id uuid not null references public.shift_applications(id) on delete cascade,
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  provider_user_id uuid not null references auth.users(id) on delete cascade,
  agreed_amount numeric(10, 2) not null,
  platform_fee numeric(10, 2) not null default 0,
  total_charged numeric(10, 2) not null,
  currency text not null default 'EUR',
  status text not null default 'requires_payment',
  payment_reference text,
  paid_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shift_escrow_payments_status_check check (status in ('requires_payment', 'held', 'released', 'refunded', 'cancelled')),
  constraint shift_escrow_payments_unique_application unique (shift_application_id)
);

create index if not exists idx_shift_escrow_payments_post_id on public.shift_escrow_payments(business_work_post_id);
create index if not exists idx_shift_escrow_payments_application_id on public.shift_escrow_payments(shift_application_id);
create index if not exists idx_shift_escrow_payments_owner_user_id on public.shift_escrow_payments(owner_user_id);
create index if not exists idx_shift_escrow_payments_provider_user_id on public.shift_escrow_payments(provider_user_id);
create index if not exists idx_shift_escrow_payments_status on public.shift_escrow_payments(status);

create table if not exists public.provider_wallet_entries (
  id uuid primary key default gen_random_uuid(),
  provider_user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null default 'shift',
  source_id uuid not null,
  amount numeric(10, 2) not null,
  currency text not null default 'EUR',
  status text not null default 'pending',
  description text,
  available_at timestamptz,
  paid_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_wallet_entries_status_check check (status in ('pending', 'available', 'paid_out', 'cancelled')),
  constraint provider_wallet_entries_source_unique unique (source_type, source_id)
);

create index if not exists idx_provider_wallet_entries_provider_user_id on public.provider_wallet_entries(provider_user_id);
create index if not exists idx_provider_wallet_entries_status on public.provider_wallet_entries(status);
create index if not exists idx_provider_wallet_entries_source on public.provider_wallet_entries(source_type, source_id);

alter table public.shift_applications enable row level security;
alter table public.shift_escrow_payments enable row level security;
alter table public.provider_wallet_entries enable row level security;

drop policy if exists "Providers can read own shift applications" on public.shift_applications;
create policy "Providers can read own shift applications"
  on public.shift_applications for select
  using (auth.uid() = provider_user_id);

drop policy if exists "Business owners can read own shift applications" on public.shift_applications;
create policy "Business owners can read own shift applications"
  on public.shift_applications for select
  using (auth.uid() = owner_user_id);

drop policy if exists "Providers can insert own shift applications" on public.shift_applications;
create policy "Providers can insert own shift applications"
  on public.shift_applications for insert
  with check (auth.uid() = provider_user_id);

drop policy if exists "Business owners can read own shift escrow" on public.shift_escrow_payments;
create policy "Business owners can read own shift escrow"
  on public.shift_escrow_payments for select
  using (auth.uid() = owner_user_id);

drop policy if exists "Providers can read own shift escrow" on public.shift_escrow_payments;
create policy "Providers can read own shift escrow"
  on public.shift_escrow_payments for select
  using (auth.uid() = provider_user_id);

drop policy if exists "Providers can read own wallet entries" on public.provider_wallet_entries;
create policy "Providers can read own wallet entries"
  on public.provider_wallet_entries for select
  using (auth.uid() = provider_user_id);

drop trigger if exists set_shift_applications_updated_at on public.shift_applications;
create trigger set_shift_applications_updated_at
  before update on public.shift_applications
  for each row execute function public.set_updated_at();

drop trigger if exists set_shift_escrow_payments_updated_at on public.shift_escrow_payments;
create trigger set_shift_escrow_payments_updated_at
  before update on public.shift_escrow_payments
  for each row execute function public.set_updated_at();

drop trigger if exists set_provider_wallet_entries_updated_at on public.provider_wallet_entries;
create trigger set_provider_wallet_entries_updated_at
  before update on public.provider_wallet_entries
  for each row execute function public.set_updated_at();
