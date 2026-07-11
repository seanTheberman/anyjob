create index if not exists idx_business_profiles_owner_created_at
  on public.business_profiles(owner_user_id, created_at desc)
  where owner_user_id is not null;

create index if not exists idx_business_work_posts_owner_created_at
  on public.business_work_posts(owner_user_id, created_at desc)
  where owner_user_id is not null;

create index if not exists idx_shift_applications_owner_created_at
  on public.shift_applications(owner_user_id, created_at desc)
  where owner_user_id is not null;

create index if not exists idx_support_tickets_user_created_at
  on public.support_tickets(user_id, created_at desc)
  where user_id is not null;

create index if not exists idx_support_ticket_messages_ticket_created_at
  on public.support_ticket_messages(ticket_id, created_at asc)
  where ticket_id is not null;
