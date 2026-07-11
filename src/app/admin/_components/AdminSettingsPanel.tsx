"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CreditCard, FileText, ListChecks, Plus, Save, Trash2, type LucideIcon } from "lucide-react";

import { settingsGroups } from "./admin-data";
import {
  POLICY_DOCUMENTS,
  policySettingKey,
  type CmsPolicyDocument,
} from "@/lib/cms/policy-definitions";
import {
  DEFAULT_PLATFORM_WARNING_MESSAGES,
  INSURANCE_NOTICE_SETTING_KEYS,
  PLATFORM_WARNING_MESSAGES_KEY,
  PROVIDER_INSURANCE_WARNING_ID,
  parsePlatformWarningMessages,
  type PlatformWarningMessage,
  type PlatformWarningSeverity,
  type PlatformWarningSurface,
} from "@/lib/safety/insurance-notice-copy";
import {
  PROVIDER_PLAN_RULES_SETTING_KEY,
  applicationLimitLabel,
  buyerLimitLabel,
  businessLimitLabel,
  formatDiscountedPlanPrice,
  formatPlanPrice,
  hasPlanDiscount,
  normalizeProviderPlanRules,
  parseProviderPlanRules,
  type BuyerPlanConfig,
  type BusinessPlanConfig,
  type ProviderPlanConfig,
} from "@/lib/plans/provider-plan-config";

type SavedSetting = {
  key: string;
  value: string;
};

const warningSurfaceOptions: Array<{ value: PlatformWarningSurface; label: string }> = [
  { value: "provider_workspace", label: "Provider workspace" },
  { value: "buyer_dashboard", label: "Buyer dashboard" },
  { value: "public_marketplace", label: "Public marketplace" },
];

const warningSeverityOptions: Array<{ value: PlatformWarningSeverity; label: string }> = [
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
];

type SettingsSectionId = "rules" | "pricing" | "policies" | "warnings";

const settingsSections = [
  {
    id: "rules",
    label: "Rules",
    description: "Marketplace, trust, safety, and notification rules.",
    icon: ListChecks,
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "Buyer, provider, and business plans, limits, and Stripe IDs.",
    icon: CreditCard,
  },
  {
    id: "policies",
    label: "Policies",
    description: "Privacy, terms, refund, and public policy copy.",
    icon: FileText,
  },
  {
    id: "warnings",
    label: "Warnings",
    description: "User-facing notices by audience and severity.",
    icon: Bell,
  },
] satisfies Array<{
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}>;

function normalizeSettingsSection(value: string | null): SettingsSectionId {
  return settingsSections.some((section) => section.id === value) ? (value as SettingsSectionId) : "rules";
}

function savedOrDefault(saved: Map<string, string>, key: string, defaultValue: string) {
  const value = saved.get(key);
  if (!value || value === "Default policy") return defaultValue;
  return value;
}

function createWarningId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || `warning_${Date.now()}`;
}

function initialWarningMessages(saved: Map<string, string>): PlatformWarningMessage[] {
  const savedWarnings = saved.get(PLATFORM_WARNING_MESSAGES_KEY);
  if (savedWarnings) return parsePlatformWarningMessages(savedWarnings);

  return DEFAULT_PLATFORM_WARNING_MESSAGES.map((warning) => {
    if (warning.id !== PROVIDER_INSURANCE_WARNING_ID) return warning;

    return {
      ...warning,
      enabled: savedOrDefault(saved, INSURANCE_NOTICE_SETTING_KEYS.enabled, String(warning.enabled)) !== "false",
      title: savedOrDefault(saved, INSURANCE_NOTICE_SETTING_KEYS.title, warning.title),
      message: savedOrDefault(saved, INSURANCE_NOTICE_SETTING_KEYS.message, warning.message),
    };
  });
}

function initialPolicyValues(saved: Map<string, string>) {
  const initial: Record<string, string> = {};
  for (const document of POLICY_DOCUMENTS) {
    for (const block of document.blocks) {
      const key = policySettingKey(document.slug, block.key);
      initial[key] = savedOrDefault(saved, key, block.body);
    }
  }
  return initial;
}

export function AdminSettingsPanel({ savedSettings }: { savedSettings: SavedSetting[] }) {
  const saved = useMemo(() => new Map(savedSettings.map((setting) => [setting.key, setting.value])), [savedSettings]);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const group of settingsGroups) {
      for (const item of group.items) {
        initial[item.key] = savedOrDefault(saved, item.key, item.defaultValue);
      }
    }
    return initial;
  });
  const [policyValues, setPolicyValues] = useState<Record<string, string>>(() => initialPolicyValues(saved));
  const [warningMessages, setWarningMessages] = useState<PlatformWarningMessage[]>(() => initialWarningMessages(saved));
  const [planRules, setPlanRules] = useState(() => parseProviderPlanRules(saved.get(PROVIDER_PLAN_RULES_SETTING_KEY)));
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("rules");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const activeSectionMeta = settingsSections.find((section) => section.id === activeSection) || settingsSections[0];

  useEffect(() => {
    function syncSectionFromUrl() {
      setActiveSection(normalizeSettingsSection(new URLSearchParams(window.location.search).get("section")));
    }

    syncSectionFromUrl();
    window.addEventListener("popstate", syncSectionFromUrl);
    return () => window.removeEventListener("popstate", syncSectionFromUrl);
  }, []);

  function selectSection(section: SettingsSectionId) {
    setActiveSection(section);
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("section", section);
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  }

  function updatePlanRules(changes: Partial<typeof planRules>) {
    setPlanRules((current) => ({ ...current, ...changes }));
  }

  function updatePlan(index: number, changes: Partial<ProviderPlanConfig>) {
    setPlanRules((current) => ({
      ...current,
      plans: current.plans.map((plan, currentIndex) => (
        currentIndex === index ? { ...plan, ...changes } : plan
      )),
    }));
  }

  function updatePlanPerks(index: number, value: string) {
    updatePlan(index, {
      perks: value
        .split("\n")
        .map((perk) => perk.trim())
        .filter(Boolean),
    });
  }

  function updateBusinessPlan(index: number, changes: Partial<BusinessPlanConfig>) {
    setPlanRules((current) => ({
      ...current,
      businessPlans: current.businessPlans.map((plan, currentIndex) => (
        currentIndex === index ? { ...plan, ...changes } : plan
      )),
    }));
  }

  function updateBusinessPlanPerks(index: number, value: string) {
    updateBusinessPlan(index, {
      perks: value
        .split("\n")
        .map((perk) => perk.trim())
        .filter(Boolean),
    });
  }

  function updateBuyerPlan(index: number, changes: Partial<BuyerPlanConfig>) {
    setPlanRules((current) => ({
      ...current,
      buyerPlans: current.buyerPlans.map((plan, currentIndex) => (
        currentIndex === index ? { ...plan, ...changes } : plan
      )),
    }));
  }

  function updateBuyerPlanPerks(index: number, value: string) {
    updateBuyerPlan(index, {
      perks: value
        .split("\n")
        .map((perk) => perk.trim())
        .filter(Boolean),
    });
  }

  function updateWarning(index: number, changes: Partial<PlatformWarningMessage>) {
    setWarningMessages((current) => current.map((warning, currentIndex) => (
      currentIndex === index ? { ...warning, ...changes } : warning
    )));
  }

  function addWarning() {
    setWarningMessages((current) => [
      ...current,
      {
        id: `custom_warning_${Date.now()}`,
        enabled: true,
        surface: "provider_workspace",
        severity: "warning",
        title: "New warning",
        message: "Write the warning message that should be shown to users.",
      },
    ]);
  }

  function removeWarning(index: number) {
    setWarningMessages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function saveSettings() {
    setPending(true);
    setMessage(null);
    const settings = settingsGroups.flatMap((group) => group.items.map((item) => {
      return { key: item.key, value: values[item.key] || "", groupTitle: group.title };
    }));
    const policySettings = POLICY_DOCUMENTS.flatMap((document) => document.blocks.map((block) => {
      const key = policySettingKey(document.slug, block.key);
      return { key, value: policyValues[key] || "", groupTitle: `Policies: ${document.title}` };
    }));
    settings.push({
      key: PROVIDER_PLAN_RULES_SETTING_KEY,
      value: JSON.stringify(normalizeProviderPlanRules(planRules)),
      groupTitle: "Pricing plans",
    });
    settings.push(...policySettings);
    const insuranceWarning = warningMessages.find((warning) => warning.id === PROVIDER_INSURANCE_WARNING_ID);
    settings.push({
      key: PLATFORM_WARNING_MESSAGES_KEY,
      value: JSON.stringify(warningMessages),
      groupTitle: "Warnings and notices",
    });
    if (insuranceWarning) {
      settings.push(
        { key: INSURANCE_NOTICE_SETTING_KEYS.enabled, value: String(insuranceWarning.enabled), groupTitle: "Warnings and notices" },
        { key: INSURANCE_NOTICE_SETTING_KEYS.title, value: insuranceWarning.title, groupTitle: "Warnings and notices" },
        { key: INSURANCE_NOTICE_SETTING_KEYS.message, value: insuranceWarning.message, groupTitle: "Warnings and notices" }
      );
    }

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);
    setMessage(response.ok ? payload.message || "Settings saved." : payload.error || "Settings save failed.");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 px-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Settings section</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">{activeSectionMeta.label}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{activeSectionMeta.description}</p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={saveSettings}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {pending ? "Saving..." : "Save settings"}
          </button>
        </div>
        {message ? <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</div> : null}
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Settings sections">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const selected = section.id === activeSection;

            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => selectSection(section.id)}
                className={[
                  "flex min-h-20 items-start gap-3 rounded-lg border p-3 text-left transition",
                  selected
                    ? "border-red-200 bg-red-50 text-red-950 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                ].join(" ")}
              >
                <span className={selected ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white" : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{section.label}</span>
                  <span className={selected ? "mt-1 block text-xs leading-5 text-red-900/75" : "mt-1 block text-xs leading-5 text-slate-500"}>
                    {section.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {activeSection === "rules" ? (
      <div className="grid gap-5 xl:grid-cols-2" role="tabpanel" aria-label="Rules settings">
        {settingsGroups.map((group) => (
          <details key={group.title} open className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <summary className="cursor-pointer list-none px-5 py-4">
              <h2 className="inline text-lg font-semibold text-slate-950">{group.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{group.description}</p>
            </summary>
            <div className="space-y-4 border-t border-slate-100 px-5 py-5">
              {group.items.map((item) => {
                  const value = values[item.key] || "";
                  if (item.type === "toggle") {
                    const checked = value !== "false";
                    return (
                      <label key={item.key} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4">
                        <span>
                          <span className="block text-sm font-semibold text-slate-800">{item.label}</span>
                          {item.help ? <span className="mt-1 block text-xs leading-5 text-slate-500">{item.help}</span> : null}
                        </span>
                        <input
                          type="checkbox"
                          className="mt-1 h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-200"
                          checked={checked}
                          onChange={(event) => setValues((current) => ({ ...current, [item.key]: String(event.target.checked) }))}
                        />
                      </label>
                    );
                  }

                  return (
                    <label key={item.key} className="block">
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      {item.type === "textarea" ? (
                        <textarea
                          rows={item.rows || 3}
                          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                          value={value}
                          placeholder={item.placeholder}
                          onChange={(event) => setValues((current) => ({ ...current, [item.key]: event.target.value }))}
                        />
                      ) : (
                        <input
                          className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                          value={value}
                          placeholder={item.placeholder}
                          onChange={(event) => setValues((current) => ({ ...current, [item.key]: event.target.value }))}
                        />
                      )}
                      {item.help ? <span className="mt-1 block text-xs leading-5 text-slate-500">{item.help}</span> : null}
                    </label>
                  );
                })}
            </div>
          </details>
        ))}
      </div>
      ) : null}
      {activeSection === "pricing" ? (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Pricing plans and payment terms</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Edit buyer, provider, and business plan limits, paid-plan benefits, Stripe price IDs, and job expiry rules from one place.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Usage window days</span>
            <input
              type="number"
              min={1}
              className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              value={planRules.usageWindowDays}
              onChange={(event) => updatePlanRules({ usageWindowDays: Number(event.target.value) || 30 })}
            />
            <span className="mt-1 block text-xs leading-5 text-slate-500">Application limits reset over this rolling window.</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Job expiry days</span>
            <input
              type="number"
              min={1}
              className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              value={planRules.jobQuoteAcceptanceExpiryDays}
              onChange={(event) => updatePlanRules({ jobQuoteAcceptanceExpiryDays: Number(event.target.value) || 7 })}
            />
            <span className="mt-1 block text-xs leading-5 text-slate-500">Jobs expire if no quote is accepted in this timeframe.</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Currency</span>
            <input
              className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              value={planRules.plans[0]?.currency || "EUR"}
              onChange={(event) => {
                const currency = event.target.value.trim().toUpperCase() || "EUR";
                setPlanRules((current) => ({
                  ...current,
                  plans: current.plans.map((plan) => ({ ...plan, currency })),
                  businessPlans: current.businessPlans.map((plan) => ({ ...plan, currency })),
                  buyerPlans: current.buyerPlans.map((plan) => ({ ...plan, currency })),
                }));
              }}
            />
            <span className="mt-1 block text-xs leading-5 text-slate-500">Applied to provider and business plans.</span>
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">Payment terms shown to providers and businesses</span>
          <textarea
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            value={planRules.paymentTerms}
            onChange={(event) => updatePlanRules({ paymentTerms: event.target.value })}
          />
        </label>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="text-base font-bold text-slate-950">Provider application plans</h3>
          <p className="mt-1 text-sm text-slate-500">Controls provider quote and shift application allowances.</p>
        </div>

        <div className="mt-4 space-y-4">
          {planRules.plans.map((plan, index) => (
            <article key={plan.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-950">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {hasPlanDiscount(plan) ? `${formatDiscountedPlanPrice(plan)} discounted from ${formatPlanPrice(plan)}` : formatPlanPrice(plan)} / month · {applicationLimitLabel(plan, planRules.usageWindowDays)}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-200"
                    checked={Boolean(plan.featured)}
                    onChange={(event) => updatePlan(index, { featured: event.target.checked })}
                  />
                  Featured
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Plan name</span>
                  <input
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.name}
                    onChange={(event) => updatePlan(index, { name: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Monthly price</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.priceMonthly}
                    onChange={(event) => {
                      const priceMonthly = Number(event.target.value) || 0;
                      updatePlan(index, {
                        priceMonthly,
                        ...(priceMonthly <= 0 ? { discountPercent: 0, discountLabel: "", stripeCouponId: "" } : {}),
                      });
                    }}
                  />
                </label>
                {plan.priceMonthly > 0 ? (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Discount %</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={plan.discountPercent || 0}
                      onChange={(event) => updatePlan(index, { discountPercent: Number(event.target.value) || 0 })}
                    />
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Application limit</span>
                  <input
                    type="number"
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.applicationLimit}
                    onChange={(event) => updatePlan(index, { applicationLimit: Number(event.target.value) || 0 })}
                  />
                  <span className="mt-1 block text-xs leading-5 text-slate-500">Use -1 for unlimited applications.</span>
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Description</span>
                  <textarea
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.description}
                    onChange={(event) => updatePlan(index, { description: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Perks</span>
                  <textarea
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.perks.join("\n")}
                    onChange={(event) => updatePlanPerks(index, event.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                {plan.priceMonthly > 0 ? (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Discount label</span>
                    <input
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={plan.discountLabel || ""}
                      placeholder="Launch offer"
                      onChange={(event) => updatePlan(index, { discountLabel: event.target.value })}
                    />
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Stripe price ID</span>
                  <input
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.stripePriceId || ""}
                    placeholder="Optional. Use Stripe price_data when empty."
                    onChange={(event) => updatePlan(index, { stripePriceId: event.target.value })}
                  />
                </label>
                {plan.priceMonthly > 0 ? (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Stripe coupon ID</span>
                    <input
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={plan.stripeCouponId || ""}
                      placeholder="Optional if using a fixed Stripe price."
                      onChange={(event) => updatePlan(index, { stripeCouponId: event.target.value })}
                    />
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Button label</span>
                  <input
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.cta || ""}
                    onChange={(event) => updatePlan(index, { cta: event.target.value })}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="text-base font-bold text-slate-950">Buyer service request plans</h3>
          <p className="mt-1 text-sm text-slate-500">Plans shown to buyers who post service requests and compare quotes.</p>
        </div>

        <div className="mt-4 space-y-4">
          {planRules.buyerPlans.map((plan, index) => (
            <article key={plan.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-950">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {hasPlanDiscount(plan) ? `${formatDiscountedPlanPrice(plan)} discounted from ${formatPlanPrice(plan)}` : formatPlanPrice(plan)} / month · {buyerLimitLabel(plan, planRules.usageWindowDays)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-200"
                      checked={Boolean(plan.prioritySupport)}
                      onChange={(event) => updateBuyerPlan(index, { prioritySupport: event.target.checked })}
                    />
                    Priority support
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-200"
                      checked={Boolean(plan.featured)}
                      onChange={(event) => updateBuyerPlan(index, { featured: event.target.checked })}
                    />
                    Featured
                  </label>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Plan name</span>
                  <input
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.name}
                    onChange={(event) => updateBuyerPlan(index, { name: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Monthly price</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.priceMonthly}
                    onChange={(event) => {
                      const priceMonthly = Number(event.target.value) || 0;
                      updateBuyerPlan(index, {
                        priceMonthly,
                        ...(priceMonthly <= 0 ? { discountPercent: 0, discountLabel: "", stripeCouponId: "" } : {}),
                      });
                    }}
                  />
                </label>
                {plan.priceMonthly > 0 ? (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Discount %</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={plan.discountPercent || 0}
                      onChange={(event) => updateBuyerPlan(index, { discountPercent: Number(event.target.value) || 0 })}
                    />
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Request limit</span>
                  <input
                    type="number"
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.requestLimit}
                    onChange={(event) => updateBuyerPlan(index, { requestLimit: Number(event.target.value) || 0 })}
                  />
                  <span className="mt-1 block text-xs leading-5 text-slate-500">Use -1 for unlimited service requests.</span>
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Description</span>
                  <textarea
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.description}
                    onChange={(event) => updateBuyerPlan(index, { description: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Perks</span>
                  <textarea
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.perks.join("\n")}
                    onChange={(event) => updateBuyerPlanPerks(index, event.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                {plan.priceMonthly > 0 ? (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Discount label</span>
                    <input
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={plan.discountLabel || ""}
                      placeholder="Launch offer"
                      onChange={(event) => updateBuyerPlan(index, { discountLabel: event.target.value })}
                    />
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Stripe price ID</span>
                  <input
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.stripePriceId || ""}
                    placeholder="Optional. Use Stripe price_data when empty."
                    onChange={(event) => updateBuyerPlan(index, { stripePriceId: event.target.value })}
                  />
                </label>
                {plan.priceMonthly > 0 ? (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Stripe coupon ID</span>
                    <input
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={plan.stripeCouponId || ""}
                      placeholder="Optional if using a fixed Stripe price."
                      onChange={(event) => updateBuyerPlan(index, { stripeCouponId: event.target.value })}
                    />
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Button label</span>
                  <input
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.cta || ""}
                    onChange={(event) => updateBuyerPlan(index, { cta: event.target.value })}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="text-base font-bold text-slate-950">Business hiring plans</h3>
          <p className="mt-1 text-sm text-slate-500">Plans shown to businesses that hire providers or shift workers.</p>
        </div>

        <div className="mt-4 space-y-4">
          {planRules.businessPlans.map((plan, index) => (
            <article key={plan.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-950">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {hasPlanDiscount(plan) ? `${formatDiscountedPlanPrice(plan)} discounted from ${formatPlanPrice(plan)}` : formatPlanPrice(plan)} / month · {businessLimitLabel(plan, planRules.usageWindowDays)}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-200"
                    checked={Boolean(plan.featured)}
                    onChange={(event) => updateBusinessPlan(index, { featured: event.target.checked })}
                  />
                  Featured
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-5">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Plan name</span>
                  <input
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.name}
                    onChange={(event) => updateBusinessPlan(index, { name: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Monthly price</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.priceMonthly}
                    onChange={(event) => {
                      const priceMonthly = Number(event.target.value) || 0;
                      updateBusinessPlan(index, {
                        priceMonthly,
                        ...(priceMonthly <= 0 ? { discountPercent: 0, discountLabel: "", stripeCouponId: "" } : {}),
                      });
                    }}
                  />
                </label>
                {plan.priceMonthly > 0 ? (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Discount %</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={plan.discountPercent || 0}
                      onChange={(event) => updateBusinessPlan(index, { discountPercent: Number(event.target.value) || 0 })}
                    />
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Job post limit</span>
                  <input
                    type="number"
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.jobPostLimit}
                    onChange={(event) => updateBusinessPlan(index, { jobPostLimit: Number(event.target.value) || 0 })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Shortlist limit</span>
                  <input
                    type="number"
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.workerShortlistLimit}
                    onChange={(event) => updateBusinessPlan(index, { workerShortlistLimit: Number(event.target.value) || 0 })}
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Description</span>
                  <textarea
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.description}
                    onChange={(event) => updateBusinessPlan(index, { description: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Perks</span>
                  <textarea
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.perks.join("\n")}
                    onChange={(event) => updateBusinessPlanPerks(index, event.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                {plan.priceMonthly > 0 ? (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Discount label</span>
                    <input
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={plan.discountLabel || ""}
                      placeholder="Launch offer"
                      onChange={(event) => updateBusinessPlan(index, { discountLabel: event.target.value })}
                    />
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Stripe price ID</span>
                  <input
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.stripePriceId || ""}
                    placeholder="Future billing integration"
                    onChange={(event) => updateBusinessPlan(index, { stripePriceId: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Button label</span>
                  <input
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.cta || ""}
                    onChange={(event) => updateBusinessPlan(index, { cta: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Button link</span>
                  <input
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    value={plan.href || ""}
                    onChange={(event) => updateBusinessPlan(index, { href: event.target.value })}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>
      ) : null}
      {activeSection === "policies" ? (
      <details open className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4">
          <h2 className="inline text-lg font-semibold text-slate-950">Policies</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            CMS-managed public policy pages. Updates saved here appear on the frontend policy pages.
          </p>
        </summary>
        <div className="space-y-4 border-t border-slate-100 px-5 py-5">
          {POLICY_DOCUMENTS.map((document: CmsPolicyDocument) => (
            <details key={document.slug} open className="rounded-lg border border-slate-200">
              <summary className="cursor-pointer list-none px-4 py-3">
                <span className="text-base font-bold text-slate-950">{document.title}</span>
                <span className="ml-2 text-sm text-slate-500">{document.path}</span>
              </summary>
              <div className="space-y-4 border-t border-slate-100 p-4">
                {document.blocks.map((block) => {
                  const key = policySettingKey(document.slug, block.key);
                  return (
                    <label key={key} className="block">
                      <span className="text-sm font-medium text-slate-700">{block.title}</span>
                      <textarea
                        rows={5}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                        value={policyValues[key] || ""}
                        onChange={(event) => setPolicyValues((current) => ({ ...current, [key]: event.target.value }))}
                      />
                    </label>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </details>
      ) : null}
      {activeSection === "warnings" ? (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Warnings and notices</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Create and edit warning messages by audience. Admin pages do not display these as banners.
            </p>
          </div>
          <button
            type="button"
            onClick={addWarning}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Add warning
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {warningMessages.map((warning, index) => {
            const locked = warning.id === PROVIDER_INSURANCE_WARNING_ID;
            return (
              <article key={`${warning.id}-${index}`} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-200"
                      checked={warning.enabled}
                      onChange={(event) => updateWarning(index, { enabled: event.target.checked })}
                    />
                    Active warning
                  </label>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => removeWarning(index)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title={locked ? "Provider insurance warning is a system warning and cannot be removed." : "Remove warning"}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Warning key</span>
                    <input
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:bg-slate-50 disabled:text-slate-500"
                      value={warning.id}
                      disabled={locked}
                      onChange={(event) => updateWarning(index, { id: createWarningId(event.target.value) })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Audience</span>
                    <select
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={warning.surface}
                      onChange={(event) => updateWarning(index, { surface: event.target.value as PlatformWarningSurface })}
                    >
                      {warningSurfaceOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Severity</span>
                    <select
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={warning.severity}
                      onChange={(event) => updateWarning(index, { severity: event.target.value as PlatformWarningSeverity })}
                    >
                      {warningSeverityOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Title</span>
                    <input
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={warning.title}
                      onChange={(event) => updateWarning(index, { title: event.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Message</span>
                    <textarea
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={warning.message}
                      onChange={(event) => updateWarning(index, { message: event.target.value })}
                    />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      ) : null}
    </div>
  );
}
