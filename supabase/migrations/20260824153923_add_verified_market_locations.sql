create table if not exists public.user_market_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  country_code text not null,
  country_name text not null,
  region text,
  city text,
  postal_code text,
  coarse_latitude numeric(8, 5),
  coarse_longitude numeric(8, 5),
  accuracy_meters integer,
  ip_country_code text,
  gps_country_code text,
  verification_source text not null,
  verified_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_market_locations_country_code_check check (country_code ~ '^[A-Z]{2}$'),
  constraint user_market_locations_ip_country_check check (ip_country_code is null or ip_country_code ~ '^[A-Z]{2}$'),
  constraint user_market_locations_gps_country_check check (gps_country_code is null or gps_country_code ~ '^[A-Z]{2}$'),
  constraint user_market_locations_source_check check (verification_source in ('gps', 'ip', 'gps_ip', 'legacy')),
  constraint user_market_locations_latitude_check check (coarse_latitude is null or coarse_latitude between -90 and 90),
  constraint user_market_locations_longitude_check check (coarse_longitude is null or coarse_longitude between -180 and 180)
);

create index if not exists user_market_locations_country_user_idx
  on public.user_market_locations (country_code, user_id);

alter table public.user_market_locations enable row level security;
revoke all on table public.user_market_locations from anon, authenticated;
grant all on table public.user_market_locations to service_role;

alter table public.buyers
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists location_verified_at timestamptz;

alter table public.sellers
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists location_verified_at timestamptz;

alter table public.eloo_profiles
  add column if not exists country text,
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists location_verified_at timestamptz;

alter table public.eloo_profiles
  alter column country set default 'Ireland',
  alter column country_code set default 'IE';

alter table public.service_inquiries
  add column if not exists country text,
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists location_verified_at timestamptz;

alter table public.business_profiles
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists location_verified_at timestamptz;

alter table public.business_work_posts
  add column if not exists country text,
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists location_verified_at timestamptz;

alter table public.shift_worker_profiles
  add column if not exists country_code text;

update public.buyers
set country = coalesce(nullif(country, ''), 'Ireland'),
    country_code = case
      when lower(coalesce(country, '')) in ('united kingdom', 'uk', 'great britain') then 'GB'
      when lower(coalesce(country, '')) in ('france', 'fr') then 'FR'
      else 'IE'
    end
where country_code is null;

update public.sellers
set country = coalesce(nullif(country, ''), 'Ireland'),
    country_code = case
      when lower(coalesce(country, '')) in ('united kingdom', 'uk', 'great britain') then 'GB'
      when lower(coalesce(country, '')) in ('france', 'fr') then 'FR'
      else 'IE'
    end
where country_code is null;

update public.eloo_profiles profile
set country = coalesce(nullif(profile.country, ''), seller.country, buyer.country, 'Ireland'),
    country_code = coalesce(seller.country_code, buyer.country_code, 'IE'),
    city = coalesce(profile.city, seller.city, buyer.city),
    postal_code = coalesce(profile.postal_code, seller.postal_code, buyer.postal_code)
from public.buyers buyer
full join public.sellers seller on seller.id = buyer.id
where profile.id = coalesce(buyer.id, seller.id)
  and profile.country_code is null;

update public.eloo_profiles
set country = coalesce(nullif(country, ''), 'Ireland'),
    country_code = coalesce(country_code, 'IE')
where country_code is null;

update public.service_inquiries inquiry
set country = coalesce(nullif(inquiry.country, ''), buyer.country, profile.country, 'Ireland'),
    country_code = coalesce(buyer.country_code, profile.country_code, 'IE'),
    region = coalesce(inquiry.region, buyer.region, profile.region)
from public.eloo_profiles profile
left join public.buyers buyer on buyer.id = profile.id
where inquiry.user_id = profile.id
  and inquiry.country_code is null;

update public.service_inquiries
set country = coalesce(nullif(country, ''), 'Ireland'),
    country_code = coalesce(country_code, 'IE')
where country_code is null;

update public.business_profiles business
set country = coalesce(nullif(business.country, ''), 'Ireland'),
    country_code = coalesce(profile.country_code, 'IE'),
    region = coalesce(business.region, profile.region)
from public.eloo_profiles profile
where business.owner_user_id = profile.id
  and business.country_code is null;

update public.business_profiles
set country_code = coalesce(country_code, 'IE')
where country_code is null;

update public.business_work_posts post
set country = business.country,
    country_code = business.country_code,
    region = business.region
from public.business_profiles business
where post.business_id = business.id
  and post.country_code is null;

update public.business_work_posts
set country = coalesce(nullif(country, ''), 'Ireland'),
    country_code = coalesce(country_code, 'IE')
where country_code is null;

update public.shift_worker_profiles worker
set country_code = coalesce(profile.country_code, 'IE')
from public.eloo_profiles profile
where worker.user_id = profile.id
  and worker.country_code is null;

update public.shift_worker_profiles
set country_code = 'IE'
where country_code is null;

insert into public.user_market_locations (
  user_id, country_code, country_name, region, city, postal_code,
  verification_source, verified_at, updated_at
)
select
  profile.id,
  profile.country_code,
  profile.country,
  profile.region,
  profile.city,
  profile.postal_code,
  'legacy',
  now(),
  now()
from public.eloo_profiles profile
join auth.users auth_user on auth_user.id = profile.id
where profile.country_code is not null
on conflict (user_id) do nothing;

alter table public.buyers alter column country_code set not null;
alter table public.buyers alter column country set not null;
alter table public.sellers alter column country_code set not null;
alter table public.sellers alter column country set not null;
alter table public.eloo_profiles alter column country_code set not null;
alter table public.eloo_profiles alter column country set not null;
alter table public.service_inquiries alter column country_code set not null;
alter table public.service_inquiries alter column country set not null;
alter table public.business_profiles alter column country_code set not null;
alter table public.business_work_posts alter column country_code set not null;
alter table public.business_work_posts alter column country set not null;
alter table public.shift_worker_profiles alter column country_code set not null;

create index if not exists service_inquiries_country_status_submitted_idx
  on public.service_inquiries (country_code, status, submitted_at desc);
create index if not exists sellers_country_status_created_idx
  on public.sellers (country_code, status, created_at desc);
create index if not exists business_work_posts_country_status_created_idx
  on public.business_work_posts (country_code, status, created_at desc);
create index if not exists shift_worker_profiles_country_status_idx
  on public.shift_worker_profiles (country_code, status);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'buyers_country_code_check') then
    alter table public.buyers add constraint buyers_country_code_check check (country_code ~ '^[A-Z]{2}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sellers_country_code_check') then
    alter table public.sellers add constraint sellers_country_code_check check (country_code ~ '^[A-Z]{2}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'service_inquiries_country_code_check') then
    alter table public.service_inquiries add constraint service_inquiries_country_code_check check (country_code ~ '^[A-Z]{2}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'eloo_profiles_country_code_check') then
    alter table public.eloo_profiles add constraint eloo_profiles_country_code_check check (country_code ~ '^[A-Z]{2}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'business_profiles_country_code_check') then
    alter table public.business_profiles add constraint business_profiles_country_code_check check (country_code ~ '^[A-Z]{2}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'business_work_posts_country_code_check') then
    alter table public.business_work_posts add constraint business_work_posts_country_code_check check (country_code ~ '^[A-Z]{2}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'shift_worker_profiles_country_code_check') then
    alter table public.shift_worker_profiles add constraint shift_worker_profiles_country_code_check check (country_code ~ '^[A-Z]{2}$');
  end if;
end $$;

create schema if not exists private;

create or replace function private.apply_inquiry_market_location()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  market_location public.user_market_locations%rowtype;
begin
  select * into market_location
  from public.user_market_locations
  where user_id = new.user_id;

  if not found then
    raise exception 'Verified marketplace location is required before posting a job';
  end if;

  new.country_code := market_location.country_code;
  new.country := market_location.country_name;
  new.region := market_location.region;
  new.city := coalesce(market_location.city, new.city);
  new.postal_code := coalesce(market_location.postal_code, new.postal_code);
  new.coarse_latitude := market_location.coarse_latitude;
  new.coarse_longitude := market_location.coarse_longitude;
  new.location_accuracy_meters := market_location.accuracy_meters;
  new.coarse_location_label := concat_ws(
    ', ',
    market_location.city,
    case
      when nullif(market_location.postal_code, '') is not null
        then left(market_location.postal_code, 3) || ' area'
      else null
    end
  );
  new.location_verified_at := market_location.verified_at;
  return new;
end;
$$;

create or replace function private.apply_business_post_market_location()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  market_location public.user_market_locations%rowtype;
begin
  select * into market_location
  from public.user_market_locations
  where user_id = new.owner_user_id;

  if not found then
    raise exception 'Verified marketplace location is required before posting work';
  end if;

  new.country_code := market_location.country_code;
  new.country := market_location.country_name;
  new.region := market_location.region;
  new.city := coalesce(market_location.city, new.city);
  new.postal_code := coalesce(market_location.postal_code, new.postal_code);
  new.location_verified_at := market_location.verified_at;
  return new;
end;
$$;

revoke all on function private.apply_inquiry_market_location() from public, anon, authenticated;
revoke all on function private.apply_business_post_market_location() from public, anon, authenticated;

drop trigger if exists service_inquiries_verified_market_location on public.service_inquiries;
create trigger service_inquiries_verified_market_location
before insert or update of user_id on public.service_inquiries
for each row execute function private.apply_inquiry_market_location();

drop trigger if exists business_posts_verified_market_location on public.business_work_posts;
create trigger business_posts_verified_market_location
before insert or update of owner_user_id on public.business_work_posts
for each row execute function private.apply_business_post_market_location();
