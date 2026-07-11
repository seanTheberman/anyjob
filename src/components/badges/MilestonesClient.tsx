"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crown,
  ShieldCheck,
  Star,
  Target,
  ThumbsUp,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

type BadgeRole = "provider" | "buyer";

type MilestoneRule = {
  id: string;
  metric: string;
  label: string;
  threshold: number;
  value: number;
  valueLabel: string;
  thresholdLabel: string;
  requirement: string;
  progress: number;
  complete: boolean;
};

type MilestoneBadge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  awardedAt: string | null;
  progress: number;
  rules: MilestoneRule[];
};

type MilestoneMetric = {
  key: string;
  label: string;
  value: number;
  valueLabel: string;
  qualifiesNext: boolean;
};

type MilestonePayload = {
  role: BadgeRole;
  user: {
    name: string;
    initial: string;
  };
  summary: {
    earnedCount: number;
    totalCount: number;
    progress: number;
    currentLevelName: string;
    nextBadgeName: string | null;
  };
  metrics: MilestoneMetric[];
  badges: MilestoneBadge[];
  currentLevel: MilestoneBadge | null;
  nextBadge: MilestoneBadge | null;
};

const iconMap: Record<string, LucideIcon> = {
  Award,
  BadgeCheck,
  CheckCircle: CheckCircle2,
  Crown,
  ShieldCheck,
  Star,
  ThumbsUp,
  TrendingUp,
};

const toneClasses: Record<string, { panel: string; icon: string; bar: string; pill: string }> = {
  emerald: {
    panel: "border-emerald-200 bg-emerald-50 text-emerald-950",
    icon: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-500",
    pill: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  },
  blue: {
    panel: "border-blue-200 bg-blue-50 text-blue-950",
    icon: "bg-blue-100 text-blue-700",
    bar: "bg-blue-500",
    pill: "bg-blue-100 text-blue-700 ring-blue-200",
  },
  amber: {
    panel: "border-amber-200 bg-amber-50 text-amber-950",
    icon: "bg-amber-100 text-amber-700",
    bar: "bg-amber-500",
    pill: "bg-amber-100 text-amber-700 ring-amber-200",
  },
  purple: {
    panel: "border-purple-200 bg-purple-50 text-purple-950",
    icon: "bg-purple-100 text-purple-700",
    bar: "bg-purple-500",
    pill: "bg-purple-100 text-purple-700 ring-purple-200",
  },
  red: {
    panel: "border-red-200 bg-red-50 text-red-950",
    icon: "bg-red-100 text-red-700",
    bar: "bg-red-500",
    pill: "bg-red-100 text-red-700 ring-red-200",
  },
};

function toneFor(color: string) {
  return toneClasses[color] || toneClasses.red;
}

function compactDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function ProgressBar({ value, color = "red" }: { value: number; color?: string }) {
  const tone = toneFor(color);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function ruleStatusText(rule: MilestoneRule, badge: MilestoneBadge) {
  if (rule.complete) {
    return `Done: ${rule.label} is ${rule.valueLabel}; needed ${rule.thresholdLabel}`;
  }

  if (badge.earned) {
    return `Awarded: ${rule.label} is currently ${rule.valueLabel}; rule target is ${rule.thresholdLabel}`;
  }

  return `Pending: ${rule.label} is ${rule.valueLabel}; needs ${rule.thresholdLabel}`;
}

function badgeTooltipText(badge: MilestoneBadge, fallbackLabel: string) {
  const header = `${badge.name || fallbackLabel}: ${badge.earned ? "earned" : "pending"}`;
  if (!badge.rules.length) return header;

  const doneRules = badge.rules.filter((rule) => rule.complete);
  const pendingRules = badge.rules.filter((rule) => !rule.complete);
  const lines = [header];

  if (doneRules.length) {
    lines.push("Done metrics:");
    doneRules.forEach((rule) => lines.push(ruleStatusText(rule, badge)));
  }

  if (pendingRules.length) {
    lines.push(badge.earned ? "Current metrics:" : "Pending metrics:");
    pendingRules.forEach((rule) => lines.push(ruleStatusText(rule, badge)));
  }

  return lines.join("\n");
}

function MilestoneTooltip({ text, visible }: { text: string; visible: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute left-1/2 top-full z-[2147483647] mt-3 w-72 -translate-x-1/2 whitespace-pre-line rounded-lg bg-gray-950 px-3 py-2 text-left text-xs font-semibold leading-5 text-white shadow-2xl ring-1 ring-black/10 transition-opacity ${
        visible ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      {text}
    </span>
  );
}

function TrackerDot({
  badge,
  fallbackLabel,
  size = "sm",
}: {
  badge?: MilestoneBadge;
  fallbackLabel: string;
  size?: "sm" | "lg";
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const earned = badge?.earned ?? false;
  const tooltip = badge ? badgeTooltipText(badge, fallbackLabel) : `${fallbackLabel}: pending`;
  const isLarge = size === "lg";

  return (
    <button
      type="button"
      aria-label={tooltip}
      onBlur={() => setTooltipVisible(false)}
      onClick={() => setTooltipVisible(true)}
      onFocus={() => setTooltipVisible(true)}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      className={`group relative flex shrink-0 items-center justify-center rounded-full font-black outline-none ring-white transition focus-visible:ring-4 ${
        isLarge ? "h-10 w-10 text-sm" : "h-6 w-6 text-xs"
      } ${earned ? "bg-red-600 text-white" : "bg-gray-200 text-gray-500"}`}
    >
      {earned ? <CheckCircle2 className={isLarge ? "h-5 w-5" : "h-4 w-4"} /> : isLarge ? fallbackLabel.replace(/\D/g, "") || <Clock3 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
      <MilestoneTooltip text={tooltip} visible={tooltipVisible} />
    </button>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="h-24 animate-pulse rounded-lg bg-white ring-1 ring-gray-200" />
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="h-96 animate-pulse rounded-lg bg-white ring-1 ring-gray-200" />
        <div className="h-96 animate-pulse rounded-lg bg-white ring-1 ring-gray-200" />
      </div>
    </div>
  );
}

function EmptyState({ role }: { role: BadgeRole }) {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <Award className="h-6 w-6 text-red-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-950">No public badge milestones yet</h1>
      <p className="mt-2 text-sm text-gray-600">
        Once admin adds active rule-based badges for {role === "provider" ? "providers" : "buyers"}, your progress will appear here.
      </p>
    </div>
  );
}

function ProfileTracker({ data }: { data: MilestonePayload }) {
  const trackerBadges = useMemo(() => {
    const total = Math.max(4, Math.min(6, data.summary.totalCount || 4));
    return Array.from({ length: total }, (_, index) => data.badges[index]);
  }, [data.badges, data.summary.totalCount]);

  return (
    <aside className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gray-950 text-3xl font-black text-white shadow-lg">
          {data.user.initial}
        </div>
        <p className="mt-4 text-sm font-semibold text-gray-500">{data.role === "provider" ? "Provider level" : "Buyer trust level"}</p>
        <h2 className="mt-1 text-2xl font-black text-gray-950">{data.summary.currentLevelName}</h2>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-center">
          {trackerBadges.map((badge, index) => (
            <div key={index} className="flex items-center">
              <TrackerDot badge={badge} fallbackLabel={`Milestone ${index + 1}`} size="lg" />
              {index < trackerBadges.length - 1 ? <div className={`h-1 w-8 ${trackerBadges[index + 1]?.earned ? "bg-red-600" : "bg-gray-200"}`} /> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <h3 className="text-lg font-black text-gray-950">Progress tracker</h3>
        <div className="mt-4 flex justify-center gap-2">
          {data.badges.slice(0, 7).map((badge) => (
            <TrackerDot key={badge.id} badge={badge} fallbackLabel={badge.name} />
          ))}
        </div>
        <p className="mt-4 text-sm font-medium text-gray-600">
          {data.summary.earnedCount > 0 ? "You are building solid marketplace trust. Keep the momentum going." : "Complete your first milestone to start building visible trust."}
        </p>
      </div>
    </aside>
  );
}

function MetricCard({ metric, nextBadge }: { metric: MilestoneMetric; nextBadge: MilestoneBadge | null }) {
  const relatedRule = nextBadge?.rules.find((rule) => rule.metric === metric.key);
  const progress = relatedRule?.progress ?? (metric.qualifiesNext ? 100 : 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-700">{metric.label}</p>
          <p className="mt-6 text-3xl font-black text-gray-950">{metric.valueLabel}</p>
        </div>
        {metric.qualifiesNext ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <Target className="h-5 w-5 text-gray-400" />
        )}
      </div>
      <div className="mt-5">
        <ProgressBar value={progress} color={metric.qualifiesNext ? "emerald" : "red"} />
      </div>
      <div className="mt-5">
        {metric.qualifiesNext ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
            <CheckCircle2 className="h-4 w-4" />
            Qualifies for next badge
          </span>
        ) : relatedRule ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-600">
            <Clock3 className="h-4 w-4" />
            Target {relatedRule.thresholdLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function BadgeMilestoneCard({ badge }: { badge: MilestoneBadge }) {
  const Icon = iconMap[badge.icon] || Award;
  const tone = toneFor(badge.color);

  return (
    <article className={`rounded-lg border bg-white p-5 shadow-sm ${badge.earned ? tone.panel : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${badge.earned ? tone.icon : "bg-gray-100 text-gray-500"}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-gray-950">{badge.name}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ring-1 ${
                badge.earned ? tone.pill : "bg-gray-100 text-gray-600 ring-gray-200"
              }`}>
                {badge.earned ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                {badge.earned ? "Earned" : "In progress"}
              </span>
            </div>
            {badge.description ? <p className="mt-1 text-sm text-gray-600">{badge.description}</p> : null}
            {badge.awardedAt ? <p className="mt-2 text-xs font-semibold text-gray-500">Awarded {compactDate(badge.awardedAt)}</p> : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-black text-gray-950">{badge.progress}%</p>
          <p className="text-xs font-semibold text-gray-500">complete</p>
        </div>
      </div>

      <div className="mt-5">
        <ProgressBar value={badge.progress} color={badge.earned ? badge.color : "red"} />
      </div>

      {badge.rules.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {badge.rules.map((rule) => (
            <div key={rule.id} className="rounded-md bg-white/70 p-3 ring-1 ring-gray-200">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-gray-800">{rule.requirement}</p>
                {badge.earned || rule.complete ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
              </div>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {badge.earned && !rule.complete ? `Awarded; current metric is ${rule.valueLabel}` : `Current: ${rule.valueLabel}`}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function MilestonesClient({ role }: { role: BadgeRole }) {
  const [data, setData] = useState<MilestonePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMilestones = async () => {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/badges/milestones?role=${role}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (cancelled) return;
      if (!response.ok) {
        setError(payload?.error || "Could not load milestones.");
        setLoading(false);
        return;
      }

      setData(payload as MilestonePayload);
      setLoading(false);
    };

    void loadMilestones();
    return () => {
      cancelled = true;
    };
  }, [role]);

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        <h1 className="text-lg font-black">Milestones could not load</h1>
        <p className="mt-2 text-sm font-medium">{error}</p>
      </div>
    );
  }
  if (!data || !data.badges.length) return <EmptyState role={role} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-red-600">
              {role === "provider" ? "Provider milestones" : "Buyer milestones"}
            </p>
            <h1 className="mt-2 text-3xl font-black text-gray-950">Badge progress</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Track the exact rule milestones needed to unlock visible marketplace badges.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-bold text-gray-500">Earned</p>
              <p className="mt-1 text-2xl font-black text-gray-950">{data.summary.earnedCount}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-bold text-gray-500">Total</p>
              <p className="mt-1 text-2xl font-black text-gray-950">{data.summary.totalCount}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-bold text-gray-500">Progress</p>
              <p className="mt-1 text-2xl font-black text-gray-950">{data.summary.progress}%</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ProfileTracker data={data} />

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-950">My performance metrics</h2>
              <p className="mt-1 text-sm text-gray-600">
                These stats come from live jobs, reviews, bookings, payments, and verification checks.
              </p>
            </div>
            {data.nextBadge ? (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 ring-1 ring-red-100">
                <Target className="h-4 w-4" />
                Next: {data.nextBadge.name}
              </span>
            ) : (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
                All current badges qualified
              </span>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.metrics.map((metric) => (
              <MetricCard key={metric.key} metric={metric} nextBadge={data.nextBadge} />
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-950">Rule badge milestones</h2>
            <p className="text-sm text-gray-600">Each card shows what is complete and what still needs work.</p>
          </div>
        </div>
        <div className="grid gap-4">
          {data.badges.map((badge) => (
            <BadgeMilestoneCard key={badge.id} badge={badge} />
          ))}
        </div>
      </section>
    </div>
  );
}
