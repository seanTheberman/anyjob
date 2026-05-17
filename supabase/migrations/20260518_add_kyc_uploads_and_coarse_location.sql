alter table if exists public.buyers
  add column if not exists id_document_url text,
  add column if not exists selfie_video_url text,
  add column if not exists kyc_status text not null default 'not_started',
  add column if not exists kyc_submitted_at timestamptz;

alter table if exists public.sellers
  add column if not exists selfie_video_url text,
  add column if not exists kyc_submitted_at timestamptz;

alter table if exists public.eloo_profiles
  add column if not exists kyc_status text not null default 'not_started',
  add column if not exists kyc_submitted_at timestamptz;

alter table if exists public.service_inquiries
  add column if not exists latitude decimal(10, 8),
  add column if not exists longitude decimal(11, 8),
  add column if not exists coarse_latitude decimal(10, 8),
  add column if not exists coarse_longitude decimal(11, 8),
  add column if not exists location_accuracy_meters integer,
  add column if not exists coarse_location_label text;

comment on column public.buyers.kyc_status is 'Buyer KYC progress for quote acceptance: not_started, submitted, approved, rejected.';
comment on column public.service_inquiries.coarse_location_label is 'Provider-facing approximate location label. Exact address is hidden until quote acceptance.';
