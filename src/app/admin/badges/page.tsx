import { Suspense } from "react";
import { Award, CheckCircle, Crown, Dices, Gift, RefreshCw, ShieldCheck, Star, ThumbsUp, TrendingUp, Upload, UserPlus, Zap } from "lucide-react";

import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { type AdminSearchParams, firstParam } from "../_lib/admin-query";
import {
  awardBadgeRandomly,
  awardBadgeToUser,
  badgeAudienceLabels,
  badgeAwardTypeLabels,
  badgeMetricLabels,
  badgeOperatorLabels,
  badgeSchemaReady,
  createBadgeDefinition,
  getAdminBadges,
  runBadgeSyncAction,
  updateBadgeDefinition,
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

function BadgeIcon({ badge }: { badge: Pick<BadgeDefinition, "icon"> }) {
  if (/^https?:\/\//i.test(badge.icon)) {
    return (
      <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
        <img src={badge.icon} alt="" className="h-full w-full object-contain p-1.5" />
      </span>
    );
  }

  const Icon = iconMap[badge.icon as keyof typeof iconMap] || Award;
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
      <Icon className="h-5 w-5" />
    </span>
  );
}

function BadgeIconUpload({ badge, required = false }: { badge?: Pick<BadgeDefinition, "icon">; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">Badge icon upload</span>
      {badge ? <input type="hidden" name="current_icon" value={badge.icon} /> : null}
      <span className="mt-2 flex items-center gap-4 rounded-lg border border-dashed border-slate-300 bg-white p-4">
        {badge ? <BadgeIcon badge={badge} /> : (
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">
            <Upload className="h-5 w-5" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-800">{badge ? "Upload replacement icon" : "Upload icon"}</span>
          <span className="mt-1 block text-xs text-slate-500">PNG, JPG, WebP, or GIF. Max 2MB.</span>
        </span>
        <span className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Choose file</span>
      </span>
      <input name="icon_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required={required} className="sr-only" />
    </label>
  );
}

function RuleFields({ slot, optional = false, rule }: { slot: string; optional?: boolean; rule?: BadgeDefinition["rules"][number] }) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_140px_140px]">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Rule {slot}{optional ? " optional" : ""}
        </span>
        <select
          name={`metric_${slot}`}
          required={!optional}
          defaultValue={rule?.metric || (optional ? "" : "completed_jobs")}
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
          defaultValue={rule?.operator || "gte"}
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
          defaultValue={rule?.threshold ?? (optional ? "" : "5")}
          placeholder={optional ? "Skip" : "5"}
          className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
        />
      </label>
    </div>
  );
}

function formatRule(rule: BadgeDefinition["rules"][number]) {
  const threshold = ["verified_provider", "payment_verified", "kyc_verified"].includes(rule.metric)
    ? (rule.threshold >= 1 ? "yes" : "no")
    : rule.threshold;
  return `${badgeMetricLabels[rule.metric]} ${badgeOperatorLabels[rule.operator]} ${threshold}`;
}

function EditBadgeForm({ badge }: { badge: BadgeDefinition }) {
  return (
    <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">
        Edit badge rules and display
      </summary>
      <form action={updateBadgeDefinition} className="space-y-5 border-t border-slate-200 p-4">
        <input type="hidden" name="badge_id" value={badge.id} />

        <div className="grid gap-4 lg:grid-cols-2">
          <label>
            <span className="text-sm font-medium text-slate-700">Badge name</span>
            <input
              name="name"
              required
              defaultValue={badge.name}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Audience</span>
            <select name="audience" defaultValue={badge.audience} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              {Object.entries(badgeAudienceLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            name="description"
            defaultValue={badge.description}
            className="mt-2 min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
          />
        </label>

        <label className="block max-w-xl">
          <span className="text-sm font-medium text-slate-700">Award type</span>
          <select name="award_type" defaultValue={badge.award_type} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
            {Object.entries(badgeAwardTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <div>
          <BadgeIconUpload badge={badge} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <input name="is_active" type="checkbox" defaultChecked={badge.is_active} className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
            <span className="text-sm font-medium text-slate-700">Active badge</span>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <input name="is_public" type="checkbox" defaultChecked={badge.is_public} className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
            <span className="text-sm font-medium text-slate-700">Publicly visible</span>
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Automation rules</h4>
            <p className="mt-1 text-sm text-slate-600">These slots replace the current rules for this badge. Leave all blank for manual or random only.</p>
          </div>
          <RuleFields slot="1" optional rule={badge.rules[0]} />
          <RuleFields slot="2" optional rule={badge.rules[1]} />
          <RuleFields slot="3" optional rule={badge.rules[2]} />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">
            Save badge changes
          </button>
        </div>
      </form>
    </details>
  );
}

function BadgeDataFallback() {
  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-4">
        {["Definitions", "Awards", "Providers", "Buyers"].map((label) => (
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

function BadgeActionBanner({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {message}
    </div>
  );
}

async function BadgeDataPanel() {
  const { badges, providerCount, buyerCount, schemaReady, totalAwards } = await getAdminBadges();
  const awardableBadges = badges.filter((badge) => badge.is_active);

  return (
    <div className="space-y-5">
      {!schemaReady ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Badge automation tables are not available in Supabase yet. Apply the latest badge migration to enable unified buyer/provider awards.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Badge definitions</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{badges.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total awards</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{totalAwards}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Provider records</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{providerCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Buyer records</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{buyerCount}</p>
        </div>
      </section>

      <section className="space-y-5">
        <form action={awardBadgeToUser} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <UserPlus className="mt-1 h-5 w-5 text-red-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Award badge manually</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Assign any active badge to a provider or buyer by email or user ID.</p>
            </div>
          </div>
          <fieldset disabled={!schemaReady} className="mt-4 grid gap-3 disabled:opacity-60 md:grid-cols-2">
            <label>
              <span className="text-sm font-medium text-slate-700">Badge</span>
              <select name="badge_id" required className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                <option value="">Select badge</option>
                {awardableBadges.map((badge) => (
                  <option key={badge.id} value={badge.id}>{badge.name} · {badgeAudienceLabels[badge.audience]}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-slate-700">Award to</span>
              <select name="target_role" defaultValue="auto" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                <option value="auto">Auto-match badge/user</option>
                <option value="provider">Provider</option>
                <option value="buyer">Buyer</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Email or user ID</span>
              <input name="user_query" required placeholder="provider@example.com or UUID" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
            </label>
            <label>
              <span className="text-sm font-medium text-slate-700">Award type</span>
              <select name="award_type" defaultValue="manual" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                <option value="manual">Manual</option>
                <option value="random">Random/manual</option>
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-slate-700">Reason</span>
              <input name="reason" placeholder="Special recognition" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
            </label>
            <button type="submit" className="md:col-span-2 inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">
              Award badge
            </button>
          </fieldset>
        </form>

        <form action={awardBadgeRandomly} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Dices className="mt-1 h-5 w-5 text-red-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Award randomly</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Pick a badge and audience. AnyJob will choose a user who does not already have it.</p>
            </div>
          </div>
          <fieldset disabled={!schemaReady} className="mt-4 grid gap-3 md:grid-cols-2 disabled:opacity-60">
            <label>
              <span className="text-sm font-medium text-slate-700">Badge</span>
              <select name="random_badge_id" required className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                <option value="">Select badge</option>
                {awardableBadges.map((badge) => (
                  <option key={badge.id} value={badge.id}>{badge.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-slate-700">Audience</span>
              <select name="random_target_role" defaultValue="provider" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                <option value="provider">Provider pool</option>
                <option value="buyer">Buyer pool</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Reason</span>
              <input name="random_reason" placeholder="Random trust campaign, seasonal award..." className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
            </label>
            <button type="submit" className="md:col-span-2 inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
              Pick user and award
            </button>
          </fieldset>
        </form>
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
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{badgeAudienceLabels[badge.audience]}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{badgeAwardTypeLabels[badge.award_type]}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{badge.description || "No description set."}</p>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {badge.awardedCount} awarded
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rules</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {badge.rules.length ? badge.rules.map((rule) => (
                  <span key={rule.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {formatRule(rule)}
                  </span>
                )) : (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    Manual or random only
                  </span>
                )}
              </div>
            </div>

            <EditBadgeForm badge={badge} />
          </article>
        )) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <Award className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-3 text-lg font-semibold text-slate-950">No badges yet</h2>
            <p className="mt-1 text-sm text-slate-600">Create the first badge definition to start recognition.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function AdminBadgesPage({ searchParams }: { searchParams?: AdminSearchParams }) {
  const schemaReady = await badgeSchemaReady();
  const params = (await searchParams) || {};
  const badgeError = firstParam(params, "badge_error", "");
  const badgeSuccess = firstParam(params, "badge_success", "");

  return (
    <AdminShell
      title="Badges"
      description="Create provider and buyer badges, award them manually or randomly, and use rules for fixed achievements such as completed jobs, payment verification, KYC, and total spend."
      actions={
        <>
          <form action={runBadgeSyncAction}>
            <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Gift className="h-4 w-4" />
              Run badge rules
            </button>
          </form>
          <AdminButtonLink href="/admin/history">
            <RefreshCw className="h-4 w-4" />
            Audit badge awards
          </AdminButtonLink>
        </>
      }
    >
      <section className="mt-6 space-y-6">
        {badgeError ? <BadgeActionBanner type="error" message={badgeError} /> : null}
        {badgeSuccess ? <BadgeActionBanner type="success" message={badgeSuccess} /> : null}

        <form action={createBadgeDefinition} className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Create badge</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Build a visible trust badge, upload its icon, then add rules only when it should be awarded automatically.
              </p>
              {!schemaReady ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                  Badge creation is disabled until the badge migration is applied to Supabase.
                </p>
              ) : null}
            </div>
          </div>

          <fieldset disabled={!schemaReady} className="divide-y divide-slate-200 disabled:opacity-60">
            <div className="space-y-4 p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Badge name</span>
                  <input
                    name="name"
                    required
                    placeholder="Payment verified"
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Audience</span>
                  <select name="audience" defaultValue="provider" className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm">
                    {Object.entries(badgeAudienceLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  name="description"
                  placeholder="Shown on profiles or job posts to explain the trust signal."
                  className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="block max-w-xl">
                <span className="text-sm font-medium text-slate-700">Award type</span>
                <select name="award_type" defaultValue="automatic" className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  {Object.entries(badgeAwardTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-5 p-5">
              <BadgeIconUpload required />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
                  <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                  <span className="text-sm font-medium text-slate-700">Active badge</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
                  <input name="is_public" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                  <span className="text-sm font-medium text-slate-700">Publicly visible</span>
                </label>
              </div>
            </div>

            <div className="space-y-3 p-5">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Automation rules</h3>
                <p className="mt-1 text-sm text-slate-600">Leave optional rules blank for manual or random badges.</p>
              </div>
              <RuleFields slot="1" optional />
              <RuleFields slot="2" optional />
              <RuleFields slot="3" optional />
            </div>

            <div className="flex justify-end p-5">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Create badge
              </button>
            </div>
          </fieldset>
        </form>

        <Suspense fallback={<BadgeDataFallback />}>
          <BadgeDataPanel />
        </Suspense>
      </section>
    </AdminShell>
  );
}
