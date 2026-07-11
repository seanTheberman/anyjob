alter table if exists public.eloo_reviews
  add column if not exists service_inquiry_id uuid references public.service_inquiries(id) on delete cascade,
  add column if not exists review_type text,
  add column if not exists title text,
  add column if not exists communication_rating integer,
  add column if not exists professionalism_rating integer,
  add column if not exists quality_rating integer,
  add column if not exists punctuality_rating integer,
  add column if not exists would_hire_again boolean,
  add column if not exists would_work_with_again boolean;

alter table if exists public.eloo_reviews
  drop constraint if exists eloo_reviews_review_type_check,
  add constraint eloo_reviews_review_type_check
    check (review_type is null or review_type in ('buyer_to_seller', 'seller_to_buyer')),
  drop constraint if exists eloo_reviews_communication_rating_check,
  add constraint eloo_reviews_communication_rating_check
    check (communication_rating is null or communication_rating between 1 and 5),
  drop constraint if exists eloo_reviews_professionalism_rating_check,
  add constraint eloo_reviews_professionalism_rating_check
    check (professionalism_rating is null or professionalism_rating between 1 and 5),
  drop constraint if exists eloo_reviews_quality_rating_check,
  add constraint eloo_reviews_quality_rating_check
    check (quality_rating is null or quality_rating between 1 and 5),
  drop constraint if exists eloo_reviews_punctuality_rating_check,
  add constraint eloo_reviews_punctuality_rating_check
    check (punctuality_rating is null or punctuality_rating between 1 and 5);

create unique index if not exists eloo_reviews_one_per_direction_per_service_inquiry
  on public.eloo_reviews(service_inquiry_id, reviewer_id, review_type)
  where service_inquiry_id is not null and review_type is not null;

create index if not exists idx_eloo_reviews_service_inquiry_id
  on public.eloo_reviews(service_inquiry_id);

comment on column public.eloo_reviews.service_inquiry_id is
  'Marketplace service inquiry reviewed. Enables buyer-to-provider and provider-to-buyer reviews without needing an eloo_booking row.';

comment on column public.eloo_reviews.review_type is
  'Direction of the review: buyer_to_seller or seller_to_buyer.';
