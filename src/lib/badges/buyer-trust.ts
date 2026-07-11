import "server-only";

type AnyRecord = Record<string, any>;

export type TrustBadgeTone = "green" | "blue" | "amber" | "purple" | "slate" | "red";

export type BuyerTrustBadge = {
  label: string;
  tone: TrustBadgeTone;
  source: "system" | "admin" | "rule";
};

export type BuyerTrustSummary = {
  jobsPosted: number;
  hires: number;
  hireRate: number;
  paidJobs: number;
  totalSpent: number;
  totalSpentLabel: string;
  paymentStatus: "verified" | "unverified";
  isNewClient: boolean;
  kycVerified: boolean;
  badges: BuyerTrustBadge[];
};

const hiredStatuses = new Set(["accepted", "bid_accepted", "confirmed", "in_progress", "completed", "converted"]);
const paidStatuses = new Set(["confirmed", "in_progress", "completed", "reviewed"]);

function money(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function badgeTone(color?: string | null): TrustBadgeTone {
  if (color === "emerald") return "green";
  if (color === "red") return "red";
  if (color === "blue") return "blue";
  if (color === "amber") return "amber";
  if (color === "purple") return "purple";
  return "slate";
}

function uniqueBadges(badges: BuyerTrustBadge[]) {
  const seen = new Set<string>();
  return badges.filter((badge) => {
    const key = badge.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function safeRows(admin: any, table: string, select: string, builder?: (query: any) => any) {
  try {
    let query = admin.from(table).select(select);
    if (builder) query = builder(query);
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function getBuyerTrustForUsers(admin: any, buyerIds: string[]) {
  const ids = Array.from(new Set(buyerIds.filter(Boolean)));
  const summaries = new Map<string, BuyerTrustSummary>();
  if (!ids.length) return summaries;

  for (const id of ids) {
    summaries.set(id, {
      jobsPosted: 0,
      hires: 0,
      hireRate: 0,
      paidJobs: 0,
      totalSpent: 0,
      totalSpentLabel: money(0),
      paymentStatus: "unverified",
      isNewClient: true,
      kycVerified: false,
      badges: [],
    });
  }

  const [jobs, bookings, buyers, profiles, userBadges] = await Promise.all([
    safeRows(admin, "service_inquiries", "id,user_id,status", (query) => query.in("user_id", ids).limit(5000)),
    safeRows(admin, "eloo_bookings", "id,client_id,total_price,status,is_paid", (query) => query.in("client_id", ids).limit(5000)),
    safeRows(admin, "buyers", "id,kyc_status", (query) => query.in("id", ids).limit(1000)),
    safeRows(admin, "eloo_profiles", "id,is_verified", (query) => query.in("id", ids).limit(1000)),
    safeRows(
      admin,
      "user_badges",
      "id,user_id,target_role,award_type,awarded_reason,badge:badge_definitions(name,color,audience,is_active,is_public)",
      (query) => query.in("user_id", ids).eq("target_role", "buyer").limit(5000)
    ),
  ]);

  for (const job of jobs as AnyRecord[]) {
    const summary = summaries.get(String(job.user_id || ""));
    if (!summary) continue;
    summary.jobsPosted += 1;
    if (hiredStatuses.has(String(job.status || "").toLowerCase())) {
      summary.hires += 1;
    }
  }

  for (const booking of bookings as AnyRecord[]) {
    const summary = summaries.get(String(booking.client_id || ""));
    if (!summary) continue;
    const paid = booking.is_paid === true || paidStatuses.has(String(booking.status || "").toLowerCase());
    if (!paid) continue;
    summary.paidJobs += 1;
    summary.hires = Math.max(summary.hires, summary.paidJobs);
    summary.totalSpent += Number(booking.total_price || 0);
  }

  for (const buyer of buyers as AnyRecord[]) {
    const summary = summaries.get(String(buyer.id || ""));
    if (!summary) continue;
    summary.kycVerified = summary.kycVerified || String(buyer.kyc_status || "").toLowerCase() === "approved";
  }

  for (const profile of profiles as AnyRecord[]) {
    const summary = summaries.get(String(profile.id || ""));
    if (!summary) continue;
    summary.kycVerified = summary.kycVerified || profile.is_verified === true;
  }

  for (const award of userBadges as AnyRecord[]) {
    const summary = summaries.get(String(award.user_id || ""));
    const definition = Array.isArray(award.badge) ? award.badge[0] : award.badge;
    if (!summary || !definition || definition.is_active === false || definition.is_public === false) continue;
    summary.badges.push({
      label: String(definition.name || "Badge"),
      tone: badgeTone(definition.color),
      source: award.award_type === "automatic" || award.award_type === "system" ? "rule" : "admin",
    });
  }

  for (const summary of summaries.values()) {
    summary.hireRate = summary.jobsPosted ? Math.round((summary.hires / summary.jobsPosted) * 100) : 0;
    summary.paymentStatus = summary.paidJobs > 0 || summary.totalSpent > 0 ? "verified" : "unverified";
    summary.isNewClient = summary.totalSpent <= 0;
    summary.totalSpentLabel = money(summary.totalSpent);

    const dynamicBadges: BuyerTrustBadge[] = summary.isNewClient
      ? [
          { label: "New client", tone: "slate", source: "system" },
          { label: "Payment unverified", tone: "amber", source: "system" },
        ]
      : [
          { label: "Payment verified", tone: "green", source: "system" },
          { label: `${summary.totalSpentLabel} spent`, tone: "blue", source: "system" },
        ];

    if (summary.hires > 0) {
      dynamicBadges.push({ label: "Hired before", tone: "purple", source: "system" });
    }
    if (summary.kycVerified) {
      dynamicBadges.push({ label: "Verified buyer", tone: "green", source: "system" });
    }

    summary.badges = uniqueBadges([...dynamicBadges, ...summary.badges]).slice(0, 8);
  }

  return summaries;
}
