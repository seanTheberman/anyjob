alter table public.sellers
  add column if not exists service_area_radius_km integer not null default 15;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sellers_service_area_radius_check') then
    alter table public.sellers
      add constraint sellers_service_area_radius_check
      check (service_area_radius_km between 1 and 100);
  end if;
end $$;

create table if not exists public.seller_service_areas (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  provider text not null,
  provider_place_id text not null,
  label text not null,
  locality text not null,
  region text,
  country_name text not null,
  country_code text not null,
  postal_code text,
  latitude numeric(8, 5),
  longitude numeric(8, 5),
  radius_km integer not null default 15,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_service_areas_provider_check check (provider in ('geoapify', 'photon', 'profile')),
  constraint seller_service_areas_country_code_check check (country_code ~ '^[A-Z]{2}$'),
  constraint seller_service_areas_latitude_check check (latitude is null or latitude between -90 and 90),
  constraint seller_service_areas_longitude_check check (longitude is null or longitude between -180 and 180),
  constraint seller_service_areas_radius_check check (radius_km between 1 and 100),
  constraint seller_service_areas_seller_place_unique unique (seller_id, provider, provider_place_id)
);

create index if not exists seller_service_areas_seller_idx
  on public.seller_service_areas (seller_id, is_primary desc, created_at);
create index if not exists seller_service_areas_country_locality_idx
  on public.seller_service_areas (country_code, lower(locality));

alter table public.seller_service_areas enable row level security;
revoke all on table public.seller_service_areas from anon, authenticated;
grant all on table public.seller_service_areas to service_role;

create schema if not exists private;

create or replace function private.validate_seller_service_area()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  seller_country_code text;
begin
  select country_code into seller_country_code
  from public.sellers
  where id = new.seller_id;

  if seller_country_code is null then
    raise exception 'Seller must have a verified marketplace country before adding service areas';
  end if;

  if upper(new.country_code) <> upper(seller_country_code) then
    raise exception 'Service area country must match seller marketplace country';
  end if;

  new.country_code := upper(new.country_code);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists validate_seller_service_area_trigger on public.seller_service_areas;
create trigger validate_seller_service_area_trigger
  before insert or update on public.seller_service_areas
  for each row execute function private.validate_seller_service_area();

insert into public.seller_service_areas (
  seller_id,
  provider,
  provider_place_id,
  label,
  locality,
  region,
  country_name,
  country_code,
  postal_code,
  radius_km,
  is_primary
)
select
  seller.id,
  'profile',
  'profile:' || seller.id::text,
  concat_ws(', ', nullif(seller.city, ''), nullif(seller.region, ''), nullif(seller.country, '')),
  seller.city,
  seller.region,
  seller.country,
  seller.country_code,
  seller.postal_code,
  seller.service_area_radius_km,
  true
from public.sellers seller
where nullif(seller.city, '') is not null
  and nullif(seller.country, '') is not null
  and seller.country_code is not null
on conflict (seller_id, provider, provider_place_id) do nothing;
