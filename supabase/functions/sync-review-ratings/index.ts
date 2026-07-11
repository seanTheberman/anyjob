import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient, requireServiceRole } from "../_shared/supabase-admin.ts";

type ReviewRow = {
  id: string;
  reviewee_id: string | null;
  rating: number | null;
  is_public: boolean | null;
};

type RatingStats = {
  rating: number;
  review_count: number;
};

type SyncBody = {
  user_id?: unknown;
  user_ids?: unknown;
  review_id?: unknown;
  all?: unknown;
};

function asUserIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function roundedAverage(ratings: number[]) {
  if (!ratings.length) return 0;
  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return Math.round(average * 100) / 100;
}

function emptyStats(): RatingStats {
  return { rating: 0, review_count: 0 };
}

function aggregateReviewRows(rows: ReviewRow[]) {
  const ratingsByUser = new Map<string, number[]>();

  for (const row of rows) {
    const revieweeId = row.reviewee_id || "";
    const rating = Number(row.rating || 0);
    if (!revieweeId || row.is_public === false || !Number.isFinite(rating) || rating <= 0) continue;

    const current = ratingsByUser.get(revieweeId) || [];
    current.push(rating);
    ratingsByUser.set(revieweeId, current);
  }

  return new Map(
    Array.from(ratingsByUser.entries()).map(([userId, ratings]) => [
      userId,
      {
        rating: roundedAverage(ratings),
        review_count: ratings.length,
      },
    ]),
  );
}

async function fetchAllReviews(supabase: ReturnType<typeof createAdminClient>) {
  const rows: ReviewRow[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("eloo_reviews")
      .select("id,reviewee_id,rating,is_public")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    rows.push(...((data || []) as ReviewRow[]));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

async function resolveTargetUserIds(supabase: ReturnType<typeof createAdminClient>, body: SyncBody) {
  const explicitIds = new Set<string>();
  if (typeof body.user_id === "string" && body.user_id.length > 0) explicitIds.add(body.user_id);
  asUserIds(body.user_ids).forEach((id) => explicitIds.add(id));

  const reviewId = typeof body.review_id === "string" ? body.review_id : "";
  if (reviewId) {
    const { data, error } = await supabase
      .from("eloo_reviews")
      .select("reviewee_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (data?.reviewee_id) explicitIds.add(String(data.reviewee_id));
  }

  if (explicitIds.size) return { ids: Array.from(explicitIds), syncAll: false };
  return { ids: [] as string[], syncAll: body.all !== false };
}

async function updateMaybeExisting(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  idColumn: string,
  userId: string,
  values: Record<string, number | string>,
) {
  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq(idColumn, userId)
    .select(idColumn)
    .maybeSingle();

  if (error) throw new Error(`${table}: ${error.message}`);
  return Boolean(data);
}

async function syncUserStats(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  stats: RatingStats,
) {
  const updatedAt = new Date().toISOString();
  const withUpdatedAt = { ...stats, updated_at: updatedAt };

  const [sellerUpdated, buyerUpdated, businessUpdated, elooUpdated, userProfileUpdated] = await Promise.all([
    updateMaybeExisting(supabase, "sellers", "id", userId, withUpdatedAt),
    updateMaybeExisting(supabase, "buyers", "id", userId, withUpdatedAt),
    updateMaybeExisting(supabase, "business_profiles", "owner_user_id", userId, withUpdatedAt),
    updateMaybeExisting(supabase, "eloo_profiles", "id", userId, withUpdatedAt),
    updateMaybeExisting(supabase, "user_profiles", "id", userId, withUpdatedAt),
  ]);

  return {
    user_id: userId,
    ...stats,
    updated_tables: {
      sellers: sellerUpdated,
      buyers: buyerUpdated,
      business_profiles: businessUpdated,
      eloo_profiles: elooUpdated,
      user_profiles: userProfileUpdated,
    },
  };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  if (!requireServiceRole(req)) return jsonResponse({ error: "Unauthorized" }, 401);

  try {
    const body = await req.json().catch(() => ({})) as SyncBody;
    const supabase = createAdminClient();
    const { ids: targetIds, syncAll } = await resolveTargetUserIds(supabase, body);
    const reviews = await fetchAllReviews(supabase);
    const statsByUser = aggregateReviewRows(reviews);

    const ids = syncAll
      ? Array.from(new Set([
          ...reviews.map((review) => review.reviewee_id || "").filter(Boolean),
          ...Array.from(statsByUser.keys()),
        ]))
      : targetIds;

    const results = [];
    for (const userId of ids) {
      results.push(await syncUserStats(supabase, userId, statsByUser.get(userId) || emptyStats()));
    }

    return jsonResponse({
      ok: true,
      mode: syncAll ? "all" : "targeted",
      updated: results.length,
      results,
    });
  } catch (error) {
    console.error("sync-review-ratings failed", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Failed to sync review ratings" }, 500);
  }
});
