import "server-only";

type SupabaseLike = {
  from(table: string): any;
};

type LooseRow = Record<string, any>;

export type ProviderStats = {
  rating: number;
  reviewCount: number;
  completedJobs: number;
  assignedJobs: number;
  completionRate: number;
};

const emptyStats: ProviderStats = {
  rating: 0,
  reviewCount: 0,
  completedJobs: 0,
  assignedJobs: 0,
  completionRate: 0,
};

const completedInquiryStatuses = new Set(["completed", "converted", "reviewed"]);
const assignedInquiryStatuses = new Set(["bid_accepted", "confirmed", "in_progress", "completed", "converted", "reviewed"]);
const acceptedBidStatuses = new Set(["accepted"]);
const completedBookingStatuses = new Set(["completed", "converted", "reviewed"]);
const assignedBookingStatuses = new Set(["confirmed", "in_progress", "completed", "converted", "reviewed"]);
const completedShiftStatuses = new Set(["completed"]);
const assignedShiftStatuses = new Set(["accepted", "in_progress", "completed"]);

function averageRating(rows: LooseRow[]) {
  const values = rows.map((row) => Number(row.rating || 0)).filter((value) => Number.isFinite(value) && value > 0);
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function statusOf(value: unknown) {
  return String(value || "").toLowerCase();
}

async function safeRows(supabase: SupabaseLike, table: string, select: string, apply: (query: any) => any) {
  const { data, error } = await apply(supabase.from(table).select(select));
  if (error) {
    console.error(`Failed to load ${table} provider stats:`, error.message);
    return [] as LooseRow[];
  }
  return (data || []) as LooseRow[];
}

export async function getProviderStatsMap(supabase: SupabaseLike, providerIds: string[]) {
  const ids = Array.from(new Set(providerIds.filter(Boolean)));
  const stats = new Map<string, ProviderStats>();
  for (const id of ids) stats.set(id, { ...emptyStats });
  if (!ids.length) return stats;

  const [reviews, bids, bookings, shiftApplications] = await Promise.all([
    safeRows(supabase, "eloo_reviews", "reviewee_id,rating,is_public,booking_id", (query) =>
      query.in("reviewee_id", ids).eq("is_public", true).not("booking_id", "is", null)
    ),
    safeRows(supabase, "bids", "id,provider_id,status,inquiry:service_inquiries!bids_inquiry_id_fkey(status)", (query) =>
      query.in("provider_id", ids)
    ),
    safeRows(supabase, "eloo_bookings", "id,provider_id,status", (query) =>
      query.in("provider_id", ids)
    ),
    safeRows(supabase, "shift_applications", "id,provider_user_id,status", (query) =>
      query.in("provider_user_id", ids)
    ),
  ]);

  const reviewsByProvider = new Map<string, LooseRow[]>();
  for (const review of reviews) {
    const providerId = String(review.reviewee_id || "");
    if (!providerId) continue;
    reviewsByProvider.set(providerId, [...(reviewsByProvider.get(providerId) || []), review]);
  }

  for (const [providerId, providerReviews] of reviewsByProvider.entries()) {
    const current = stats.get(providerId) || { ...emptyStats };
    stats.set(providerId, {
      ...current,
      rating: averageRating(providerReviews),
      reviewCount: providerReviews.length,
    });
  }

  for (const bid of bids) {
    const providerId = String(bid.provider_id || "");
    const current = stats.get(providerId);
    if (!current || !acceptedBidStatuses.has(statusOf(bid.status))) continue;
    const inquiryStatus = statusOf(bid.inquiry?.status);
    if (assignedInquiryStatuses.has(inquiryStatus)) current.assignedJobs += 1;
    if (completedInquiryStatuses.has(inquiryStatus)) current.completedJobs += 1;
  }

  for (const booking of bookings) {
    const providerId = String(booking.provider_id || "");
    const current = stats.get(providerId);
    if (!current) continue;
    const bookingStatus = statusOf(booking.status);
    if (assignedBookingStatuses.has(bookingStatus)) current.assignedJobs += 1;
    if (completedBookingStatuses.has(bookingStatus)) current.completedJobs += 1;
  }

  for (const application of shiftApplications) {
    const providerId = String(application.provider_user_id || "");
    const current = stats.get(providerId);
    if (!current) continue;
    const applicationStatus = statusOf(application.status);
    if (assignedShiftStatuses.has(applicationStatus)) current.assignedJobs += 1;
    if (completedShiftStatuses.has(applicationStatus)) current.completedJobs += 1;
  }

  for (const [providerId, current] of stats.entries()) {
    stats.set(providerId, {
      ...current,
      completionRate: current.assignedJobs ? Math.round((current.completedJobs / current.assignedJobs) * 100) : 0,
    });
  }

  return stats;
}

export async function getProviderStats(supabase: SupabaseLike, providerId: string) {
  return (await getProviderStatsMap(supabase, [providerId])).get(providerId) || { ...emptyStats };
}
