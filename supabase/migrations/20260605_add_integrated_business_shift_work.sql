alter table if exists public.sellers
  add column if not exists provider_work_mode text not null default 'freelance',
  add column if not exists can_work_freelance boolean not null default true,
  add column if not exists can_work_shifts boolean not null default false;

alter table if exists public.eloo_profiles
  add column if not exists provider_work_mode text,
  add column if not exists can_work_freelance boolean not null default false,
  add column if not exists can_work_shifts boolean not null default false,
  add column if not exists has_business_profile boolean not null default false,
  add column if not exists business_registration_status text not null default 'not_started';

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  legal_name text,
  registration_number text not null,
  business_type text not null,
  industry text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  address text not null,
  city text not null,
  postal_code text,
  country text not null default 'Ireland',
  document_url text not null,
  document_source text not null default 'url',
  typical_work_types text[] not null default '{}',
  typical_roles_needed text[] not null default '{}',
  status text not null default 'pending',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_profiles_registration_number_unique unique (registration_number),
  constraint business_profiles_status_check check (status in ('pending', 'approved', 'rejected', 'suspended')),
  constraint business_profiles_document_source_check check (document_source in ('url', 'upload'))
);

create index if not exists idx_business_profiles_owner_user_id on public.business_profiles(owner_user_id);
create index if not exists idx_business_profiles_status on public.business_profiles(status);
create index if not exists idx_business_profiles_industry on public.business_profiles(industry);

create table if not exists public.shift_market_rates (
  id uuid primary key default gen_random_uuid(),
  country text not null default 'Ireland',
  city text,
  industry text not null,
  niche text not null,
  role_title text not null,
  hourly_low numeric(10, 2),
  hourly_average numeric(10, 2) not null,
  hourly_high numeric(10, 2),
  day_low numeric(10, 2),
  day_average numeric(10, 2),
  day_high numeric(10, 2),
  source text,
  is_active boolean not null default true,
  effective_from date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_shift_market_rates_niche on public.shift_market_rates(niche);
create index if not exists idx_shift_market_rates_industry on public.shift_market_rates(industry);

create table if not exists public.shift_worker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  provider_profile_id uuid references public.eloo_profiles(id) on delete cascade,
  work_mode text not null default 'shift',
  niches text[] not null default '{}',
  preferred_roles text[] not null default '{}',
  skills text[] not null default '{}',
  certifications text[] not null default '{}',
  availability jsonb not null default '{}',
  travel_radius_km integer not null default 10,
  preferred_hourly_rate numeric(10, 2),
  preferred_day_rate numeric(10, 2),
  market_rate_acknowledged_at timestamptz,
  open_to_freelance_jobs boolean not null default true,
  open_to_urgent_shifts boolean not null default false,
  open_to_recurring_shifts boolean not null default false,
  reliability_score numeric(5, 2) not null default 0,
  status text not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shift_worker_profiles_work_mode_check check (work_mode in ('shift', 'both')),
  constraint shift_worker_profiles_status_check check (status in ('available', 'paused', 'suspended'))
);

create index if not exists idx_shift_worker_profiles_user_id on public.shift_worker_profiles(user_id);
create index if not exists idx_shift_worker_profiles_niches on public.shift_worker_profiles using gin(niches);
create index if not exists idx_shift_worker_profiles_status on public.shift_worker_profiles(status);

create table if not exists public.business_work_posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  work_type text not null,
  industry text not null,
  niche text not null,
  role_title text not null,
  description text not null,
  location_name text,
  address text not null,
  city text not null,
  postal_code text,
  starts_at timestamptz,
  ends_at timestamptz,
  headcount integer not null default 1,
  business_preferred_hourly_rate numeric(10, 2),
  business_preferred_day_rate numeric(10, 2),
  accepts_worker_rate_variation boolean not null default true,
  requirements text,
  uniform text,
  break_policy text,
  contact_name text,
  contact_phone text,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_work_posts_work_type_check check (work_type in ('freelance_service', 'part_time_day_wage', 'long_duration_shift')),
  constraint business_work_posts_status_check check (status in ('draft', 'submitted', 'filled', 'cancelled', 'completed')),
  constraint business_work_posts_headcount_check check (headcount > 0)
);

create index if not exists idx_business_work_posts_business_id on public.business_work_posts(business_id);
create index if not exists idx_business_work_posts_owner_user_id on public.business_work_posts(owner_user_id);
create index if not exists idx_business_work_posts_status on public.business_work_posts(status);
create index if not exists idx_business_work_posts_niche on public.business_work_posts(niche);
create index if not exists idx_business_work_posts_work_type on public.business_work_posts(work_type);

alter table public.business_profiles enable row level security;
alter table public.shift_market_rates enable row level security;
alter table public.shift_worker_profiles enable row level security;
alter table public.business_work_posts enable row level security;

drop policy if exists "Business owners can read own business profile" on public.business_profiles;
create policy "Business owners can read own business profile"
  on public.business_profiles for select
  using (auth.uid() = owner_user_id);

drop policy if exists "Business owners can insert own business profile" on public.business_profiles;
create policy "Business owners can insert own business profile"
  on public.business_profiles for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "Business owners can update pending business profile" on public.business_profiles;
create policy "Business owners can update pending business profile"
  on public.business_profiles for update
  using (auth.uid() = owner_user_id and status in ('pending', 'rejected'))
  with check (
    auth.uid() = owner_user_id
    and status in ('pending', 'rejected')
    and reviewed_by is null
    and reviewed_at is null
  );

drop policy if exists "Public can read active shift market rates" on public.shift_market_rates;
create policy "Public can read active shift market rates"
  on public.shift_market_rates for select
  using (is_active = true);

drop policy if exists "Shift workers can read own shift profile" on public.shift_worker_profiles;
create policy "Shift workers can read own shift profile"
  on public.shift_worker_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Shift workers can insert own shift profile" on public.shift_worker_profiles;
create policy "Shift workers can insert own shift profile"
  on public.shift_worker_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Shift workers can update own shift profile" on public.shift_worker_profiles;
create policy "Shift workers can update own shift profile"
  on public.shift_worker_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Approved businesses can read eligible shift workers" on public.shift_worker_profiles;
create policy "Approved businesses can read eligible shift workers"
  on public.shift_worker_profiles for select
  using (
    status = 'available'
    and exists (
      select 1
      from public.business_profiles bp
      where bp.owner_user_id = auth.uid()
        and bp.status = 'approved'
    )
  );

drop policy if exists "Business owners can read own work posts" on public.business_work_posts;
create policy "Business owners can read own work posts"
  on public.business_work_posts for select
  using (auth.uid() = owner_user_id);

drop policy if exists "Approved business owners can insert work posts" on public.business_work_posts;
create policy "Approved business owners can insert work posts"
  on public.business_work_posts for insert
  with check (
    auth.uid() = owner_user_id
    and exists (
      select 1
      from public.business_profiles bp
      where bp.id = business_id
        and bp.owner_user_id = auth.uid()
        and bp.status = 'approved'
        and bp.registration_number is not null
        and bp.document_url is not null
    )
  );

drop policy if exists "Business owners can update own work posts" on public.business_work_posts;
create policy "Business owners can update own work posts"
  on public.business_work_posts for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

insert into public.shift_market_rates (country, industry, niche, role_title, hourly_low, hourly_average, hourly_high, day_low, day_average, day_high, source)
values
  ('Ireland', 'Healthcare', 'healthcare', 'Healthcare support worker', 16, 22, 30, 120, 165, 230, 'AnyJob launch estimate'),
  ('Ireland', 'Hospitality', 'hospitality', 'Wait staff', 13, 17, 24, 95, 130, 180, 'AnyJob launch estimate'),
  ('Ireland', 'Cleaning', 'cleaning', 'Commercial cleaner', 14, 18, 24, 100, 135, 180, 'AnyJob launch estimate'),
  ('Ireland', 'Retail', 'retail', 'Retail assistant', 12, 16, 22, 90, 120, 165, 'AnyJob launch estimate'),
  ('Ireland', 'Logistics', 'logistics', 'Warehouse operative', 14, 18, 25, 100, 140, 190, 'AnyJob launch estimate'),
  ('Ireland', 'Events', 'events', 'Event staff', 13, 18, 26, 95, 140, 200, 'AnyJob launch estimate')
on conflict do nothing;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_business_profiles_updated_at on public.business_profiles;
create trigger set_business_profiles_updated_at
  before update on public.business_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_shift_worker_profiles_updated_at on public.shift_worker_profiles;
create trigger set_shift_worker_profiles_updated_at
  before update on public.shift_worker_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_business_work_posts_updated_at on public.business_work_posts;
create trigger set_business_work_posts_updated_at
  before update on public.business_work_posts
  for each row execute function public.set_updated_at();
