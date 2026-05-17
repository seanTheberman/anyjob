alter table if exists public.service_inquiries
  add column if not exists custom_tags text[] not null default '{}';

comment on column public.service_inquiries.custom_tags is
  'Buyer-defined tags for flexible custom jobs and non-standard requests.';
