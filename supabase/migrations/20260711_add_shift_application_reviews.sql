alter table if exists public.eloo_reviews
  add column if not exists shift_application_id uuid references public.shift_applications(id) on delete cascade,
  add column if not exists business_work_post_id uuid references public.business_work_posts(id) on delete cascade;

create index if not exists idx_eloo_reviews_shift_application_id
  on public.eloo_reviews(shift_application_id);

create index if not exists idx_eloo_reviews_business_work_post_id
  on public.eloo_reviews(business_work_post_id);

create unique index if not exists eloo_reviews_one_per_direction_per_shift_application
  on public.eloo_reviews(shift_application_id, reviewer_id, review_type)
  where shift_application_id is not null and review_type is not null;

comment on column public.eloo_reviews.shift_application_id is
  'Shift application reviewed after a completed business shift.';

comment on column public.eloo_reviews.business_work_post_id is
  'Business work post associated with a shift review.';
