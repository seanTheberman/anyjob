import type { Metadata } from "next";
import { CheckCircle, Star } from "lucide-react";

import { BuyerPlanCheckoutButton } from "./BuyerPlanCheckoutButton";
import { ProviderPlanCheckoutButton } from "./ProviderPlanCheckoutButton";
import {
  applicationLimitLabel,
  buyerLimitLabel,
  businessLimitLabel,
  formatDiscountedPlanPrice,
  formatPlanPrice,
  hasPlanDiscount,
  type BuyerPlanConfig,
  type BusinessPlanConfig,
  type ProviderPlanConfig,
} from "@/lib/plans/provider-plan-config";
import { getProviderPlanRules } from "@/lib/plans/provider-plan-server";

export const metadata: Metadata = {
  title: "Pricing - AnyJob",
  description: "Plans for AnyJob providers and businesses.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const rules = await getProviderPlanRules();

  return (
    <main className="bg-slate-50 pt-20">
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-wide text-red-600">Marketplace pricing</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Plans for buyers, providers, and businesses
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Buyers can unlock more service requests. Providers can unlock more applications. Businesses can choose hiring plans for day-wage, freelance, and shift work.
          </p>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 max-w-6xl">
          <h2 className="text-2xl font-black text-slate-950">Buyer plans</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            For customers posting service requests, comparing quotes, and managing recurring jobs.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          {rules.buyerPlans.map((plan) => (
            <BuyerPlanCard key={plan.id} plan={plan} usageWindowDays={rules.usageWindowDays} />
          ))}
        </div>

        <div className="mx-auto mb-6 max-w-6xl">
          <div className="mt-12" />
          <h2 className="text-2xl font-black text-slate-950">Provider plans</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            For freelancers, shift workers, contractors, and agencies applying to jobs on AnyJob.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          {rules.plans.map((plan) => (
            <ProviderPlanCard key={plan.id} plan={plan} usageWindowDays={rules.usageWindowDays} />
          ))}
        </div>

        <div className="mx-auto mb-6 mt-12 max-w-6xl">
          <h2 className="text-2xl font-black text-slate-950">Business hiring plans</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            For approved businesses that post freelance jobs, day-wage work, or longer shift work.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          {rules.businessPlans.map((plan) => (
            <BusinessPlanCard key={plan.id} plan={plan} usageWindowDays={rules.usageWindowDays} />
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-950">Payment terms</h2>
          <p className="mt-2">{rules.paymentTerms}</p>
          <p className="mt-3 font-semibold text-slate-700">
            Jobs expire after {rules.jobQuoteAcceptanceExpiryDays} days if the poster does not accept a quote.
          </p>
        </div>
      </section>
    </main>
  );
}

function PlanBadge({ plan }: { plan: ProviderPlanConfig | BusinessPlanConfig | BuyerPlanConfig }) {
  if (hasPlanDiscount(plan)) {
    return (
      <div className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        {plan.discountLabel || `${plan.discountPercent}% off`}
      </div>
    );
  }

  if (plan.featured) {
    return (
      <div className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
        <Star className="h-3.5 w-3.5 fill-red-600" />
        Popular
      </div>
    );
  }

  return null;
}

function PriceBlock({ plan }: { plan: ProviderPlanConfig | BusinessPlanConfig | BuyerPlanConfig }) {
  const hasDiscount = hasPlanDiscount(plan);
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end gap-2">
        {hasDiscount ? (
          <span className="text-base font-bold text-slate-400 line-through">{formatPlanPrice(plan)}</span>
        ) : null}
        <span className="text-4xl font-black text-slate-950">
          {hasDiscount ? formatDiscountedPlanPrice(plan) : formatPlanPrice(plan)}
        </span>
        {plan.priceMonthly > 0 ? <span className="pb-1 text-sm font-semibold text-slate-500">/ month</span> : null}
      </div>
      {hasDiscount ? (
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
          {plan.discountPercent}% discount applied
        </p>
      ) : null}
    </div>
  );
}

function BuyerPlanCard({ plan, usageWindowDays }: { plan: BuyerPlanConfig; usageWindowDays: number }) {
  return (
    <article
      className={[
        "relative rounded-2xl border bg-white p-6 shadow-sm",
        plan.featured || hasPlanDiscount(plan) ? "border-red-200 shadow-red-100" : "border-slate-200",
      ].join(" ")}
    >
      <PlanBadge plan={plan} />
      <h3 className="pr-24 text-xl font-extrabold text-slate-950">{plan.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>
      <PriceBlock plan={plan} />
      <p className="mt-2 text-sm font-bold text-slate-700">
        {buyerLimitLabel(plan, usageWindowDays)}
      </p>
      <div className="mt-6">
        <BuyerPlanCheckoutButton
          planId={plan.id}
          label={plan.cta || (plan.priceMonthly > 0 ? "Upgrade buyer plan" : "Start free")}
          isFree={plan.priceMonthly <= 0}
          featured={plan.featured || hasPlanDiscount(plan)}
        />
      </div>
      <PlanPerks perks={plan.perks} />
    </article>
  );
}

function ProviderPlanCard({ plan, usageWindowDays }: { plan: ProviderPlanConfig; usageWindowDays: number }) {
  return (
    <article
      className={[
        "relative rounded-2xl border bg-white p-6 shadow-sm",
        plan.featured || hasPlanDiscount(plan) ? "border-red-200 shadow-red-100" : "border-slate-200",
      ].join(" ")}
    >
      <PlanBadge plan={plan} />
      <h3 className="pr-24 text-xl font-extrabold text-slate-950">{plan.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>
      <PriceBlock plan={plan} />
      <p className="mt-2 text-sm font-bold text-slate-700">
        {applicationLimitLabel(plan, usageWindowDays)}
      </p>
      <div className="mt-6">
        <ProviderPlanCheckoutButton
          planId={plan.id}
          label={plan.cta || (plan.priceMonthly > 0 ? "Upgrade plan" : "Start free")}
          isFree={plan.priceMonthly <= 0}
          featured={plan.featured || hasPlanDiscount(plan)}
        />
      </div>
      <PlanPerks perks={plan.perks} />
    </article>
  );
}

function BusinessPlanCard({ plan, usageWindowDays }: { plan: BusinessPlanConfig; usageWindowDays: number }) {
  return (
    <article
      className={[
        "relative rounded-2xl border bg-white p-6 shadow-sm",
        plan.featured || hasPlanDiscount(plan) ? "border-red-200 shadow-red-100" : "border-slate-200",
      ].join(" ")}
    >
      <PlanBadge plan={plan} />
      <h3 className="pr-24 text-xl font-extrabold text-slate-950">{plan.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>
      <PriceBlock plan={plan} />
      <p className="mt-2 text-sm font-bold text-slate-700">
        {businessLimitLabel(plan, usageWindowDays)}
      </p>
      <div className="mt-6">
        <a
          href={plan.href || "/register-business"}
          className={[
            "inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold transition",
            plan.featured || hasPlanDiscount(plan)
              ? "bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700"
              : "bg-slate-950 text-white hover:bg-slate-800",
          ].join(" ")}
        >
          {plan.cta || "Choose plan"}
        </a>
      </div>
      <PlanPerks perks={plan.perks} />
    </article>
  );
}

function PlanPerks({ perks }: { perks: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {perks.map((perk) => (
        <li key={perk} className="flex gap-2.5 text-sm leading-6 text-slate-700">
          <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
          <span>{perk}</span>
        </li>
      ))}
    </ul>
  );
}
