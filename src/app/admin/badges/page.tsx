import { Suspense } from "react";
import { Award, CheckCircle, Crown, RefreshCw, ShieldCheck, Star, ThumbsUp, TrendingUp, Zap } from "lucide-react";

import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import {
  badgeColorOptions,
  badgeIconOptions,
  badgeMetricLabels,
  badgeOperatorLabels,
  badgeSchemaReady,
  createBadgeDefinition,
  getAdminBadges,
  type BadgeDefinition,
} from "../_lib/badge-automation";

export const dynamic = "force-dynamic";

const iconMap = {
  Award,
  Star,
  ShieldCheck,
  TrendingUp,
  Zap,
  ThumbsUp,
  Crown,
  CheckCircle,
};

const colorClass = {
  red: "bg-red-50 text-red-700 ring-red-100",
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  purple: "bg-purple-50 text-purple-700 ring-purple-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

function BadgeIcon({ badge }: { badge: Pick<BadgeDefinition, "icon" | "color"> }) {
  const Icon = iconMap[badge.icon as keyof typeof iconMap] || Award;
  return (
    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ring-1 ${colorClass[badge.color as keyof typeof colorClass] || colorClass.red}`}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

function RuleFields({ slot, optional = false }: { slot: string; optional?: boolean }) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_140px_140px]">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Rule {slot}{optional ? " optional" : ""}
        </span>
        <select
          name={`metric_${slot}`}
          required={!optional}
          defaultValue={optional ? "" : "completed_jobs"}
          className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
        >
          {optional ? <option value="">No rule</option> : null}
          {Object.entries(badgeMetricLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Condition</span>
        <select
          name={`operator_${slot}`}
          defaultValue="gte"
          className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
        >
          {Object.entries(badgeOperatorLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Value</span>
        <input
          name={`threshold_${slot}`}
          required={!optional}
          type="number"
          step="0.1"
          min="0"
          defaultValue={optional ? "" : "5"}
          placeholder={optional ? "Skip" : "5"}
          className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
        />
      </label>
    </div>
  );
}

function formatRule(rule: BadgeDefinition["rules"][number]) {
  const threshold = rule.metric === "verified_provider" ? (rule.threshold >= 1 ? "yes" : "no") : rule.threshold;
  return `${badgeMetricLabels[rule.metric]} ${badgeOperatorLabels[rule.operator]} ${threshold}`;
}

async function BadgeDataPanel() {
  const { badges, providerCount, schemaReady, totalAwards } = await getAdminBadges();

  return (
    <div className="space-y-4">
      {!schemaReady ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Badge automation tables are not available in Supabase yet. Apply `supabase/migrations/20260606_create_badge_rules.sql` to enable badge creation and auto-awards.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Badge definitions</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{badges.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Auto-awarded badges</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{totalAwards}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Provider records</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{providerCount}</p>
        </div>
      </section>

      <div className="space-y-4">
        {badges.length ? badges.map((badge) => (
          <article key={badge.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-3">
                <BadgeIcon badge={badge} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-950">{badge.name}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {badge.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{badge.description || "No description set."}</p>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {badge.awardedCount} awarded
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Auto-award rules</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {badge.rules.length ? badge.rules.map((rule) => (
                  <span key={rule.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {formatRule(rule)}
                  </span>
                )) : (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    No rules configured
                  </span>
                )}
              </div>
            </div>
          </article>
        )) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <Award className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-3 text-lg font-semibold text-slate-950">No badges yet</h2>
            <p className="mt-1 text-sm text-slate-600">Create the first badge definition to start automatic recognition.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BadgeDataFallback() {
  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        {["Definitions", "Awards", "Providers"].map((label) => (
          <div key={label} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-28 rounded bg-slate-100" />
            <div className="mt-5 h-8 w-14 rounded bg-slate-100" />
          </div>
        ))}
      </section>
      <div className="h-44 animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm" />
      <div className="h-44 animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm" />
    </div>
  );
}

export default async function AdminBadgesPage() {
  const schemaReady = await badgeSchemaReady();

  return (
    <AdminShell
      title="Badges"
      description="Create provider recognition badges, define the rules for earning them, and automatically award them when providers meet the requirements."
      actions={
        <AdminButtonLink href="/admin/history">
          <RefreshCw className="h-4 w-4" />
          Audit badge awards
        </AdminButtonLink>
      }
    >
      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
        <form action={createBadgeDefinition} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Create badge</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Rules are evaluated with AND logic. A provider must satisfy every filled rule to receive the badge.
            </p>
            {!schemaReady ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                Badge creation is disabled until the badge migration is applied to Supabase.
              </p>
            ) : null}
          </div>

          <fieldset disabled={!schemaReady} className="mt-5 space-y-4 disabled:opacity-60">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Badge name</span>
              <input
                name="name"
                required
                placeholder="Top Rated"
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                name="description"
                placeholder="Awarded to providers with excellent ratings and a strong completion record."
                className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Icon</span>
                <select name="icon" defaultValue="Award" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100">
                  {badgeIconOptions.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Color</span>
                <select name="color" defaultValue="red" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm capitalize outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100">
                  {badgeColorOptions.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-end gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                <span className="text-sm font-medium text-slate-700">Active</span>
              </label>
            </div>

            <RuleFields slot="1" />
            <RuleFields slot="2" optional />
            <RuleFields slot="3" optional />

            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Create badge and run auto-awards
            </button>
          </fieldset>
        </form>

        <Suspense fallback={<BadgeDataFallback />}>
          <BadgeDataPanel />
        </Suspense>
      </section>
    </AdminShell>
  );
}
