create index if not exists idx_eloo_reviews_reviewee_created_at
  on public.eloo_reviews(reviewee_id, created_at desc)
  where reviewee_id is not null;

create index if not exists idx_eloo_reviews_reviewer_created_at
  on public.eloo_reviews(reviewer_id, created_at desc)
  where reviewer_id is not null;

create index if not exists idx_eloo_reviews_reviewee_type_created_at
  on public.eloo_reviews(reviewee_id, review_type, created_at desc)
  where reviewee_id is not null and review_type is not null;

create index if not exists idx_eloo_reviews_service_inquiry_created_at
  on public.eloo_reviews(service_inquiry_id, created_at desc)
  where service_inquiry_id is not null;

create index if not exists idx_eloo_reviews_shift_application_created_at
  on public.eloo_reviews(shift_application_id, created_at desc)
  where shift_application_id is not null;
