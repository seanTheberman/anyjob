create table if not exists public.buyer_plan_subscriptions (
  user_id uuid primary key,
  plan_id text not null default 'buyer-free',
  status text not null default 'active',
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buyer_plan_subscriptions_status_check
    check (status in ('active', 'trialing', 'past_due', 'cancelled', 'expired', 'paused'))
);

create index if not exists buyer_plan_subscriptions_status_idx
  on public.buyer_plan_subscriptions (status);

create index if not exists buyer_plan_subscriptions_period_end_idx
  on public.buyer_plan_subscriptions (current_period_end);

alter table public.buyer_plan_subscriptions enable row level security;

grant select on public.buyer_plan_subscriptions to authenticated;
grant all on public.buyer_plan_subscriptions to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'buyer_plan_subscriptions'
      and policyname = 'Buyers can read their own plan subscription'
  ) then
    create policy "Buyers can read their own plan subscription"
      on public.buyer_plan_subscriptions
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $$;
