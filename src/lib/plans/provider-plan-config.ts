export const PROVIDER_PLAN_RULES_SETTING_KEY = "pricing_provider_plan_rules";

export type ProviderPlanConfig = {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  currency: string;
  discountPercent?: number;
  discountLabel?: string;
  stripeCouponId?: string;
  applicationLimit: number;
  stripePriceId?: string;
  perks: string[];
  featured?: boolean;
  cta?: string;
};

export type BusinessPlanConfig = {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  currency: string;
  discountPercent?: number;
  discountLabel?: string;
  stripePriceId?: string;
  stripeCouponId?: string;
  jobPostLimit: number;
  workerShortlistLimit: number;
  perks: string[];
  featured?: boolean;
  cta?: string;
  href?: string;
};

export type BuyerPlanConfig = {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  currency: string;
  discountPercent?: number;
  discountLabel?: string;
  stripePriceId?: string;
  stripeCouponId?: string;
  requestLimit: number;
  prioritySupport?: boolean;
  perks: string[];
  featured?: boolean;
  cta?: string;
};

export type ProviderPlanRules = {
  version: 1;
  usageWindowDays: number;
  jobQuoteAcceptanceExpiryDays: number;
  paymentTerms: string;
  plans: ProviderPlanConfig[];
  businessPlans: BusinessPlanConfig[];
  buyerPlans: BuyerPlanConfig[];
};

export const DEFAULT_PROVIDER_PLAN_RULES: ProviderPlanRules = {
  version: 1,
  usageWindowDays: 30,
  jobQuoteAcceptanceExpiryDays: 7,
  paymentTerms:
    "Provider, buyer, and business plans control marketplace allowances during each rolling billing window. Free plans are given by default. Paid plans renew monthly until cancelled, and successful subscription payments unlock the listed usage limits and benefits for that period.",
  plans: [
    {
      id: "free",
      name: "Free",
      description: "Default provider access for testing the marketplace.",
      priceMonthly: 0,
      currency: "EUR",
      discountPercent: 0,
      applicationLimit: 5,
      perks: [
        "Apply to 5 jobs or shifts every 30 days",
        "Standard live job board access",
        "Basic provider profile listing",
        "Email notifications for matching jobs",
      ],
      cta: "Current default",
    },
    {
      id: "growth",
      name: "Growth",
      description: "For providers who want steady lead access.",
      priceMonthly: 9,
      currency: "EUR",
      discountPercent: 0,
      applicationLimit: 25,
      perks: [
        "Apply to 25 jobs or shifts every 30 days",
        "Priority email alerts for matching work",
        "Growth plan badge on provider profile",
        "Saved search and niche visibility perks",
      ],
      featured: true,
      cta: "Upgrade to Growth",
    },
    {
      id: "pro",
      name: "Pro",
      description: "For high-volume providers and agencies.",
      priceMonthly: 29,
      currency: "EUR",
      discountPercent: 0,
      applicationLimit: -1,
      perks: [
        "Unlimited job and shift applications",
        "Early access to high-value shift posts",
        "Profile boost in matching and marketplace results",
        "Priority support and application analytics",
      ],
      cta: "Upgrade to Pro",
    },
  ],
  businessPlans: [
    {
      id: "business-free",
      name: "Business Free",
      description: "For occasional hiring after business approval.",
      priceMonthly: 0,
      currency: "EUR",
      discountPercent: 0,
      jobPostLimit: 2,
      workerShortlistLimit: 5,
      perks: [
        "Post 2 business jobs every 30 days",
        "Browse approved providers and shift workers",
        "Basic applicant management",
        "Standard email support",
      ],
      cta: "Register business",
      href: "/register-business",
    },
    {
      id: "business-growth",
      name: "Business Growth",
      description: "For teams hiring regular day-wage or shift workers.",
      priceMonthly: 19,
      currency: "EUR",
      discountPercent: 0,
      jobPostLimit: 15,
      workerShortlistLimit: 50,
      perks: [
        "Post 15 business jobs every 30 days",
        "Shortlist up to 50 workers",
        "Priority alerts to matching workers",
        "Business trust badge after approval",
      ],
      featured: true,
      cta: "Choose Growth",
      href: "/register-business?plan=business-growth",
    },
    {
      id: "business-pro",
      name: "Business Pro",
      description: "For high-volume businesses managing recurring workforce needs.",
      priceMonthly: 49,
      currency: "EUR",
      discountPercent: 0,
      jobPostLimit: -1,
      workerShortlistLimit: -1,
      perks: [
        "Unlimited business job posts",
        "Unlimited worker shortlists",
        "Priority shift-worker matching",
        "Dedicated support for urgent staffing needs",
      ],
      cta: "Choose Pro",
      href: "/register-business?plan=business-pro",
    },
  ],
  buyerPlans: [
    {
      id: "buyer-free",
      name: "Buyer Free",
      description: "Default access for homeowners and customers testing AnyJob.",
      priceMonthly: 0,
      currency: "EUR",
      discountPercent: 0,
      requestLimit: 3,
      perks: [
        "Post 3 service requests every 30 days",
        "Receive provider quotes after buyer KYC",
        "Standard quote comparison",
        "Email updates for job and KYC status",
      ],
      cta: "Current default",
    },
    {
      id: "buyer-plus",
      name: "Buyer Plus",
      description: "For customers who book recurring home services.",
      priceMonthly: 6,
      currency: "EUR",
      discountPercent: 0,
      requestLimit: 12,
      prioritySupport: true,
      perks: [
        "Post 12 service requests every 30 days",
        "Priority quote reminders to matched providers",
        "Saved addresses and repeat-booking support",
        "Priority support for active jobs",
      ],
      featured: true,
      cta: "Upgrade to Plus",
    },
    {
      id: "buyer-premium",
      name: "Buyer Premium",
      description: "For landlords and frequent buyers managing multiple jobs.",
      priceMonthly: 15,
      currency: "EUR",
      discountPercent: 0,
      requestLimit: -1,
      prioritySupport: true,
      perks: [
        "Unlimited service requests",
        "Priority provider matching for urgent jobs",
        "Multi-property booking support",
        "Premium support for disputes and scheduling",
      ],
      cta: "Upgrade to Premium",
    },
  ],
};

function toPositiveInteger(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : fallback;
}

function normalizePlan(plan: Partial<ProviderPlanConfig>, fallback: ProviderPlanConfig): ProviderPlanConfig {
  const priceMonthly = Number(plan.priceMonthly);
  const applicationLimit = Number(plan.applicationLimit);
  const discountPercent = Number(plan.discountPercent);
  const normalizedPrice = Number.isFinite(priceMonthly) && priceMonthly >= 0 ? priceMonthly : fallback.priceMonthly;
  const normalizedDiscount = Number.isFinite(discountPercent)
    ? Math.min(Math.max(Math.round(discountPercent), 0), 100)
    : fallback.discountPercent || 0;

  return {
    id: String(plan.id || fallback.id).trim() || fallback.id,
    name: String(plan.name || fallback.name).trim() || fallback.name,
    description: String(plan.description || fallback.description).trim() || fallback.description,
    priceMonthly: normalizedPrice,
    currency: String(plan.currency || fallback.currency || "EUR").trim().toUpperCase() || "EUR",
    discountPercent: normalizedPrice > 0 ? normalizedDiscount : 0,
    discountLabel: normalizedPrice > 0 ? String(plan.discountLabel || "").trim() || fallback.discountLabel || undefined : undefined,
    stripeCouponId: normalizedPrice > 0 ? String(plan.stripeCouponId || "").trim() || undefined : undefined,
    applicationLimit: Number.isFinite(applicationLimit) ? Math.round(applicationLimit) : fallback.applicationLimit,
    stripePriceId: String(plan.stripePriceId || "").trim() || undefined,
    perks: Array.isArray(plan.perks)
      ? plan.perks.map((perk) => String(perk).trim()).filter(Boolean)
      : fallback.perks,
    featured: Boolean(plan.featured),
    cta: String(plan.cta || fallback.cta || "").trim() || fallback.cta,
  };
}

function normalizeBusinessPlan(plan: Partial<BusinessPlanConfig>, fallback: BusinessPlanConfig): BusinessPlanConfig {
  const priceMonthly = Number(plan.priceMonthly);
  const jobPostLimit = Number(plan.jobPostLimit);
  const workerShortlistLimit = Number(plan.workerShortlistLimit);
  const discountPercent = Number(plan.discountPercent);
  const normalizedPrice = Number.isFinite(priceMonthly) && priceMonthly >= 0 ? priceMonthly : fallback.priceMonthly;
  const normalizedDiscount = Number.isFinite(discountPercent)
    ? Math.min(Math.max(Math.round(discountPercent), 0), 100)
    : fallback.discountPercent || 0;

  return {
    id: String(plan.id || fallback.id).trim() || fallback.id,
    name: String(plan.name || fallback.name).trim() || fallback.name,
    description: String(plan.description || fallback.description).trim() || fallback.description,
    priceMonthly: normalizedPrice,
    currency: String(plan.currency || fallback.currency || "EUR").trim().toUpperCase() || "EUR",
    discountPercent: normalizedPrice > 0 ? normalizedDiscount : 0,
    discountLabel: normalizedPrice > 0 ? String(plan.discountLabel || "").trim() || fallback.discountLabel || undefined : undefined,
    stripePriceId: String(plan.stripePriceId || "").trim() || undefined,
    stripeCouponId: normalizedPrice > 0 ? String(plan.stripeCouponId || "").trim() || undefined : undefined,
    jobPostLimit: Number.isFinite(jobPostLimit) ? Math.round(jobPostLimit) : fallback.jobPostLimit,
    workerShortlistLimit: Number.isFinite(workerShortlistLimit)
      ? Math.round(workerShortlistLimit)
      : fallback.workerShortlistLimit,
    perks: Array.isArray(plan.perks)
      ? plan.perks.map((perk) => String(perk).trim()).filter(Boolean)
      : fallback.perks,
    featured: Boolean(plan.featured),
    cta: String(plan.cta || fallback.cta || "").trim() || fallback.cta,
    href: String(plan.href || fallback.href || "/register-business").trim() || "/register-business",
  };
}

function normalizeBuyerPlan(plan: Partial<BuyerPlanConfig>, fallback: BuyerPlanConfig): BuyerPlanConfig {
  const priceMonthly = Number(plan.priceMonthly);
  const requestLimit = Number(plan.requestLimit);
  const discountPercent = Number(plan.discountPercent);
  const normalizedPrice = Number.isFinite(priceMonthly) && priceMonthly >= 0 ? priceMonthly : fallback.priceMonthly;
  const normalizedDiscount = Number.isFinite(discountPercent)
    ? Math.min(Math.max(Math.round(discountPercent), 0), 100)
    : fallback.discountPercent || 0;

  return {
    id: String(plan.id || fallback.id).trim() || fallback.id,
    name: String(plan.name || fallback.name).trim() || fallback.name,
    description: String(plan.description || fallback.description).trim() || fallback.description,
    priceMonthly: normalizedPrice,
    currency: String(plan.currency || fallback.currency || "EUR").trim().toUpperCase() || "EUR",
    discountPercent: normalizedPrice > 0 ? normalizedDiscount : 0,
    discountLabel: normalizedPrice > 0 ? String(plan.discountLabel || "").trim() || fallback.discountLabel || undefined : undefined,
    stripePriceId: String(plan.stripePriceId || "").trim() || undefined,
    stripeCouponId: normalizedPrice > 0 ? String(plan.stripeCouponId || "").trim() || undefined : undefined,
    requestLimit: Number.isFinite(requestLimit) ? Math.round(requestLimit) : fallback.requestLimit,
    prioritySupport: Boolean(plan.prioritySupport),
    perks: Array.isArray(plan.perks)
      ? plan.perks.map((perk) => String(perk).trim()).filter(Boolean)
      : fallback.perks,
    featured: Boolean(plan.featured),
    cta: String(plan.cta || fallback.cta || "").trim() || fallback.cta,
  };
}

export function normalizeProviderPlanRules(input: Partial<ProviderPlanRules> | null | undefined): ProviderPlanRules {
  const defaults = DEFAULT_PROVIDER_PLAN_RULES;
  const incomingPlans = Array.isArray(input?.plans) ? input?.plans || [] : [];
  const plans = defaults.plans.map((fallback, index) => normalizePlan(incomingPlans[index] || {}, fallback));
  const incomingBusinessPlans = Array.isArray(input?.businessPlans) ? input?.businessPlans || [] : [];
  const businessPlans = defaults.businessPlans.map((fallback, index) =>
    normalizeBusinessPlan(incomingBusinessPlans[index] || {}, fallback)
  );
  const incomingBuyerPlans = Array.isArray(input?.buyerPlans) ? input?.buyerPlans || [] : [];
  const buyerPlans = defaults.buyerPlans.map((fallback, index) => normalizeBuyerPlan(incomingBuyerPlans[index] || {}, fallback));

  return {
    version: 1,
    usageWindowDays: toPositiveInteger(input?.usageWindowDays, defaults.usageWindowDays),
    jobQuoteAcceptanceExpiryDays: toPositiveInteger(
      input?.jobQuoteAcceptanceExpiryDays,
      defaults.jobQuoteAcceptanceExpiryDays
    ),
    paymentTerms: String(input?.paymentTerms || defaults.paymentTerms).trim() || defaults.paymentTerms,
    plans,
    businessPlans,
    buyerPlans,
  };
}

export function parseProviderPlanRules(value?: string | null): ProviderPlanRules {
  if (!value) return DEFAULT_PROVIDER_PLAN_RULES;

  try {
    const parsed = JSON.parse(value) as Partial<ProviderPlanRules>;
    return normalizeProviderPlanRules(parsed);
  } catch {
    return DEFAULT_PROVIDER_PLAN_RULES;
  }
}

export function formatPlanPrice(plan: Pick<ProviderPlanConfig, "priceMonthly" | "currency">) {
  if (plan.priceMonthly <= 0) return "Free";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: plan.currency || "EUR",
    maximumFractionDigits: plan.priceMonthly % 1 === 0 ? 0 : 2,
  }).format(plan.priceMonthly);
}

export function discountedMonthlyPrice(plan: Pick<ProviderPlanConfig, "priceMonthly" | "discountPercent">) {
  const discount = Math.min(Math.max(Number(plan.discountPercent || 0), 0), 100);
  if (plan.priceMonthly <= 0 || discount <= 0) return plan.priceMonthly;
  return Math.max(plan.priceMonthly * (1 - discount / 100), 0);
}

export function hasPlanDiscount(plan: Pick<ProviderPlanConfig, "priceMonthly" | "discountPercent">) {
  return plan.priceMonthly > 0 && Number(plan.discountPercent || 0) > 0;
}

export function formatDiscountedPlanPrice(plan: ProviderPlanConfig | BusinessPlanConfig | BuyerPlanConfig) {
  if (plan.priceMonthly <= 0) return "Free";
  const price = discountedMonthlyPrice(plan);
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: plan.currency || "EUR",
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

export function applicationLimitLabel(plan: ProviderPlanConfig, usageWindowDays: number) {
  if (plan.applicationLimit < 0) return "Unlimited applications";
  return `${plan.applicationLimit} applications every ${usageWindowDays} days`;
}

export function businessLimitLabel(plan: BusinessPlanConfig, usageWindowDays: number) {
  const posts = plan.jobPostLimit < 0 ? "Unlimited job posts" : `${plan.jobPostLimit} job posts`;
  const shortlists = plan.workerShortlistLimit < 0 ? "unlimited worker shortlists" : `${plan.workerShortlistLimit} worker shortlists`;
  return `${posts} and ${shortlists} every ${usageWindowDays} days`;
}

export function buyerLimitLabel(plan: BuyerPlanConfig, usageWindowDays: number) {
  if (plan.requestLimit < 0) return "Unlimited service requests";
  return `${plan.requestLimit} service requests every ${usageWindowDays} days`;
}
