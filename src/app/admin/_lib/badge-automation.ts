import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getProviderStatsMap } from "@/lib/provider-stats";

type AnyRecord = Record<string, any>;
type BadgeTargetRole = "provider" | "buyer";

type ResolvedBadgeUser = {
  id: string;
  label: string;
  role: BadgeTargetRole;
};

type ManualAwardTarget = BadgeTargetRole | "auto";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const badgeMetricLabels = {
  completed_jobs: "Completed jobs",
  average_rating: "Average rating",
  review_count: "Review count",
  total_earnings: "Total earnings",
  cancelled_jobs: "Cancelled jobs",
  verified_provider: "Verified provider",
  jobs_posted: "Buyer jobs posted",
  hired_jobs: "Buyer hired jobs",
  paid_jobs: "Buyer paid jobs",
  total_spent: "Buyer total spent",
  payment_verified: "Payment verified",
  kyc_verified: "KYC verified",
  account_age_days: "Account age days",
} as const;

export const badgeOperatorLabels = {
  gte: "at least",
  lte: "at most",
  eq: "equals",
} as const;

export const badgeAudienceLabels = {
  provider: "Providers",
  buyer: "Buyers",
  all: "Providers and buyers",
} as const;

export const badgeAwardTypeLabels = {
  automatic: "Rule based",
  manual: "Manual only",
  random: "Random/manual",
  system: "System trust badge",
} as const;

export type BadgeMetric = keyof typeof badgeMetricLabels;
export type BadgeOperator = keyof typeof badgeOperatorLabels;
export type BadgeAudience = keyof typeof badgeAudienceLabels;
export type BadgeAwardType = keyof typeof badgeAwardTypeLabels;

export type BadgeRule = {
  id: string;
  badge_id: string;
  metric: BadgeMetric;
  operator: BadgeOperator;
  threshold: number;
};

export type BadgeDefinition = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  audience: BadgeAudience;
  award_type: BadgeAwardType;
  is_active: boolean;
  is_public: boolean;
  created_at: string | null;
  rules: BadgeRule[];
  awardedCount: number;
};

export type AdminBadgeUser = {
  id: string;
  name: string;
  email: string;
  role: "provider" | "buyer";
  city: string;
};

type ProviderBadgeStats = {
  userId: string;
  role: "provider";
  name: string;
  completed_jobs: number;
  average_rating: number;
  review_count: number;
  total_earnings: number;
  cancelled_jobs: number;
  verified_provider: number;
  kyc_verified: number;
  account_age_days: number;
};

type BuyerStats = {
  userId: string;
  role: "buyer";
  name: string;
  jobs_posted: number;
  hired_jobs: number;
  paid_jobs: number;
  total_spent: number;
  payment_verified: number;
  kyc_verified: number;
  account_age_days: number;
};

function adminClient() {
  return createAdminSupabaseClient() as any;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function count(table: string) {
  try {
    const { count: total, error } = await adminClient().from(table).select("*", { count: "exact", head: true });
    if (error) return 0;
    return total || 0;
  } catch {
    return 0;
  }
}

async function rows(table: string, select = "*", limit = 1000): Promise<AnyRecord[]> {
  const fallback = async () => {
    try {
      const { data, error } = await adminClient().from(table).select(select).limit(limit);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  };

  try {
    const { data, error } = await adminClient().from(table).select(select).order("created_at", { ascending: false }).limit(limit);
    if (error) return fallback();
    return data || [];
  } catch {
    return fallback();
  }
}

async function tableReady(table: string) {
  try {
    const { error } = await adminClient().from(table).select("*").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function badgeSchemaReady() {
  const checks = await Promise.all([
    tableReady("badge_definitions"),
    tableReady("badge_rules"),
    tableReady("provider_badges"),
    tableReady("user_badges"),
  ]);

  return checks.every(Boolean);
}

function compare(value: number, operator: BadgeOperator, threshold: number) {
  if (operator === "gte") return value >= threshold;
  if (operator === "lte") return value <= threshold;
  return value === threshold;
}

function fullName(row: AnyRecord) {
  return [row.first_name, row.last_name].filter(Boolean).map(String).join(" ") || String(row.full_name || row.email || row.id || "User");
}

function normalizeBadgeRole(value: unknown): BadgeTargetRole | null {
  const role = String(value || "").toLowerCase();
  if (["provider", "seller", "tasker", "shift_provider", "contractor", "agency"].includes(role)) return "provider";
  if (["buyer", "client", "customer", "business"].includes(role)) return "buyer";
  return null;
}

function badgeRoleLabel(role: BadgeTargetRole) {
  return role === "provider" ? "provider" : "buyer";
}

function isAdminVerifiedKycStatus(value: unknown) {
  return ["approved", "confirmed", "verified", "manual_override", "manually_verified"].includes(String(value || "").toLowerCase());
}

function badgeAudienceTarget(audience: BadgeAudience): BadgeTargetRole | null {
  return audience === "provider" || audience === "buyer" ? audience : null;
}

function badgeActionRedirect(type: "success" | "error", message: string): never {
  redirect(`/admin/badges?badge_${type}=${encodeURIComponent(message)}`);
}

function actionErrorMessage(error: unknown, fallback = "Badge action failed.") {
  return error instanceof Error && error.message ? error.message : fallback;
}

function ruleLabel(rule: BadgeRule) {
  const threshold = ["verified_provider", "payment_verified", "kyc_verified"].includes(rule.metric)
    ? (rule.threshold >= 1 ? "yes" : "no")
    : String(rule.threshold);
  return `${badgeMetricLabels[rule.metric]} ${badgeOperatorLabels[rule.operator]} ${threshold}`;
}

function levelBadgePriority(badge: { name?: unknown; slug?: unknown }) {
  const label = `${String(badge.name || "")} ${String(badge.slug || "")}`.toLowerCase();
  if (label.includes("top pro") || label.includes("top-pro")) return 100;
  const match = label.match(/level[-\s]*(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function isLevelBadge(badge: { name?: unknown; slug?: unknown }) {
  return levelBadgePriority(badge) > 0;
}

async function removeOtherProviderLevelBadges(userId: string, keepBadgeId: string, levelBadgeIds: string[]) {
  const otherLevelBadgeIds = levelBadgeIds.filter((badgeId) => badgeId && badgeId !== keepBadgeId);
  if (!otherLevelBadgeIds.length) return;

  await adminClient()
    .from("user_badges")
    .delete()
    .eq("user_id", userId)
    .eq("target_role", "provider")
    .in("badge_id", otherLevelBadgeIds);

  await adminClient()
    .from("provider_badges")
    .delete()
    .eq("provider_id", userId)
    .in("badge_id", otherLevelBadgeIds);
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return Boolean(value && typeof value === "object" && "arrayBuffer" in value && "size" in value && Number((value as File).size) > 0);
}

async function uploadBadgeIcon(formData: FormData, fallbackIcon = "Award", required = false) {
  const file = formData.get("icon_file");
  if (!isUploadFile(file)) {
    if (required) throw new Error("Upload a badge icon.");
    return fallbackIcon;
  }

  const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
  if (!allowedTypes.has(file.type)) {
    throw new Error("Badge icon must be a PNG, JPG, WebP, or GIF image.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Badge icon must be under 2MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "anyjob/badge-icons",
    resource_type: "image",
    transformation: [{ width: 256, height: 256, crop: "fit" }],
  });

  return result.secure_url || fallbackIcon;
}

function parseRuleRows(formData: FormData, badgeId: string) {
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

  return ruleRows;
}

function daysBetween(value?: string | null) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
}

async function getProviderStats(): Promise<ProviderBadgeStats[]> {
  const [profiles, sellers, bookings] = await Promise.all([
    rows("eloo_profiles", "id,role,email,first_name,last_name,full_name,city,is_verified,created_at", 1000),
    rows("sellers", "id,email,first_name,last_name,city,status,rating,total_jobs,created_at", 1000),
    rows("eloo_bookings", "id,provider_id,total_price,status,created_at", 2000),
  ]);

  const providers = new Map<string, AnyRecord>();
  for (const profile of profiles) {
    if (profile.role === "provider") providers.set(String(profile.id), profile);
  }
  for (const seller of sellers) {
    providers.set(String(seller.id), { ...(providers.get(String(seller.id)) || {}), ...seller, role: "provider" });
  }

  const realStats = await getProviderStatsMap(adminClient(), Array.from(providers.keys()));
  const stats = new Map<string, ProviderBadgeStats>();
  for (const [userId, row] of providers.entries()) {
    const sellerStatus = String(row.status || "").toLowerCase();
    const providerStats = realStats.get(userId);
    stats.set(userId, {
      userId,
      role: "provider",
      name: fullName(row),
      completed_jobs: providerStats?.completedJobs || 0,
      average_rating: providerStats?.rating || 0,
      review_count: providerStats?.reviewCount || 0,
      total_earnings: 0,
      cancelled_jobs: 0,
      verified_provider: row.is_verified === true || sellerStatus === "approved" ? 1 : 0,
      kyc_verified: row.is_verified === true || sellerStatus === "approved" ? 1 : 0,
      account_age_days: daysBetween(String(row.created_at || "")),
    });
  }

  for (const booking of bookings) {
    const providerId = String(booking.provider_id || "");
    const current = stats.get(providerId);
    if (!current) continue;
    const status = String(booking.status || "").toLowerCase();
    if (status === "completed" || status === "reviewed") {
      current.total_earnings += Number(booking.total_price || 0);
    }
    if (status === "cancelled") current.cancelled_jobs += 1;
  }

  return Array.from(stats.values());
}

async function getBuyerStats(): Promise<BuyerStats[]> {
  const [profiles, buyers, inquiries, bookings, userBadges, badgeDefinitions] = await Promise.all([
    rows("eloo_profiles", "id,role,email,first_name,last_name,full_name,city,is_verified,created_at", 1000),
    rows("buyers", "id,email,first_name,last_name,city,kyc_status,created_at", 1000),
    rows("service_inquiries", "id,user_id,status,created_at", 3000),
    rows("eloo_bookings", "id,client_id,total_price,status,is_paid,created_at", 3000),
    rows("user_badges", "user_id,badge_id,target_role", 3000),
    rows("badge_definitions", "id,slug,name", 1000),
  ]);

  const buyerRows = new Map<string, AnyRecord>();
  for (const profile of profiles) {
    if (profile.role !== "provider" && profile.role !== "admin") buyerRows.set(String(profile.id), profile);
  }
  for (const buyer of buyers) {
    buyerRows.set(String(buyer.id), { ...(buyerRows.get(String(buyer.id)) || {}), ...buyer, role: "buyer" });
  }

  const stats = new Map<string, BuyerStats>();
  for (const [userId, row] of buyerRows.entries()) {
    const kycApproved = row.is_verified === true || isAdminVerifiedKycStatus(row.kyc_status);
    stats.set(userId, {
      userId,
      role: "buyer",
      name: fullName(row),
      jobs_posted: 0,
      hired_jobs: 0,
      paid_jobs: 0,
      total_spent: 0,
      payment_verified: 0,
      kyc_verified: kycApproved ? 1 : 0,
      account_age_days: daysBetween(String(row.created_at || "")),
    });
  }

  const hiredStatuses = new Set(["accepted", "bid_accepted", "confirmed", "in_progress", "completed", "converted"]);
  for (const inquiry of inquiries) {
    const buyerId = String(inquiry.user_id || "");
    const current = stats.get(buyerId);
    if (!current) continue;
    current.jobs_posted += 1;
    if (hiredStatuses.has(String(inquiry.status || "").toLowerCase())) current.hired_jobs += 1;
  }

  const paidStatuses = new Set(["confirmed", "in_progress", "completed", "reviewed"]);
  for (const booking of bookings) {
    const buyerId = String(booking.client_id || "");
    const current = stats.get(buyerId);
    if (!current) continue;
    const paid = booking.is_paid === true || paidStatuses.has(String(booking.status || "").toLowerCase());
    if (!paid) continue;
    current.paid_jobs += 1;
    current.hired_jobs = Math.max(current.hired_jobs, current.paid_jobs);
    current.total_spent += Number(booking.total_price || 0);
  }

  const hiredBeforeBadgeIds = new Set(
    badgeDefinitions
      .filter((badge) => badge.slug === "hired-before" || String(badge.name || "").toLowerCase() === "hired before")
      .map((badge) => String(badge.id))
  );

  for (const award of userBadges) {
    if (award.target_role !== "buyer" || !hiredBeforeBadgeIds.has(String(award.badge_id))) continue;
    const current = stats.get(String(award.user_id || ""));
    if (current) current.hired_jobs = Math.max(current.hired_jobs, 1);
  }

  for (const current of stats.values()) {
    current.payment_verified = current.paid_jobs > 0 || current.hired_jobs > 0 ? 1 : 0;
  }

  return Array.from(stats.values());
}

function metricValue(stat: ProviderBadgeStats | BuyerStats, metric: BadgeMetric) {
  return Number((stat as AnyRecord)[metric] || 0);
}

async function insertAwards(inserts: AnyRecord[], providerInserts: AnyRecord[]) {
  if (inserts.length) {
    await adminClient().from("user_badges").upsert(inserts, {
      onConflict: "user_id,badge_id,target_role",
      ignoreDuplicates: true,
    });
  }
  if (providerInserts.length) {
    await adminClient().from("provider_badges").upsert(providerInserts, {
      onConflict: "provider_id,badge_id",
      ignoreDuplicates: true,
    });
  }
}

export async function syncAutomaticBadges() {
  const [definitions, rules, userAwards, providerAwards, providerStats, buyerStats] = await Promise.all([
    rows("badge_definitions", "id,slug,name,audience,award_type,is_active", 1000),
    rows("badge_rules", "id,badge_id,metric,operator,threshold,created_at", 2000),
    rows("user_badges", "id,user_id,badge_id,target_role,source", 5000),
    rows("provider_badges", "id,provider_id,badge_id", 5000),
    getProviderStats(),
    getBuyerStats(),
  ]);

  const activeBadges = definitions.filter((badge) => badge.is_active !== false && ["automatic", "system"].includes(String(badge.award_type || "automatic")));
  const levelBadgeIds = definitions.filter(isLevelBadge).map((badge) => String(badge.id || "")).filter(Boolean);
  const badgesById = new Map(definitions.map((badge) => [String(badge.id || ""), badge]));
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

  const existingUser = new Set(userAwards.map((award) => `${award.user_id}:${award.badge_id}:${award.target_role}`));
  const existingProvider = new Set(providerAwards.map((award) => `${award.provider_id}:${award.badge_id}`));
  const inserts: AnyRecord[] = [];
  const providerInserts: AnyRecord[] = [];
  const ruleAwardIdsToDelete: string[] = [];
  const providerMirrorDeletes = new Set<string>();
  const providerLevelWinners = new Map<string, { badgeId: string; priority: number }>();
  const existingProviderLevelWinners = new Map<string, { badgeId: string; priority: number }>();

  for (const award of userAwards) {
    if (String(award.target_role || "") !== "provider") continue;
    const badge = badgesById.get(String(award.badge_id || ""));
    if (!badge || !isLevelBadge(badge)) continue;
    const priority = levelBadgePriority(badge);
    const userId = String(award.user_id || "");
    const current = existingProviderLevelWinners.get(userId);
    if (!current || priority > current.priority) {
      existingProviderLevelWinners.set(userId, { badgeId: String(award.badge_id || ""), priority });
    }
  }

  for (const badge of activeBadges.filter(isLevelBadge)) {
    const badgeId = String(badge.id || "");
    const badgeRules = rulesByBadge.get(badgeId) || [];
    if (!badgeId || !badgeRules.length) continue;
    const priority = levelBadgePriority(badge);

    for (const stat of providerStats) {
      const qualifies = badgeRules.every((rule) => compare(metricValue(stat, rule.metric), rule.operator, rule.threshold));
      if (!qualifies) continue;
      const existingWinner = existingProviderLevelWinners.get(stat.userId);
      if (existingWinner && existingWinner.priority > priority) continue;
      const current = providerLevelWinners.get(stat.userId);
      if (!current || priority > current.priority) {
        providerLevelWinners.set(stat.userId, { badgeId, priority });
      }
    }
  }

  for (const [userId, existingWinner] of existingProviderLevelWinners.entries()) {
    const automaticWinner = providerLevelWinners.get(userId);
    if (!automaticWinner || existingWinner.priority > automaticWinner.priority) {
      providerLevelWinners.set(userId, existingWinner);
    }
  }

  for (const badge of activeBadges) {
    const badgeId = String(badge.id || "");
    const audience = String(badge.audience || "provider") as BadgeAudience;
    const badgeRules = rulesByBadge.get(badgeId) || [];
    if (!badgeRules.length) continue;

    const candidateStats: Array<ProviderBadgeStats | BuyerStats> = [
      ...(audience === "provider" || audience === "all" ? providerStats : []),
      ...(audience === "buyer" || audience === "all" ? buyerStats : []),
    ];
    const qualifyingKeys = new Set<string>();

    for (const stat of candidateStats) {
      const qualifies = badgeRules.every((rule) => compare(metricValue(stat, rule.metric), rule.operator, rule.threshold));
      const key = `${stat.userId}:${badgeId}:${stat.role}`;
      const blockedByHigherLevel =
        stat.role === "provider" &&
        isLevelBadge(badge) &&
        providerLevelWinners.get(stat.userId)?.badgeId !== badgeId;
      const shouldAward = qualifies && !blockedByHigherLevel;
      if (shouldAward) qualifyingKeys.add(key);
      if (!shouldAward || existingUser.has(key)) continue;

      const reason = badgeRules.map(ruleLabel).join("; ");
      inserts.push({
        user_id: stat.userId,
        badge_id: badgeId,
        target_role: stat.role,
        award_type: badge.award_type || "automatic",
        awarded_reason: reason,
        source: "rule",
        metadata: { synced_by: "admin_badges" },
      });
      existingUser.add(key);

      if (stat.role === "provider") {
        const providerKey = `${stat.userId}:${badgeId}`;
        if (!existingProvider.has(providerKey)) {
          providerInserts.push({
            provider_id: stat.userId,
            badge_id: badgeId,
            awarded_reason: reason,
          });
          existingProvider.add(providerKey);
        }
      }
    }

    for (const award of userAwards) {
      if (String(award.badge_id || "") !== badgeId || String(award.source || "") !== "rule") continue;
      const targetRole = String(award.target_role || "provider");
      const key = `${award.user_id}:${badgeId}:${targetRole}`;
      if (qualifyingKeys.has(key)) continue;
      const awardId = String(award.id || "");
      if (awardId) ruleAwardIdsToDelete.push(awardId);
      if (targetRole === "provider") providerMirrorDeletes.add(`${award.user_id}:${badgeId}`);
    }
  }

  await insertAwards(inserts, providerInserts);
  if (ruleAwardIdsToDelete.length) {
    await adminClient().from("user_badges").delete().in("id", ruleAwardIdsToDelete);
  }
  for (const key of providerMirrorDeletes) {
    const [providerId, badgeId] = key.split(":");
    if (!providerId || !badgeId) continue;
    await adminClient().from("provider_badges").delete().eq("provider_id", providerId).eq("badge_id", badgeId);
  }
  for (const [providerId, winner] of providerLevelWinners.entries()) {
    await removeOtherProviderLevelBadges(providerId, winner.badgeId, levelBadgeIds);
  }
  return inserts.length;
}

export async function getAdminBadges() {
  const [schemaReady, definitions, rules, userAwards, providerAwards, providerCount, buyerCount, providers, buyers] = await Promise.all([
    badgeSchemaReady(),
    rows("badge_definitions", "id,slug,name,description,icon,color,audience,award_type,is_active,is_public,created_at,sort_order", 1000),
    rows("badge_rules", "id,badge_id,metric,operator,threshold,created_at", 3000),
    rows("user_badges", "id,user_id,badge_id,target_role,award_type,awarded_reason,awarded_at", 5000),
    rows("provider_badges", "id,provider_id,badge_id", 5000),
    count("sellers"),
    count("buyers"),
    getProviderStats(),
    getBuyerStats(),
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

  const uniqueAwards = new Set<string>();
  const awardsByBadge = new Map<string, number>();

  for (const award of userAwards) {
    const badgeId = String(award.badge_id || "");
    const key = `${award.user_id}:${badgeId}:${award.target_role || "provider"}`;
    if (!badgeId || uniqueAwards.has(key)) continue;
    uniqueAwards.add(key);
    awardsByBadge.set(badgeId, (awardsByBadge.get(badgeId) || 0) + 1);
  }

  for (const award of providerAwards) {
    const badgeId = String(award.badge_id || "");
    const key = `${award.provider_id}:${badgeId}:provider`;
    if (!badgeId || uniqueAwards.has(key)) continue;
    uniqueAwards.add(key);
    awardsByBadge.set(badgeId, (awardsByBadge.get(badgeId) || 0) + 1);
  }

  const badges = definitions
    .map((row) => {
      const id = String(row.id || "");
      return {
        id,
        slug: String(row.slug || ""),
        name: String(row.name || "Untitled badge"),
        description: String(row.description || ""),
        icon: String(row.icon || "Award"),
        color: String(row.color || "red"),
        audience: String(row.audience || "provider") as BadgeAudience,
        award_type: String(row.award_type || "automatic") as BadgeAwardType,
        is_active: row.is_active !== false,
        is_public: row.is_public !== false,
        created_at: String(row.created_at || ""),
        rules: rulesByBadge.get(id) || [],
        awardedCount: awardsByBadge.get(id) || 0,
      } satisfies BadgeDefinition;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const providerUsers: AdminBadgeUser[] = providers.slice(0, 100).map((provider) => ({
    id: provider.userId,
    name: provider.name,
    email: "",
    role: "provider",
    city: "",
  }));
  const buyerUsers: AdminBadgeUser[] = buyers.slice(0, 100).map((buyer) => ({
    id: buyer.userId,
    name: buyer.name,
    email: "",
    role: "buyer",
    city: "",
  }));

  return {
    schemaReady,
    badges,
    providerCount,
    buyerCount,
    totalAwards: uniqueAwards.size,
    providerUsers,
    buyerUsers,
  };
}

export async function createBadgeDefinition(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const icon = await uploadBadgeIcon(formData, "Award", true);
  const color = "slate";
  const audience = String(formData.get("audience") || "provider") as BadgeAudience;
  const awardType = String(formData.get("award_type") || "automatic") as BadgeAwardType;
  const isActive = formData.get("is_active") === "on";
  const isPublic = formData.get("is_public") === "on";

  if (!name) {
    throw new Error("Badge name is required.");
  }

  const slug = `${slugify(name)}-${Date.now().toString(36)}`;
  const { data, error } = await adminClient()
    .from("badge_definitions")
    .insert({ slug, name, description, icon, color, audience, award_type: awardType, is_active: isActive, is_public: isPublic })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "Could not create badge.");
  }

  const badgeId = String(data.id);
  const ruleRows = parseRuleRows(formData, badgeId);

  if (ruleRows.length) {
    await adminClient().from("badge_rules").insert(ruleRows);
  }

  await syncAutomaticBadges();
  revalidatePath("/admin/badges");
  revalidatePath("/pro/badges");
  revalidatePath("/tasks");
  revalidatePath("/pro/jobs");
}

async function rebuildProviderBadgeMirrorForBadge(badgeId: string) {
  const { data: providerAwards } = await adminClient()
    .from("user_badges")
    .select("user_id,badge_id,awarded_reason")
    .eq("badge_id", badgeId)
    .eq("target_role", "provider");

  await adminClient().from("provider_badges").delete().eq("badge_id", badgeId);

  const rowsToInsert = (providerAwards || []).map((award: AnyRecord) => ({
    provider_id: award.user_id,
    badge_id: award.badge_id,
    awarded_reason: award.awarded_reason || "Badge award",
  }));

  if (rowsToInsert.length) {
    await adminClient().from("provider_badges").upsert(rowsToInsert, {
      onConflict: "provider_id,badge_id",
      ignoreDuplicates: true,
    });
  }
}

export async function updateBadgeDefinition(formData: FormData) {
  "use server";

  const badgeId = String(formData.get("badge_id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const currentIcon = String(formData.get("current_icon") || "Award");
  const icon = await uploadBadgeIcon(formData, currentIcon);
  const audience = String(formData.get("audience") || "provider") as BadgeAudience;
  const awardType = String(formData.get("award_type") || "automatic") as BadgeAwardType;
  const isActive = formData.get("is_active") === "on";
  const isPublic = formData.get("is_public") === "on";

  if (!badgeId) throw new Error("Badge is required.");
  if (!name) throw new Error("Badge name is required.");

  const { error: updateError } = await adminClient()
    .from("badge_definitions")
    .update({ name, description, icon, audience, award_type: awardType, is_active: isActive, is_public: isPublic })
    .eq("id", badgeId);

  if (updateError) throw new Error(updateError.message);

  const { error: deleteRulesError } = await adminClient().from("badge_rules").delete().eq("badge_id", badgeId);
  if (deleteRulesError) throw new Error(deleteRulesError.message);

  const ruleRows = parseRuleRows(formData, badgeId);
  if (ruleRows.length) {
    const { error: insertRulesError } = await adminClient().from("badge_rules").insert(ruleRows);
    if (insertRulesError) throw new Error(insertRulesError.message);
  }

  await adminClient().from("user_badges").delete().eq("badge_id", badgeId).eq("source", "rule");
  await syncAutomaticBadges();
  await rebuildProviderBadgeMirrorForBadge(badgeId);

  revalidatePath("/admin/badges");
  revalidatePath("/pro/badges");
  revalidatePath("/tasks");
  revalidatePath("/pro/jobs");
}

async function resolveUser(targetRole: ManualAwardTarget, query: string, badgeAudience: BadgeAudience = "all"): Promise<ResolvedBadgeUser> {
  const value = query.trim();
  if (!value) throw new Error("User email or id is required.");
  const audienceTarget = badgeAudienceTarget(badgeAudience);
  const effectiveTarget = targetRole === "auto" ? audienceTarget : targetRole;

  const lookups: Array<{ table: string; select: string; assumedRole?: BadgeTargetRole }> = [
    { table: "sellers", select: "id,email,first_name,last_name,city", assumedRole: "provider" },
    { table: "buyers", select: "id,email,first_name,last_name,city", assumedRole: "buyer" },
    { table: "eloo_profiles", select: "id,email,first_name,last_name,role,city" },
    { table: "user_profiles", select: "id,email,full_name,role" },
  ];

  const matches: ResolvedBadgeUser[] = [];
  for (const lookup of lookups) {
    let request = adminClient().from(lookup.table).select(lookup.select).limit(1);
    request = isUuid(value) ? request.eq("id", value) : request.eq("email", value.toLowerCase());
    const { data, error } = await request;
    if (error || !data?.length) continue;

    const row = data[0];
    const role = lookup.assumedRole || normalizeBadgeRole(row.role);
    if (!role) continue;
    matches.push({ id: String(row.id), label: fullName(row), role });
    if (!effectiveTarget || role === effectiveTarget) return { id: String(row.id), label: fullName(row), role };
  }

  if (matches.length) {
    const actualRole = matches[0].role;
    const wantedRole = effectiveTarget || "matching";
    throw new Error(
      `That account is a ${badgeRoleLabel(actualRole)}, not a ${wantedRole === "matching" ? "matching" : badgeRoleLabel(wantedRole)} account for this badge. Change "Award to" or choose a matching account.`
    );
  }

  throw new Error(`Could not find an AnyJob account for '${value}'. Check the email/user ID or choose an account that has completed registration.`);
}

async function mirrorProviderBadge(userId: string, badgeId: string, reason: string) {
  await adminClient().from("provider_badges").upsert(
    { provider_id: userId, badge_id: badgeId, awarded_reason: reason },
    { onConflict: "provider_id,badge_id", ignoreDuplicates: true }
  );
}

async function assertBadgeFitsTarget(badgeId: string, targetRole: "provider" | "buyer") {
  const { data, error } = await adminClient()
    .from("badge_definitions")
    .select("id,slug,name,audience,is_active")
    .eq("id", badgeId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Badge could not be found.");
  }

  if (data.is_active === false) {
    throw new Error(`'${data.name}' is inactive. Activate it before awarding it.`);
  }

  const audience = String(data.audience || "provider");
  if (audience !== "all" && audience !== targetRole) {
    throw new Error(`'${data.name}' is a ${audience} badge and cannot be awarded to a ${targetRole}.`);
  }

  return { name: String(data.name || "Badge"), slug: String(data.slug || ""), audience };
}

async function getAwardableBadge(badgeId: string) {
  const { data, error } = await adminClient()
    .from("badge_definitions")
    .select("id,slug,name,audience,is_active")
    .eq("id", badgeId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Badge could not be found.");
  }

  if (data.is_active === false) {
    throw new Error(`'${data.name}' is inactive. Activate it before awarding it.`);
  }

  return {
    id: String(data.id),
    slug: String(data.slug || ""),
    name: String(data.name || "Badge"),
    audience: String(data.audience || "provider") as BadgeAudience,
  };
}

async function getLevelBadgeIds() {
  const { data } = await adminClient()
    .from("badge_definitions")
    .select("id,slug,name");

  return (data || [])
    .filter(isLevelBadge)
    .map((badge: AnyRecord) => String(badge.id || ""))
    .filter(Boolean);
}

export async function awardBadgeToUser(formData: FormData) {
  "use server";

  let feedback: { type: "success" | "error"; message: string };
  try {
    const badgeId = String(formData.get("badge_id") || "").trim();
    const requestedRole = normalizeBadgeRole(formData.get("target_role"));
    const userQuery = String(formData.get("user_query") || "").trim();
    const awardType = String(formData.get("award_type") || "manual") as BadgeAwardType;
    const reason = String(formData.get("reason") || "").trim() || "Manual admin award";

    if (!badgeId) throw new Error("Badge is required.");
    const badge = await getAwardableBadge(badgeId);
    const lookupRole: ManualAwardTarget = requestedRole || "auto";
    const user = await resolveUser(lookupRole, userQuery, badge.audience);
    const targetRole = requestedRole || badgeAudienceTarget(badge.audience) || user.role;

    if (badge.audience !== "all" && badge.audience !== targetRole) {
      throw new Error(`'${badge.name}' is a ${badge.audience} badge and cannot be awarded to a ${targetRole}.`);
    }

    const { data, error } = await adminClient()
      .from("user_badges")
      .upsert(
        {
          user_id: user.id,
          badge_id: badgeId,
          target_role: targetRole,
          award_type: awardType === "random" ? "random" : "manual",
          awarded_reason: reason,
          source: "admin",
          metadata: { awarded_from: "admin_badges" },
        },
        { onConflict: "user_id,badge_id,target_role", ignoreDuplicates: true }
      )
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (targetRole === "provider") {
      if (isLevelBadge(badge)) {
        await removeOtherProviderLevelBadges(user.id, badgeId, await getLevelBadgeIds());
      }
      await mirrorProviderBadge(user.id, badgeId, reason);
    }

    await adminClient().from("badge_award_events").insert({
      user_badge_id: data?.id || null,
      user_id: user.id,
      badge_id: badgeId,
      target_role: targetRole,
      event_type: "awarded",
      reason,
      metadata: { source: "manual", user_label: user.label },
    });

    revalidatePath("/admin/badges");
    revalidatePath("/tasks");
    revalidatePath("/pro/jobs");
    feedback = { type: "success", message: `Awarded badge to ${user.label}.` };
  } catch (error) {
    feedback = { type: "error", message: actionErrorMessage(error, "Could not award badge.") };
  }

  badgeActionRedirect(feedback.type, feedback.message);
}

export async function awardBadgeRandomly(formData: FormData) {
  "use server";

  const badgeId = String(formData.get("random_badge_id") || "").trim();
  const targetRole = String(formData.get("random_target_role") || "provider") as "provider" | "buyer";
  const reason = String(formData.get("random_reason") || "").trim() || "Random admin award";
  if (!badgeId) throw new Error("Badge is required.");
  const badge = await assertBadgeFitsTarget(badgeId, targetRole);

  const stats = targetRole === "provider" ? await getProviderStats() : await getBuyerStats();
  const { data: existing } = await adminClient()
    .from("user_badges")
    .select("user_id")
    .eq("badge_id", badgeId)
    .eq("target_role", targetRole);
  const alreadyAwarded = new Set((existing || []).map((row: AnyRecord) => String(row.user_id)));
  const candidates = stats.filter((stat) => !alreadyAwarded.has(stat.userId));
  if (!candidates.length) throw new Error(`No eligible ${targetRole}s without this badge.`);

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  await adminClient().from("user_badges").upsert(
    {
      user_id: selected.userId,
      badge_id: badgeId,
      target_role: targetRole,
      award_type: "random",
      awarded_reason: reason,
      source: "admin_random",
      metadata: { selected_from: candidates.length },
    },
    { onConflict: "user_id,badge_id,target_role", ignoreDuplicates: true }
  );

  if (targetRole === "provider") {
    if (isLevelBadge(badge)) {
      await removeOtherProviderLevelBadges(selected.userId, badgeId, await getLevelBadgeIds());
    }
    await mirrorProviderBadge(selected.userId, badgeId, reason);
  }

  await adminClient().from("badge_award_events").insert({
    user_id: selected.userId,
    badge_id: badgeId,
    target_role: targetRole,
    event_type: "awarded",
    reason,
    metadata: { source: "random", selected_name: selected.name, selected_from: candidates.length },
  });

  revalidatePath("/admin/badges");
  revalidatePath("/tasks");
  revalidatePath("/pro/jobs");
}

export async function runBadgeSyncAction() {
  "use server";
  await syncAutomaticBadges();
  revalidatePath("/admin/badges");
  revalidatePath("/tasks");
  revalidatePath("/pro/jobs");
}
