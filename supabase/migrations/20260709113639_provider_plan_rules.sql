create table if not exists public.admin_settings (
  key text primary key,
  value text not null default '',
  group_title text,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings
  add column if not exists group_title text,
  add column if not exists updated_by uuid,
  add column if not exists updated_at timestamptz not null default now();

alter table public.admin_settings enable row level security;
grant all on public.admin_settings to service_role;

create table if not exists public.provider_plan_subscriptions (
  user_id uuid primary key,
  plan_id text not null default 'free',
  status text not null default 'active',
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_plan_subscriptions_status_check
    check (status in ('active', 'trialing', 'past_due', 'cancelled', 'expired', 'paused'))
);

create index if not exists provider_plan_subscriptions_status_idx
  on public.provider_plan_subscriptions (status);

create index if not exists provider_plan_subscriptions_period_end_idx
  on public.provider_plan_subscriptions (current_period_end);

alter table public.provider_plan_subscriptions enable row level security;

grant select on public.provider_plan_subscriptions to authenticated;
grant all on public.provider_plan_subscriptions to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'provider_plan_subscriptions'
      and policyname = 'Providers can read their own plan subscription'
  ) then
    create policy "Providers can read their own plan subscription"
      on public.provider_plan_subscriptions
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $$;

insert into public.admin_settings (key, value, group_title, updated_at)
values (
  'pricing_provider_plan_rules',
  $json$
{
  "version": 1,
  "usageWindowDays": 30,
  "jobQuoteAcceptanceExpiryDays": 7,
  "paymentTerms": "Provider plans control how many jobs and shifts a provider can apply to during each rolling billing window. The free plan is given to every provider by default. Paid plans renew monthly until cancelled, and successful subscription payments unlock the listed application allowance and benefits for that period.",
  "plans": [
    {
      "id": "free",
      "name": "Free",
      "description": "Default provider access for testing the marketplace.",
      "priceMonthly": 0,
      "currency": "EUR",
      "discountPercent": 0,
      "applicationLimit": 5,
      "perks": [
        "Apply to 5 jobs or shifts every 30 days",
        "Standard live job board access",
        "Basic provider profile listing",
        "Email notifications for matching jobs"
      ],
      "cta": "Current default"
    },
    {
      "id": "growth",
      "name": "Growth",
      "description": "For providers who want steady lead access.",
      "priceMonthly": 9,
      "currency": "EUR",
      "discountPercent": 0,
      "applicationLimit": 25,
      "perks": [
        "Apply to 25 jobs or shifts every 30 days",
        "Priority email alerts for matching work",
        "Growth plan badge on provider profile",
        "Saved search and niche visibility perks"
      ],
      "featured": true,
      "cta": "Upgrade to Growth"
    },
    {
      "id": "pro",
      "name": "Pro",
      "description": "For high-volume providers and agencies.",
      "priceMonthly": 29,
      "currency": "EUR",
      "discountPercent": 0,
      "applicationLimit": -1,
      "perks": [
        "Unlimited job and shift applications",
        "Early access to high-value shift posts",
        "Profile boost in matching and marketplace results",
        "Priority support and application analytics"
      ],
      "cta": "Upgrade to Pro"
    }
  ],
  "businessPlans": [
    {
      "id": "business-free",
      "name": "Business Free",
      "description": "For occasional hiring after business approval.",
      "priceMonthly": 0,
      "currency": "EUR",
      "discountPercent": 0,
      "jobPostLimit": 2,
      "workerShortlistLimit": 5,
      "perks": [
        "Post 2 business jobs every 30 days",
        "Browse approved providers and shift workers",
        "Basic applicant management",
        "Standard email support"
      ],
      "cta": "Register business",
      "href": "/register-business"
    },
    {
      "id": "business-growth",
      "name": "Business Growth",
      "description": "For teams hiring regular day-wage or shift workers.",
      "priceMonthly": 19,
      "currency": "EUR",
      "discountPercent": 0,
      "jobPostLimit": 15,
      "workerShortlistLimit": 50,
      "perks": [
        "Post 15 business jobs every 30 days",
        "Shortlist up to 50 workers",
        "Priority alerts to matching workers",
        "Business trust badge after approval"
      ],
      "featured": true,
      "cta": "Choose Growth",
      "href": "/register-business?plan=business-growth"
    },
    {
      "id": "business-pro",
      "name": "Business Pro",
      "description": "For high-volume businesses managing recurring workforce needs.",
      "priceMonthly": 49,
      "currency": "EUR",
      "discountPercent": 0,
      "jobPostLimit": -1,
      "workerShortlistLimit": -1,
      "perks": [
        "Unlimited business job posts",
        "Unlimited worker shortlists",
        "Priority shift-worker matching",
        "Dedicated support for urgent staffing needs"
      ],
      "cta": "Choose Pro",
      "href": "/register-business?plan=business-pro"
    }
  ]
}
$json$,
  'Pricing plans',
  now()
)
on conflict (key) do nothing;
