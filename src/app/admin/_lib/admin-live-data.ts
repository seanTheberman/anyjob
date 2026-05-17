import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AdminProvider, AdminUser, KycReview } from "../_components/admin-data";

type AnyRecord = Record<string, unknown>;

function fullName(row: AnyRecord) {
  const first = String(row.first_name || "").trim();
  const last = String(row.last_name || "").trim();
  const full = String(row.full_name || "").trim();
  return full || [first, last].filter(Boolean).join(" ") || String(row.email || "Unknown");
}

function money(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value || 0);
}

function daysAgo(value?: string | null) {
  if (!value) return "Unknown";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "Recently";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function maybeRows<T = AnyRecord>(table: string, select = "*", limit = 500): Promise<T[]> {
  const supabase = createAdminSupabaseClient();
  const client = supabase as never as {
    from: (name: string) => {
      select: (columns?: string) => {
        order: (column: string, options?: { ascending?: boolean }) => {
          limit: (count: number) => Promise<{ data: T[] | null; error: { message: string } | null }>;
        };
        limit: (count: number) => Promise<{ data: T[] | null; error: { message: string } | null }>;
      };
    };
  };

  try {
    const { data, error } = await client.from(table).select(select).order("created_at", { ascending: false }).limit(limit);
    if (error) return [];
    return data || [];
  } catch {
    try {
      const { data, error } = await client.from(table).select(select).limit(limit);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }
}

async function maybeCount(table: string) {
  const supabase = createAdminSupabaseClient();
  const client = supabase as never as {
    from: (name: string) => {
      select: (columns: string, options: { count: "exact"; head: true }) => Promise<{ count: number | null; error: unknown }>;
    };
  };

  try {
    const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const [profiles, buyers, bookings] = await Promise.all([
    maybeRows<AnyRecord>("eloo_profiles"),
    maybeRows<AnyRecord>("buyers"),
    maybeRows<AnyRecord>("eloo_bookings"),
  ]);

  const bookingStats = new Map<string, { count: number; spend: number; cancelled: number }>();
  for (const booking of bookings) {
    const clientId = String(booking.client_id || "");
    if (!clientId) continue;
    const current = bookingStats.get(clientId) || { count: 0, spend: 0, cancelled: 0 };
    current.count += 1;
    current.spend += Number(booking.total_price || 0);
    if (String(booking.status || "").toLowerCase() === "cancelled") current.cancelled += 1;
    bookingStats.set(clientId, current);
  }

  const merged = new Map<string, AnyRecord>();
  for (const profile of profiles) {
    if (profile.role === "provider") continue;
    merged.set(String(profile.id), profile);
  }
  for (const buyer of buyers) {
    merged.set(String(buyer.id), { ...(merged.get(String(buyer.id)) || {}), ...buyer, role: "client" });
  }

  return Array.from(merged.values()).map((row) => {
    const id = String(row.id);
    const stats = bookingStats.get(id) || { count: 0, spend: 0, cancelled: 0 };
    const isActive = row.is_active !== false;
    const emailVerified = row.email_verified !== false;
    const risk = !isActive || stats.cancelled > 2 ? "High" : !emailVerified ? "Medium" : "Low";
    const status = !isActive ? "Blocked" : !emailVerified ? "Pending email" : stats.count >= 10 ? "VIP" : "Active";

    return {
      id,
      name: fullName(row),
      role: String(row.role || "client"),
      email: String(row.email || ""),
      city: String(row.city || "Unknown"),
      bookings: stats.count,
      spend: money(stats.spend),
      status,
      risk,
      lastSeen: daysAgo(String(row.last_login_at || row.updated_at || row.created_at || "")),
    };
  });
}

export async function getAdminProviders(): Promise<AdminProvider[]> {
  const [profiles, sellers, services, bookings, reviews] = await Promise.all([
    maybeRows<AnyRecord>("eloo_profiles"),
    maybeRows<AnyRecord>("sellers"),
    maybeRows<AnyRecord>("eloo_provider_services"),
    maybeRows<AnyRecord>("eloo_bookings"),
    maybeRows<AnyRecord>("eloo_reviews"),
  ]);

  const servicesByProvider = new Map<string, AnyRecord[]>();
  for (const service of services) {
    const providerId = String(service.provider_id || "");
    if (!providerId) continue;
    servicesByProvider.set(providerId, [...(servicesByProvider.get(providerId) || []), service]);
  }

  const jobsByProvider = new Map<string, number>();
  for (const booking of bookings) {
    const providerId = String(booking.provider_id || "");
    if (!providerId) continue;
    jobsByProvider.set(providerId, (jobsByProvider.get(providerId) || 0) + 1);
  }

  const ratingsByProvider = new Map<string, number[]>();
  for (const review of reviews) {
    const providerId = String(review.reviewee_id || "");
    if (!providerId) continue;
    ratingsByProvider.set(providerId, [...(ratingsByProvider.get(providerId) || []), Number(review.rating || 0)]);
  }

  const merged = new Map<string, AnyRecord>();
  for (const profile of profiles) {
    if (profile.role === "provider") merged.set(String(profile.id), profile);
  }
  for (const seller of sellers) {
    merged.set(String(seller.id), { ...(merged.get(String(seller.id)) || {}), ...seller, role: "provider" });
  }

  return Array.from(merged.values()).map((row) => {
    const id = String(row.id);
    const providerServices = servicesByProvider.get(id) || [];
    const ratingValues = ratingsByProvider.get(id) || [];
    const averageRating = ratingValues.length
      ? (ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length).toFixed(1)
      : Number(row.rating || 0).toFixed(1);

    const hasId = Boolean(row.id_document_url);
    const hasSelfie = Boolean(row.selfie_video_url);
    const hasInsurance = Boolean(row.insurance_document_url || row.insurance_status === "approved");
    const docsSubmitted = hasId && hasSelfie && hasInsurance;
    const sellerStatus = String(row.status || "").toLowerCase();
    const isVerified = row.is_verified === true || sellerStatus === "approved";
    const kycStatus = isVerified ? "Approved" : sellerStatus === "rejected" ? "Rejected" : !docsSubmitted || !hasInsurance ? "Missing document" : "Needs review";
    const accountStatus = isVerified ? "Active" : sellerStatus === "rejected" || sellerStatus === "suspended" ? "Blocked" : "Limited";

    return {
      id,
      name: fullName(row),
      service: String(row.service_category || providerServices[0]?.title || "Not set"),
      city: String(row.city || "Unknown"),
      verification: isVerified ? "Verified" : kycStatus,
      kycStatus,
      documents: [hasId ? "ID" : null, hasSelfie ? "selfie video" : null, hasInsurance ? "insurance" : null].filter(Boolean).join(", ") || "Missing documents",
      docsSubmitted,
      rating: averageRating,
      jobs: Number(row.total_jobs || jobsByProvider.get(id) || 0),
      accountStatus,
    };
  });
}

export async function getKycReviews(): Promise<KycReview[]> {
  const providers = await getAdminProviders();
  return providers
    .filter((provider) => provider.kycStatus !== "Approved" || provider.accountStatus !== "Active")
    .map((provider) => ({
      id: `kyc_${provider.id}`,
      providerId: provider.id,
      provider: provider.name,
      issue: provider.kycStatus,
      document: provider.documents,
      docsSubmitted: provider.docsSubmitted,
      priority: provider.kycStatus === "Rejected" || provider.accountStatus === "Blocked" ? "High" : provider.kycStatus === "Needs review" ? "High" : "Medium",
      status: provider.kycStatus,
      submitted: provider.docsSubmitted ? "Submitted" : "Not submitted",
      accountImpact: provider.accountStatus === "Active" ? "No restriction" : `Account ${provider.accountStatus.toLowerCase()}: seller cannot quote`,
    }));
}

export async function getAdminJobs() {
  const [inquiries, bookings, bids] = await Promise.all([
    maybeRows<AnyRecord>("service_inquiries"),
    maybeRows<AnyRecord>("eloo_bookings"),
    maybeRows<AnyRecord>("bids"),
  ]);

  const bidCounts = new Map<string, number>();
  for (const bid of bids) {
    const inquiryId = String(bid.inquiry_id || "");
    if (!inquiryId) continue;
    bidCounts.set(inquiryId, (bidCounts.get(inquiryId) || 0) + 1);
  }

  const inquiryRows = inquiries.map((job) => [
    String(job.id || "").slice(0, 8),
    String(job.job_description || job.category_slug || "Service request").slice(0, 60),
    String([job.first_name, job.last_name].filter(Boolean).join(" ") || job.email || "Client"),
    `${bidCounts.get(String(job.id)) || 0} bids`,
    String(job.status || "submitted"),
    "Open",
  ]);

  const bookingRows = bookings.map((booking) => [
    String(booking.id || "").slice(0, 8),
    String(booking.notes || booking.service_id || "Booking"),
    String(booking.client_id || "Client"),
    String(booking.provider_id || "Unassigned"),
    String(booking.status || "pending"),
    "Open",
  ]);

  return [...inquiryRows, ...bookingRows].slice(0, 100);
}

export async function getAdminOverview() {
  const [users, providers, jobs, bookings, subscriptions, messages] = await Promise.all([
    getAdminUsers(),
    getAdminProviders(),
    getAdminJobs(),
    maybeRows<AnyRecord>("eloo_bookings"),
    maybeRows<AnyRecord>("eloo_subscriptions"),
    maybeRows<AnyRecord>("eloo_messages"),
  ]);

  const revenue = bookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0) +
    subscriptions.reduce((sum, sub) => sum + Number(sub.price_monthly || 0), 0);
  const openDisputes = jobs.filter((job) => String(job[4]).toLowerCase().includes("dispute")).length;
  const pendingKyc = providers.filter((provider) => provider.kycStatus !== "Approved").length;

  return {
    metrics: [
      { label: "Gross booking value", value: money(revenue), delta: "Live", tone: "text-emerald-700", detail: `Across ${bookings.length} bookings/subscriptions` },
      { label: "Active users", value: String(users.length), delta: "Live", tone: "text-emerald-700", detail: "Client/admin accounts found" },
      { label: "Verified providers", value: String(providers.filter((provider) => provider.kycStatus === "Approved").length), delta: `${pendingKyc} pending`, tone: pendingKyc ? "text-amber-700" : "text-emerald-700", detail: `${providers.length} provider records found` },
      { label: "Open jobs", value: String(jobs.length), delta: `${openDisputes} disputes`, tone: openDisputes ? "text-red-700" : "text-emerald-700", detail: "Service inquiries plus bookings" },
    ],
    riskQueue: [
      ...providers.filter((provider) => provider.kycStatus !== "Approved").map((provider) => [provider.kycStatus === "Rejected" ? "High" : "Medium", "KYC review", provider.name, provider.kycStatus, "Review"]),
      ...jobs.filter((job) => String(job[4]).toLowerCase().includes("dispute")).map((job) => ["High", "Job dispute", String(job[1]), String(job[4]), "Open"]),
    ].slice(0, 10),
    activity: [
      ...messages.slice(0, 3).map((message) => [daysAgo(String(message.created_at || "")), "Message activity", String(message.content || "").slice(0, 80)]),
      ...bookings.slice(0, 3).map((booking) => [daysAgo(String(booking.created_at || "")), "Booking activity", `${booking.status || "pending"} booking ${String(booking.id).slice(0, 8)}`]),
    ],
  };
}

export async function getAdminAnalytics() {
  const [users, providers, jobs, bookings, reviews] = await Promise.all([
    getAdminUsers(),
    getAdminProviders(),
    getAdminJobs(),
    maybeRows<AnyRecord>("eloo_bookings"),
    maybeRows<AnyRecord>("eloo_reviews"),
  ]);

  const completed = bookings.filter((booking) => booking.status === "completed").length;
  const cancelled = bookings.filter((booking) => booking.status === "cancelled").length;
  const completionRate = bookings.length ? `${Math.round((completed / bookings.length) * 100)}%` : "0%";
  const cancellationRate = bookings.length ? `${Math.round((cancelled / bookings.length) * 100)}%` : "0%";

  return {
    stats: [
      { label: "Users", value: String(users.length), delta: "Live", detail: "Client/admin accounts" },
      { label: "Providers", value: String(providers.length), delta: "Live", detail: "Provider accounts" },
      { label: "Completion rate", value: completionRate, delta: "Live", detail: "Completed bookings" },
      { label: "Reviews", value: String(reviews.length), delta: "Live", detail: "Review records" },
    ],
    rows: [
      ["Total jobs", String(jobs.length), "Live", "Tracked", "Inspect"],
      ["Completed bookings", String(completed), "Live", "Tracked", "Inspect"],
      ["Cancellation rate", cancellationRate, "Live", cancelled > 0 ? "Needs review" : "Healthy", "Inspect"],
      ["Pending KYC", String(providers.filter((provider) => provider.kycStatus !== "Approved").length), "Live", "Needs review", "Inspect"],
      ["Average provider rating", providers.length ? (providers.reduce((sum, p) => sum + Number(p.rating || 0), 0) / providers.length).toFixed(1) : "0.0", "Live", "Tracked", "Inspect"],
    ],
  };
}

export async function getAdminHistory() {
  const [bookings, messages, notifications] = await Promise.all([
    maybeRows<AnyRecord>("eloo_bookings"),
    maybeRows<AnyRecord>("eloo_messages"),
    maybeRows<AnyRecord>("eloo_notifications"),
  ]);

  return [
    ...bookings.map((booking) => [daysAgo(String(booking.created_at || "")), "Booking", `${booking.status || "pending"} booking ${String(booking.id).slice(0, 8)}`, "Logged", "Open"]),
    ...messages.map((message) => [daysAgo(String(message.created_at || "")), "Message", String(message.content || "").slice(0, 80), "Logged", "Open"]),
    ...notifications.map((notification) => [daysAgo(String(notification.created_at || "")), "Notification", String(notification.title || ""), String(notification.is_read ? "Read" : "Unread"), "Open"]),
  ].slice(0, 100);
}

export async function getAdminPayments() {
  const [bookings, subscriptions] = await Promise.all([
    maybeRows<AnyRecord>("eloo_bookings"),
    maybeRows<AnyRecord>("eloo_subscriptions"),
  ]);

  return [
    ...bookings.map((booking) => [String(booking.id).slice(0, 8), "Booking", money(Number(booking.total_price || 0)), booking.is_paid ? "Paid" : "Held", "Open"]),
    ...subscriptions.map((sub) => [String(sub.id).slice(0, 8), `Subscription ${sub.plan || ""}`, money(Number(sub.price_monthly || 0)), String(sub.status || "unknown"), "Open"]),
  ].slice(0, 100);
}

export async function getAdminSupport() {
  const [notifications, conversations] = await Promise.all([
    maybeRows<AnyRecord>("eloo_notifications"),
    maybeRows<AnyRecord>("eloo_conversations"),
  ]);

  return [
    ...notifications.map((notification) => [String(notification.id).slice(0, 8), "User", String(notification.title || notification.type || "Notification"), notification.is_read ? "Normal" : "High", notification.is_read ? "Waiting" : "Open", "Reply"]),
    ...conversations.map((conversation) => [String(conversation.id).slice(0, 8), "Conversation", String(conversation.is_active ? "Active conversation" : "Inactive conversation"), "Normal", conversation.is_active ? "Open" : "Resolved", "Open"]),
  ].slice(0, 100);
}

export async function getAdminReports() {
  const counts = await Promise.all([
    maybeCount("eloo_profiles"),
    maybeCount("sellers"),
    maybeCount("service_inquiries"),
    maybeCount("eloo_bookings"),
    maybeCount("eloo_reviews"),
  ]);

  return [
    ["Profiles export", "CSV", `${counts[0]} records`, "Live", "Download"],
    ["Sellers export", "CSV", `${counts[1]} records`, "Live", "Download"],
    ["Service inquiries export", "CSV", `${counts[2]} records`, "Live", "Download"],
    ["Bookings export", "CSV", `${counts[3]} records`, "Live", "Download"],
    ["Reviews export", "CSV", `${counts[4]} records`, "Live", "Download"],
  ];
}
