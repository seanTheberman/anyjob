create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_user_id),
  constraint user_blocks_different_users check (blocker_id <> blocked_user_id)
);

create table if not exists public.user_safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  reported_user_id uuid references auth.users(id) on delete set null,
  reason text not null check (reason in (
    'harassment',
    'scam_or_fraud',
    'inappropriate_content',
    'safety_concern',
    'other'
  )),
  details text,
  conversation_id uuid references public.eloo_conversations(id) on delete set null,
  source_path text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_blocks_blocked_user_idx
  on public.user_blocks (blocked_user_id);
create index if not exists user_safety_reports_status_created_idx
  on public.user_safety_reports (status, created_at desc);
create index if not exists user_safety_reports_reported_user_idx
  on public.user_safety_reports (reported_user_id, created_at desc);

alter table public.user_blocks enable row level security;
alter table public.user_safety_reports enable row level security;

drop policy if exists "Users manage their own blocks" on public.user_blocks;
create policy "Users manage their own blocks"
  on public.user_blocks
  for all
  to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

drop policy if exists "Users create their own safety reports" on public.user_safety_reports;
create policy "Users create their own safety reports"
  on public.user_safety_reports
  for insert
  to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "Users read their own safety reports" on public.user_safety_reports;
create policy "Users read their own safety reports"
  on public.user_safety_reports
  for select
  to authenticated
  using (auth.uid() = reporter_id);

grant select, insert, delete on public.user_blocks to authenticated;
grant select, insert on public.user_safety_reports to authenticated;
grant all on public.user_blocks to service_role;
grant all on public.user_safety_reports to service_role;
