import "server-only";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AnyRecord = Record<string, unknown>;

export const badgeMetricLabels = {
  completed_jobs: "Completed jobs",
  average_rating: "Average rating",
  review_count: "Review count",
  total_earnings: "Total earnings",
  cancelled_jobs: "Cancelled jobs",
  verified_provider: "Verified provider",
} as const;

export const badgeOperatorLabels = {
  gte: "at least",
  lte: "at most",
  eq: "equals",
} as const;

export const badgeIconOptions = ["Award", "Star", "ShieldCheck", "TrendingUp", "Zap", "ThumbsUp", "Crown", "CheckCircle"] as const;
export const badgeColorOptions = ["red", "blue", "emerald", "amber", "purple", "slate"] as const;

export type BadgeMetric = keyof typeof badgeMetricLabels;
export type BadgeOperator = keyof typeof badgeOperatorLabels;

export type BadgeRule = {
  id: string;
  badge_id: string;
  metric: BadgeMetric;
  operator: BadgeOperator;
  threshold: number;
};

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string | null;
  rules: BadgeRule[];
  awardedCount: number;
};

type ProviderStats = {
  providerId: string;
  completed_jobs: number;
  average_rating: number;
  review_count: number;
  total_earnings: number;
  cancelled_jobs: number;
  verified_provider: number;
};

function adminClient() {
  return createAdminSupabaseClient() as never as {
    from: (name: string) => {
      select: (columns?: string) => {
        order: (column: string, options?: { ascending?: boolean }) => {
          limit: (count: number) => Promise<{ data: AnyRecord[] | null; error: { message: string } | null }>;
        };
        limit: (count: number) => Promise<{ data: AnyRecord[] | null; error: { message: string } | null }>;
      };
      insert: (values: AnyRecord | AnyRecord[]) => {
        select: (columns?: string) => {
          single: () => Promise<{ data: AnyRecord | null; error: { message: string } | null }>;
        };
      };
      upsert: (values: AnyRecord | AnyRecord[], options?: { onConflict?: string; ignoreDuplicates?: boolean }) => Promise<{ error: { message: string } | null }>;
    };
  };
}

async function count(table: string) {
  const supabase = createAdminSupabaseClient() as never as {
    from: (name: string) => {
      select: (columns: string, options: { count: "exact"; head: true }) => Promise<{ count: number | null; error: unknown }>;
    };
  };

  try {
    const { count: total, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) return 0;
    return total || 0;
  } catch {
    return 0;
  }
}

async function rows(table: string, select = "*", limit = 1000) {
  try {
    const { data, error } = await adminClient().from(table).select(select).order("created_at", { ascending: false }).limit(limit);
    if (error) return [];
    return data || [];
  } catch {
    try {
      const { data, error } = await adminClient().from(table).select(select).limit(limit);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }
}

function compare(value: number, operator: BadgeOperator, threshold: number) {
  if (operator === "gte") return value >= threshold;
  if (operator === "lte") return value <= threshold;
  return value === threshold;
}

function fullName(row: AnyRecord) {
  return [row.first_name, row.last_name].filter(Boolean).map(String).join(" ") || String(row.full_name || row.email || row.id || "Provider");
}

function ruleLabel(rule: BadgeRule) {
  const threshold = rule.metric === "verified_provider" ? (rule.threshold >= 1 ? "yes" : "no") : String(rule.threshold);
  return `${badgeMetricLabels[rule.metric]} ${badgeOperatorLabels[rule.operator]} ${threshold}`;
}

async function getProviderStats(): Promise<Array<ProviderStats & { name: string }>> {
  const [profiles, sellers, bookings, reviews] = await Promise.all([
    rows("eloo_profiles"),
    rows("sellers"),
    rows("eloo_bookings"),
    rows("eloo_reviews"),
  ]);

  const providers = new Map<string, AnyRecord>();
  for (const profile of profiles) {
    if (profile.role === "provider") providers.set(String(profile.id), profile);
  }
  for (const seller of sellers) {
    providers.set(String(seller.id), { ...(providers.get(String(seller.id)) || {}), ...seller, role: "provider" });
  }

  const stats = new Map<string, ProviderStats>();
  for (const [providerId, row] of providers.entries()) {
    const sellerStatus = String(row.status || "").toLowerCase();
    stats.set(providerId, {
      providerId,
      completed_jobs: Number(row.total_jobs || 0),
      average_rating: Number(row.rating || 0),
      review_count: 0,
      total_earnings: 0,
      cancelled_jobs: 0,
      verified_provider: row.is_verified === true || sellerStatus === "approved" ? 1 : 0,
    });
  }

  for (const booking of bookings) {
    const providerId = String(booking.provider_id || "");
    const current = stats.get(providerId);
    if (!current) continue;
    const status = String(booking.status || "").toLowerCase();
    if (status === "completed" || status === "reviewed") {
      current.completed_jobs += 1;
      current.total_earnings += Number(booking.total_price || 0);
    }
    if (status === "cancelled") current.cancelled_jobs += 1;
  }

  const ratingValues = new Map<string, number[]>();
  for (const review of reviews) {
    const providerId = String(review.reviewee_id || "");
    const current = stats.get(providerId);
    if (!current) continue;
    const rating = Number(review.rating || 0);
    if (!rating) continue;
    ratingValues.set(providerId, [...(ratingValues.get(providerId) || []), rating]);
  }

  for (const [providerId, values] of ratingValues.entries()) {
    const current = stats.get(providerId);
    if (!current) continue;
    current.review_count = values.length;
    current.average_rating = values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  return Array.from(stats.values()).map((stat) => ({
    ...stat,
    name: fullName(providers.get(stat.providerId) || {}),
  }));
}

export async function syncAutomaticBadges() {
  const [definitions, rules, awards, providerStats] = await Promise.all([
    rows("badge_definitions"),
    rows("badge_rules"),
    rows("provider_badges"),
    getProviderStats(),
  ]);

  const activeBadges = definitions.filter((badge) => badge.is_active !== false);
  const rulesByBadge = new Map<string, BadgeRule[]>();
  for (const row of rules) {
    const badgeId = String(row.badge_id || "");
    if (!badgeId) continue;
    rulesByBadge.set(badgeId, [
      ...(rulesByBadge.get(badgeId) || []),
      {
        id: String(row.id || ""),
        badge_id: badgeId,
        metric: String(row.metric || "completed_jobs") as BadgeMetric,
        operator: String(row.operator || "gte") as BadgeOperator,
        threshold: Number(row.threshold || 0),
      },
    ]);
  }

  const existing = new Set(awards.map((award) => `${award.provider_id}:${award.badge_id}`));
  const inserts: AnyRecord[] = [];

  for (const badge of activeBadges) {
    const badgeId = String(badge.id || "");
    const badgeRules = rulesByBadge.get(badgeId) || [];
    if (!badgeRules.length) continue;

    for (const provider of providerStats) {
      const qualifies = badgeRules.every((rule) => compare(provider[rule.metric], rule.operator, rule.threshold));
      const key = `${provider.providerId}:${badgeId}`;
      if (!qualifies || existing.has(key)) continue;

      inserts.push({
        provider_id: provider.providerId,
        badge_id: badgeId,
        awarded_reason: badgeRules.map(ruleLabel).join("; "),
      });
      existing.add(key);
    }
  }

  if (inserts.length) {
    await adminClient().from("provider_badges").upsert(inserts, {
      onConflict: "provider_id,badge_id",
      ignoreDuplicates: true,
    });
  }

  return inserts.length;
}

export async function getAdminBadges() {
  const [definitions, rules, awards, providerCount] = await Promise.all([
    rows("badge_definitions", "id,name,description,icon,color,is_active,created_at", 100),
    rows("badge_rules", "id,badge_id,metric,operator,threshold,created_at", 300),
    rows("provider_badges", "id,badge_id,created_at", 500),
    count("sellers"),
  ]);

  const rulesByBadge = new Map<string, BadgeRule[]>();
  for (const row of rules) {
    const badgeId = String(row.badge_id || "");
    rulesByBadge.set(badgeId, [
      ...(rulesByBadge.get(badgeId) || []),
      {
        id: String(row.id || ""),
        badge_id: badgeId,
        metric: String(row.metric || "completed_jobs") as BadgeMetric,
        operator: String(row.operator || "gte") as BadgeOperator,
        threshold: Number(row.threshold || 0),
      },
    ]);
  }

  const awardsByBadge = new Map<string, number>();
  for (const award of awards) {
    const badgeId = String(award.badge_id || "");
    awardsByBadge.set(badgeId, (awardsByBadge.get(badgeId) || 0) + 1);
  }

  const badges = definitions.map((row) => {
    const id = String(row.id || "");
    return {
      id,
      name: String(row.name || "Untitled badge"),
      description: String(row.description || ""),
      icon: String(row.icon || "Award"),
      color: String(row.color || "red"),
      is_active: row.is_active !== false,
      created_at: String(row.created_at || ""),
      rules: rulesByBadge.get(id) || [],
      awardedCount: awardsByBadge.get(id) || 0,
    } satisfies BadgeDefinition;
  });

  return {
    badges,
    providerCount,
    totalAwards: awards.length,
  };
}

export async function createBadgeDefinition(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const icon = String(formData.get("icon") || "Award");
  const color = String(formData.get("color") || "red");
  const isActive = formData.get("is_active") === "on";

  if (!name) {
    throw new Error("Badge name is required.");
  }

  const { data, error } = await adminClient()
    .from("badge_definitions")
    .insert({ name, description, icon, color, is_active: isActive })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "Could not create badge.");
  }

  const badgeId = String(data.id);
  const ruleRows: AnyRecord[] = [];

  for (const slot of ["1", "2", "3"]) {
    const metric = String(formData.get(`metric_${slot}`) || "");
    const operator = String(formData.get(`operator_${slot}`) || "gte");
    const thresholdRaw = String(formData.get(`threshold_${slot}`) || "").trim();
    if (!metric || !thresholdRaw) continue;

    ruleRows.push({
      badge_id: badgeId,
      metric,
      operator,
      threshold: Number(thresholdRaw),
    });
  }

  if (ruleRows.length) {
    await adminClient().from("badge_rules").upsert(ruleRows);
  }

  await syncAutomaticBadges();
  revalidatePath("/admin/badges");
  revalidatePath("/pro/badges");
}
