alter table if exists public.sellers
  add column if not exists review_count integer not null default 0;

alter table if exists public.buyers
  add column if not exists rating numeric(3, 2) not null default 0,
  add column if not exists review_count integer not null default 0;

alter table if exists public.business_profiles
  add column if not exists rating numeric(3, 2) not null default 0,
  add column if not exists review_count integer not null default 0;

alter table if exists public.eloo_profiles
  add column if not exists review_count integer not null default 0;

alter table if exists public.user_profiles
  add column if not exists rating numeric(3, 2) not null default 0,
  add column if not exists review_count integer not null default 0;

comment on column public.sellers.review_count is
  'Cached count of public reviews this provider has received. Recomputed by the sync-review-ratings Edge Function.';

comment on column public.buyers.rating is
  'Cached average rating from public reviews this buyer has received.';

comment on column public.buyers.review_count is
  'Cached count of public reviews this buyer has received.';

comment on column public.business_profiles.rating is
  'Cached average rating from public reviews this business account has received.';

comment on column public.business_profiles.review_count is
  'Cached count of public reviews this business account has received.';

comment on column public.eloo_profiles.review_count is
  'Cached count of public reviews this unified profile has received.';

comment on column public.user_profiles.rating is
  'Cached average rating from public reviews this user has received.';

comment on column public.user_profiles.review_count is
  'Cached count of public reviews this user has received.';

with review_stats as (
  select
    reviewee_id,
    round(avg(rating)::numeric, 2) as rating,
    count(*)::integer as review_count
  from public.eloo_reviews
  where reviewee_id is not null
    and rating is not null
    and rating > 0
    and is_public is distinct from false
  group by reviewee_id
)
update public.sellers s
set
  rating = review_stats.rating,
  review_count = review_stats.review_count,
  updated_at = now()
from review_stats
where s.id = review_stats.reviewee_id;

with review_stats as (
  select
    reviewee_id,
    round(avg(rating)::numeric, 2) as rating,
    count(*)::integer as review_count
  from public.eloo_reviews
  where reviewee_id is not null
    and rating is not null
    and rating > 0
    and is_public is distinct from false
  group by reviewee_id
)
update public.buyers b
set
  rating = review_stats.rating,
  review_count = review_stats.review_count,
  updated_at = now()
from review_stats
where b.id = review_stats.reviewee_id;

with review_stats as (
  select
    reviewee_id,
    round(avg(rating)::numeric, 2) as rating,
    count(*)::integer as review_count
  from public.eloo_reviews
  where reviewee_id is not null
    and rating is not null
    and rating > 0
    and is_public is distinct from false
  group by reviewee_id
)
update public.business_profiles bp
set
  rating = review_stats.rating,
  review_count = review_stats.review_count,
  updated_at = now()
from review_stats
where bp.owner_user_id = review_stats.reviewee_id;

with review_stats as (
  select
    reviewee_id,
    round(avg(rating)::numeric, 2) as rating,
    count(*)::integer as review_count
  from public.eloo_reviews
  where reviewee_id is not null
    and rating is not null
    and rating > 0
    and is_public is distinct from false
  group by reviewee_id
)
update public.eloo_profiles ep
set
  rating = review_stats.rating,
  review_count = review_stats.review_count,
  updated_at = now()
from review_stats
where ep.id = review_stats.reviewee_id;

with review_stats as (
  select
    reviewee_id,
    round(avg(rating)::numeric, 2) as rating,
    count(*)::integer as review_count
  from public.eloo_reviews
  where reviewee_id is not null
    and rating is not null
    and rating > 0
    and is_public is distinct from false
  group by reviewee_id
)
update public.user_profiles up
set
  rating = review_stats.rating,
  review_count = review_stats.review_count,
  updated_at = now()
from review_stats
where up.id = review_stats.reviewee_id;
