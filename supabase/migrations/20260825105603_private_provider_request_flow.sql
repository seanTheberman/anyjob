alter table public.service_inquiries
  add column if not exists request_visibility text not null default 'public',
  add column if not exists target_provider_id uuid references public.sellers(id) on delete set null,
  add column if not exists provider_decision_status text not null default 'not_required',
  add column if not exists provider_decision_at timestamptz,
  add column if not exists provider_rejection_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'service_inquiries_request_visibility_check'
  ) then
    alter table public.service_inquiries
      add constraint service_inquiries_request_visibility_check
      check (request_visibility in ('public', 'private'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'service_inquiries_provider_decision_status_check'
  ) then
    alter table public.service_inquiries
      add constraint service_inquiries_provider_decision_status_check
      check (provider_decision_status in ('not_required', 'pending', 'accepted', 'rejected'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'service_inquiries_private_target_check'
  ) then
    alter table public.service_inquiries
      add constraint service_inquiries_private_target_check
      check (
        (request_visibility = 'public' and provider_decision_status = 'not_required')
        or
        (request_visibility = 'private' and target_provider_id is not null and provider_decision_status <> 'not_required')
      );
  end if;
end $$;

create index if not exists service_inquiries_private_provider_status_idx
  on public.service_inquiries (target_provider_id, provider_decision_status, submitted_at desc)
  where request_visibility = 'private';

alter table public.eloo_conversations
  add column if not exists inquiry_id uuid references public.service_inquiries(id) on delete cascade;

create unique index if not exists eloo_conversations_active_inquiry_idx
  on public.eloo_conversations (inquiry_id)
  where inquiry_id is not null and is_active = true;

drop policy if exists "Target providers can view private inquiries" on public.service_inquiries;
create policy "Target providers can view private inquiries"
  on public.service_inquiries
  for select
  to authenticated
  using (
    request_visibility = 'private'
    and target_provider_id = (select auth.uid())
  );

drop policy if exists "Service inquiry visibility boundary" on public.service_inquiries;
create policy "Service inquiry visibility boundary"
  on public.service_inquiries
  as restrictive
  for select
  to public
  using (
    request_visibility = 'public'
    or user_id = (select auth.uid())
    or target_provider_id = (select auth.uid())
  );

comment on column public.service_inquiries.request_visibility is
  'Controls whether a request is listed publicly or sent only to target_provider_id.';
comment on column public.service_inquiries.provider_decision_status is
  'Provider review state for private directed requests. Payment is allowed only after accepted.';
comment on column public.eloo_conversations.inquiry_id is
  'Links the pre-payment requirements conversation to its service inquiry.';

update public.app_content_entries
set
  value = case
    when value = 'What do you need help with?' then 'Post a job'
    else value
  end,
  default_value = 'Post a job',
  updated_at = now()
where content_key = 'home.hero.search';
