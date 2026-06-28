alter table public.eloo_provider_services
add column if not exists gig_details jsonb not null default '{}'::jsonb;

comment on column public.eloo_provider_services.gig_details is
  'Structured gig builder details: packages, media URLs, video URL, FAQs, and buyer requirement questions.';
