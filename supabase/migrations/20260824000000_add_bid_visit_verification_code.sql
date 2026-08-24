alter table if exists public.bids
  add column if not exists visit_verification_code text,
  add column if not exists visit_verification_code_created_at timestamptz;

alter table if exists public.bids
  drop constraint if exists bids_visit_verification_code_check;

alter table if exists public.bids
  add constraint bids_visit_verification_code_check
  check (
    visit_verification_code is null
    or visit_verification_code ~ '^[0-9]{4}$'
  );

comment on column public.bids.visit_verification_code is
  'Four digit shared visit code shown to the buyer and accepted provider so the buyer can verify the correct provider at arrival.';

comment on column public.bids.visit_verification_code_created_at is
  'Timestamp when the visit verification code was generated.';
