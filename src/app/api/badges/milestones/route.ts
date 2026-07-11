import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type BadgeRole = "provider" | "buyer";
type BadgeOperator = "gte" | "lte" | "eq";
type LooseRow = Record<string, unknown>;
type QueryError = { message: string };
type QueryListResult = { data: LooseRow[] | null; error: QueryError | null };
type LooseQuery = PromiseLike<QueryListResult> & {
  select(columns?: string): LooseQuery;
  in(column: string, values: unknown[]): LooseQuery;
  eq(column: string, value: unknown): LooseQuery;
  order(column: string, options?: { ascending?: boolean }): LooseQuery;
};
type BadgeMetricClient = {
  rpc(
    fn: "badge_metric_value",
    args: { target_user_id: string; target_role: BadgeRole; metric_name: string },
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
};
type LooseAdminClient = BadgeMetricClient & {
  from(table: string): LooseQuery;
};

const metricLabels: Record<string, string> = {
  completed_jobs: "Completed jobs",
  average_rating: "Average rating",
  review_count: "Review count",
  total_earnings: "Total earnings",
  cancelled_jobs: "Cancelled jobs",
  verified_provider: "Verified provider",
  jobs_posted: "Jobs posted",
  hired_jobs: "Hired jobs",
  paid_jobs: "Paid jobs",
  total_spent: "Total spent",
  payment_verified: "Payment verified",
  kyc_verified: "KYC verified",
  account_age_days: "Account age",
};

const moneyMetrics = new Set(["total_earnings", "total_spent"]);
const percentMetrics = new Set(["completion_rate", "response_rate"]);
const booleanMetrics = new Set(["verified_provider", "payment_verified", "kyc_verified"]);

function roleFromRequest(request: NextRequest): BadgeRole {
  return request.nextUrl.searchParams.get("role") === "buyer" ? "buyer" : "provider";
}

function compare(value: number, operator: BadgeOperator, threshold: number) {
  if (operator === "lte") return value <= threshold;
  if (operator === "eq") return value === threshold;
  return value >= threshold;
}

function progressForRule(value: number, operator: BadgeOperator, threshold: number) {
  if (compare(value, operator, threshold)) return 100;
  if (operator === "gte") return threshold > 0 ? Math.min(99, Math.max(0, (value / threshold) * 100)) : 0;
  if (operator === "lte") return value > 0 ? Math.min(99, Math.max(0, (threshold / value) * 100)) : 100;
  return 0;
}

function missingForRule(value: number, operator: BadgeOperator, threshold: number) {
  if (compare(value, operator, threshold)) return 0;
  if (operator === "lte") return Math.max(0, value - threshold);
  return Math.max(0, threshold - value);
}

function formatMetricValue(metric: string, value: number) {
  if (booleanMetrics.has(metric)) return value >= 1 ? "Yes" : "No";
  if (moneyMetrics.has(metric)) return `€${Math.round(value).toLocaleString()}`;
  if (percentMetrics.has(metric)) return `${Math.round(value)}%`;
  if (metric.includes("rating")) return value ? value.toFixed(1).replace(/\.0$/, "") : "0";
  return Math.round(value).toLocaleString();
}

function ruleCopy(metric: string, operator: BadgeOperator, threshold: number) {
  const label = metricLabels[metric] || metric.replace(/_/g, " ");
  const target = formatMetricValue(metric, threshold);
  if (booleanMetrics.has(metric)) return `${label}: ${threshold >= 1 ? "yes" : "no"}`;
  if (operator === "lte") return `${label}: at most ${target}`;
  if (operator === "eq") return `${label}: exactly ${target}`;
  return `${label}: at least ${target}`;
}

function levelPriority(row: LooseRow) {
  const label = `${String(row.name || "")} ${String(row.slug || "")}`.toLowerCase();
  if (label.includes("top pro") || label.includes("top-pro")) return 100;
  const match = label.match(/level[-\s]*(\d+)/i);
  return match ? Number(match[1]) : 0;
}

async function loadMetricValue(admin: BadgeMetricClient, userId: string, role: BadgeRole, metric: string) {
  const { data, error } = await admin.rpc("badge_metric_value", {
    target_user_id: userId,
    target_role: role,
    metric_name: metric,
  });

  if (error) {
    console.error(`Failed to load badge metric ${metric}:`, error.message);
    return 0;
  }

  const value = Number(data || 0);
  return Number.isFinite(value) ? value : 0;
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = roleFromRequest(request);
  const admin = createAdminSupabaseClient() as unknown as LooseAdminClient;

  const { data: definitions, error: definitionsError } = await admin
    .from("badge_definitions")
    .select("id,slug,name,description,icon,color,audience,award_type,is_active,is_public,sort_order,created_at")
    .in("audience", [role, "all"])
    .eq("is_active", true)
    .eq("is_public", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (definitionsError) {
    return NextResponse.json({ error: definitionsError.message }, { status: 500 });
  }

  const badgeIds = (definitions || []).map((badge: LooseRow) => String(badge.id || "")).filter(Boolean);
  const [rulesResult, awardsResult, providerAwardsResult] = await Promise.all([
    badgeIds.length
      ? admin.from("badge_rules").select("id,badge_id,metric,operator,threshold").in("badge_id", badgeIds)
      : Promise.resolve({ data: [], error: null }),
    admin
      .from("user_badges")
      .select("id,badge_id,target_role,award_type,awarded_reason,awarded_at,source")
      .eq("user_id", user.id)
      .eq("target_role", role),
    role === "provider"
      ? admin.from("provider_badges").select("id,badge_id,awarded_reason,awarded_at").eq("provider_id", user.id)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (rulesResult.error || awardsResult.error || providerAwardsResult.error) {
    return NextResponse.json(
      { error: rulesResult.error?.message || awardsResult.error?.message || providerAwardsResult.error?.message || "Could not load milestones." },
      { status: 500 },
    );
  }

  const rules = rulesResult.data || [];
  const metrics = Array.from(new Set(rules.map((rule) => String(rule.metric || "")).filter(Boolean)));
  const metricPairs = await Promise.all(metrics.map(async (metric) => [metric, await loadMetricValue(admin, user.id, role, metric)] as const));
  const metricValues = Object.fromEntries(metricPairs);

  const rulesByBadge = new Map<string, LooseRow[]>();
  for (const rule of rules) {
    const badgeId = String(rule.badge_id || "");
    rulesByBadge.set(badgeId, [...(rulesByBadge.get(badgeId) || []), rule]);
  }

  const awardsByBadge = new Map<string, LooseRow>();
  for (const award of [...(awardsResult.data || []), ...(providerAwardsResult.data || [])]) {
    const badgeId = String(award.badge_id || "");
    if (badgeId && !awardsByBadge.has(badgeId)) awardsByBadge.set(badgeId, award);
  }

  const badges = (definitions || []).map((badge) => {
    const badgeRules = rulesByBadge.get(String(badge.id || "")) || [];
    const evaluatedRules = badgeRules.map((rule) => {
      const metric = String(rule.metric || "");
      const operator = String(rule.operator || "gte") as BadgeOperator;
      const threshold = Number(rule.threshold || 0);
      const value = Number(metricValues[metric] || 0);
      const complete = compare(value, operator, threshold);

      return {
        id: String(rule.id || `${badge.id}-${metric}`),
        metric,
        label: metricLabels[metric] || metric.replace(/_/g, " "),
        operator,
        threshold,
        value,
        valueLabel: formatMetricValue(metric, value),
        thresholdLabel: formatMetricValue(metric, threshold),
        requirement: ruleCopy(metric, operator, threshold),
        missing: missingForRule(value, operator, threshold),
        progress: Math.round(progressForRule(value, operator, threshold)),
        complete,
      };
    });

    const award = awardsByBadge.get(String(badge.id || ""));
    const rulesComplete = evaluatedRules.length ? evaluatedRules.every((rule) => rule.complete) : Boolean(award);
    const earned = Boolean(award) || rulesComplete;
    const progress = earned
      ? 100
      : evaluatedRules.length
      ? Math.round(evaluatedRules.reduce((sum, rule) => sum + rule.progress, 0) / evaluatedRules.length)
      : 0;

    return {
      id: String(badge.id || ""),
      slug: String(badge.slug || ""),
      name: String(badge.name || "Badge"),
      description: String(badge.description || ""),
      icon: String(badge.icon || "Award"),
      color: String(badge.color || "red"),
      audience: String(badge.audience || role),
      awardType: String(badge.award_type || "automatic"),
      levelPriority: levelPriority(badge),
      earned,
      awardedAt: award?.awarded_at || null,
      awardedReason: award?.awarded_reason || null,
      progress,
      rules: evaluatedRules,
    };
  });

  const earnedBadges = badges.filter((badge) => badge.earned);
  const currentLevel = earnedBadges
    .filter((badge) => badge.levelPriority > 0)
    .sort((a, b) => b.levelPriority - a.levelPriority)[0] || earnedBadges[0] || null;
  const nextBadge = badges
    .filter((badge) => !badge.earned)
    .sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name))[0] || null;

  const highlightedMetrics = metrics.slice(0, 6).map((metric) => ({
    key: metric,
    label: metricLabels[metric] || metric.replace(/_/g, " "),
    value: metricValues[metric] || 0,
    valueLabel: formatMetricValue(metric, metricValues[metric] || 0),
    qualifiesNext: nextBadge ? nextBadge.rules.some((rule: LooseRow) => rule.metric === metric && rule.complete) : false,
  }));

  return NextResponse.json({
    role,
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.first_name || user.email?.split("@")[0] || (role === "provider" ? "Provider" : "Buyer"),
      initial: (user.user_metadata?.first_name?.[0] || user.email?.[0] || "A").toUpperCase(),
    },
    summary: {
      earnedCount: earnedBadges.length,
      totalCount: badges.length,
      progress: badges.length ? Math.round((earnedBadges.length / badges.length) * 100) : 0,
      currentLevelName: currentLevel?.name || (role === "provider" ? "New provider" : "New buyer"),
      nextBadgeName: nextBadge?.name || null,
    },
    metrics: highlightedMetrics,
    badges,
    currentLevel,
    nextBadge,
  });
}
