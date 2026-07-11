import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncReviewRatings } from "@/lib/reviews/sync-review-ratings";
import { NextRequest, NextResponse } from "next/server";

type LooseRow = Record<string, unknown>;
type QueryError = { message: string };
type QueryResult<T> = { data: T | null; error: QueryError | null };
type QueryListResult<T> = { data: T[] | null; error: QueryError | null };
type LooseQuery<T> = PromiseLike<QueryListResult<T>> & {
  select(columns?: string): LooseQuery<T>;
  insert(value: LooseRow): { select(columns?: string): { single(): PromiseLike<QueryResult<T>> } };
  eq(column: string, value: unknown): LooseQuery<T>;
  in(column: string, values: unknown[]): LooseQuery<T>;
  limit(count: number): LooseQuery<T>;
  maybeSingle(): PromiseLike<QueryResult<T>>;
  single(): PromiseLike<QueryResult<T>>;
  order(column: string, options?: { ascending?: boolean }): PromiseLike<QueryListResult<T>>;
  or(filter: string): LooseQuery<T>;
};
type LooseAdminClient = {
  from<T = LooseRow>(table: string): LooseQuery<T>;
};

const REVIEW_TYPES = ["buyer_to_seller", "seller_to_buyer"] as const;
const REVIEWABLE_JOB_STATUSES = new Set(["completed", "converted"]);
const HIRED_BID_STATUSES = new Set(["accepted", "in_progress", "completed"]);
const REVIEWABLE_SHIFT_STATUSES = new Set(["completed"]);
const REVIEW_LIST_CACHE_TTL_MS = 30_000;
const REVIEW_LIST_COLUMNS = [
  "id",
  "booking_id",
  "reviewer_id",
  "reviewee_id",
  "rating",
  "comment",
  "is_public",
  "created_at",
  "service_inquiry_id",
  "review_type",
  "title",
  "communication_rating",
  "professionalism_rating",
  "quality_rating",
  "punctuality_rating",
  "would_hire_again",
  "would_work_with_again",
  "shift_application_id",
  "business_work_post_id",
  "reviewer:eloo_profiles!eloo_reviews_reviewer_id_fkey(id,first_name,last_name,avatar_url)",
].join(",");

const reviewListCache = new Map<string, { expiresAt: number; reviews: LooseRow[] }>();

function isReviewType(value: unknown): value is (typeof REVIEW_TYPES)[number] {
  return typeof value === "string" && REVIEW_TYPES.includes(value as (typeof REVIEW_TYPES)[number]);
}

function numericRating(value: unknown) {
  const rating = Number(value);
  return Number.isFinite(rating) ? rating : 0;
}

function optionalRating(value: unknown) {
  const rating = numericRating(value);
  return rating >= 1 && rating <= 5 ? rating : null;
}

function boolOrNull(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function reviewTitle(comment: string, fallback: string) {
  const firstLine = comment.split("\n").find((line) => line.trim())?.trim();
  return firstLine ? firstLine.slice(0, 120) : fallback;
}

async function getAuthenticatedUserId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const claimsResult = await supabase.auth.getClaims().catch(() => null);
  const claimsUserId = claimsResult?.data?.claims?.sub;
  if (typeof claimsUserId === "string" && claimsUserId) return claimsUserId;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user.id;
}

async function acceptedBidForInquiry(admin: LooseAdminClient, inquiryId: string, providerId?: string) {
  let query = admin
    .from("bids")
    .select("id,inquiry_id,provider_id,status")
    .eq("inquiry_id", inquiryId)
    .in("status", Array.from(HIRED_BID_STATUSES));

  if (providerId) {
    query = query.eq("provider_id", providerId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || [])[0] || null;
}

async function completedShiftApplication(admin: LooseAdminClient, applicationId: string) {
  const { data, error } = await admin
    .from("shift_applications")
    .select("*, post:business_work_posts(id,owner_user_id,status)")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data || null;
}

function profileFromRow(row?: LooseRow) {
  if (!row) return undefined;
  const companyName = String(row.company_name || row.business_name || "").trim();
  const email = String(row.email || row.contact_email || "").trim();
  return {
    id: row.id || row.owner_user_id,
    first_name: String(row.first_name || companyName || email || "AnyJob").trim(),
    last_name: String(row.last_name || "").trim() || (companyName ? "Business" : "User"),
    avatar_url: row.avatar_url || null,
    profile_image_url: row.profile_image_url || row.avatar_url || null,
  };
}

async function loadReviewProfiles(admin: LooseAdminClient, userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniqueIds.length) return new Map<string, LooseRow>();

  const [profilesResult, buyersResult, sellersResult, businessesResult] = await Promise.all([
    admin.from("eloo_profiles").select("id,first_name,last_name,email,avatar_url").in("id", uniqueIds),
    admin.from("buyers").select("id,first_name,last_name,email,profile_image_url").in("id", uniqueIds),
    admin.from("sellers").select("id,first_name,last_name,email,profile_image_url").in("id", uniqueIds),
    admin.from("business_profiles").select("owner_user_id,business_name,contact_email").in("owner_user_id", uniqueIds),
  ]);

  const rowsById = new Map<string, LooseRow>();
  for (const result of [profilesResult, buyersResult, sellersResult]) {
    if (result.error) throw new Error(result.error.message);
    for (const row of result.data || []) {
      rowsById.set(String(row.id), row);
    }
  }
  if (businessesResult.error) throw new Error(businessesResult.error.message);
  for (const row of businessesResult.data || []) {
    const ownerId = String(row.owner_user_id || "");
    if (ownerId && !rowsById.has(ownerId)) rowsById.set(ownerId, row);
  }

  return new Map(uniqueIds.map((id) => [id, profileFromRow(rowsById.get(id)) || {
    first_name: "AnyJob",
    last_name: "User",
    avatar_url: null,
    profile_image_url: null,
  }]));
}

function enrichReview(review: LooseRow, reviewer: LooseRow | undefined) {
  const enrichedReviewer = reviewer
    ? {
        ...reviewer,
        profile_image_url: reviewer.profile_image_url || reviewer.avatar_url || null,
      }
    : {
        first_name: "AnyJob",
        last_name: "User",
        avatar_url: null,
        profile_image_url: null,
      };

  return {
    ...review,
    title: String(review.title || reviewTitle(String(review.comment || ""), "Review")),
    review_type: review.review_type || "buyer_to_seller",
    reviewer: enrichedReviewer,
  };
}

function embeddedReviewer(review: LooseRow) {
  const reviewer = review.reviewer;
  if (Array.isArray(reviewer)) return reviewer[0] as LooseRow | undefined;
  return reviewer && typeof reviewer === "object" ? reviewer as LooseRow : undefined;
}

function reviewListLimit(value: string | null) {
  const parsed = Number(value || 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.trunc(parsed), 1), 200);
}

function reviewCacheKey(userId: string, params: URLSearchParams, limit: number) {
  return JSON.stringify({
    userId,
    serviceInquiryId: params.get("service_inquiry_id") || "",
    shiftApplicationId: params.get("shift_application_id") || "",
    revieweeId: params.get("reviewee_id") || "",
    reviewType: params.get("review_type") || "",
    received: params.get("received") === "true" || params.get("scope") === "received",
    given: params.get("given") === "true" || params.get("scope") === "given",
    limit,
  });
}

function reviewsJson(reviews: LooseRow[], status = 200) {
  return NextResponse.json(
    { reviews },
    {
      status,
      headers: {
        "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
        "Vary": "Cookie",
      },
    }
  );
}

function clearReviewListCacheForUsers(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniqueIds.length) return;

  for (const key of Array.from(reviewListCache.keys())) {
    if (uniqueIds.some((userId) => key.includes(userId))) {
      reviewListCache.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const serviceInquiryId = String(body.service_inquiry_id || "");
    const shiftApplicationId = String(body.shift_application_id || "");
    const requestedRevieweeId = String(body.reviewee_id || "");
    const reviewType = body.review_type;
    const rating = numericRating(body.rating);
    const title = String(body.title || "").trim();
    const comment = String(body.comment || "").trim();

    if ((!serviceInquiryId && !shiftApplicationId) || (serviceInquiryId && shiftApplicationId) || !isReviewType(reviewType) || !rating || !title || !comment) {
      return NextResponse.json({ error: "Missing required review fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient() as unknown as LooseAdminClient;

    if (shiftApplicationId) {
      const application = await completedShiftApplication(admin, shiftApplicationId);
      if (!application) {
        return NextResponse.json({ error: "Shift application not found" }, { status: 404 });
      }

      if (!REVIEWABLE_SHIFT_STATUSES.has(String(application.status || "").toLowerCase())) {
        return NextResponse.json({ error: "You can only review completed shifts" }, { status: 400 });
      }

      const ownerId = String(application.owner_user_id || "");
      const providerId = String(application.provider_user_id || "");
      let revieweeId = "";

      if (reviewType === "buyer_to_seller") {
        if (ownerId !== user.id) {
          return NextResponse.json({ error: "Only the business owner can review the provider for this shift" }, { status: 403 });
        }
        revieweeId = providerId;
      } else {
        if (providerId !== user.id) {
          return NextResponse.json({ error: "Only the accepted provider can review the business for this shift" }, { status: 403 });
        }
        revieweeId = ownerId;
      }

      if (requestedRevieweeId && requestedRevieweeId !== revieweeId) {
        return NextResponse.json({ error: "Reviewee does not match this shift" }, { status: 400 });
      }

      const { data: existingReview, error: existingError } = await admin
        .from("eloo_reviews")
        .select("id")
        .eq("shift_application_id", shiftApplicationId)
        .eq("reviewer_id", user.id)
        .eq("review_type", reviewType)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json({ error: existingError.message }, { status: 500 });
      }
      if (existingReview) {
        return NextResponse.json({ error: "You have already submitted this review" }, { status: 409 });
      }

      const reviewData: LooseRow = {
        shift_application_id: shiftApplicationId,
        business_work_post_id: application.business_work_post_id,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        review_type: reviewType,
        rating,
        title,
        comment,
        is_public: true,
      };

      const communicationRating = optionalRating(body.communication_rating);
      const professionalismRating = optionalRating(body.professionalism_rating);
      const qualityRating = optionalRating(body.quality_rating);
      const punctualityRating = optionalRating(body.punctuality_rating);
      const wouldHireAgain = boolOrNull(body.would_hire_again);
      const wouldWorkWithAgain = boolOrNull(body.would_work_with_again);

      if (communicationRating) reviewData.communication_rating = communicationRating;
      if (professionalismRating) reviewData.professionalism_rating = professionalismRating;
      if (qualityRating) reviewData.quality_rating = qualityRating;
      if (punctualityRating) reviewData.punctuality_rating = punctualityRating;
      if (wouldHireAgain !== null) reviewData.would_hire_again = wouldHireAgain;
      if (wouldWorkWithAgain !== null) reviewData.would_work_with_again = wouldWorkWithAgain;

      const { data: review, error: reviewError } = await admin
        .from("eloo_reviews")
        .insert(reviewData)
        .select("*")
        .single();

      if (reviewError || !review) {
        return NextResponse.json({ error: reviewError?.message || "Failed to create review" }, { status: 500 });
      }

      const { data: reviewer } = await admin
        .from("eloo_profiles")
        .select("id,first_name,last_name,avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      void syncReviewRatings({ userId: revieweeId, reviewId: String(review.id || "") }).then((result) => {
        if (!result.ok && !result.skipped) console.error("Review rating sync failed:", result.error);
      });
      clearReviewListCacheForUsers([user.id, revieweeId]);

      return NextResponse.json({ review: enrichReview(review, reviewer || undefined) }, { status: 201 });
    }

    const { data: inquiry, error: inquiryError } = await admin
      .from("service_inquiries")
      .select("id,user_id,status")
      .eq("id", serviceInquiryId)
      .maybeSingle();

    if (inquiryError) {
      return NextResponse.json({ error: inquiryError.message }, { status: 500 });
    }
    if (!inquiry) {
      return NextResponse.json({ error: "Service inquiry not found" }, { status: 404 });
    }

    if (!REVIEWABLE_JOB_STATUSES.has(String(inquiry.status || "").toLowerCase())) {
      return NextResponse.json({ error: "You can only review completed jobs" }, { status: 400 });
    }

    const buyerId = String(inquiry.user_id || "");
    const isBuyer = buyerId === user.id;
    const hiredBid = await acceptedBidForInquiry(
      admin,
      serviceInquiryId,
      reviewType === "seller_to_buyer" ? user.id : undefined,
    );

    if (!hiredBid) {
      return NextResponse.json({ error: "No accepted provider found for this job" }, { status: 400 });
    }

    let revieweeId = "";
    if (reviewType === "buyer_to_seller") {
      if (!isBuyer) {
        return NextResponse.json({ error: "Only the buyer can review the provider for this job" }, { status: 403 });
      }
      revieweeId = String(hiredBid.provider_id || "");
      if (requestedRevieweeId && requestedRevieweeId !== revieweeId) {
        return NextResponse.json({ error: "Reviewee does not match the accepted provider" }, { status: 400 });
      }
    } else {
      if (isBuyer || String(hiredBid.provider_id || "") !== user.id) {
        return NextResponse.json({ error: "Only the accepted provider can review the client for this job" }, { status: 403 });
      }
      revieweeId = buyerId;
      if (requestedRevieweeId && requestedRevieweeId !== revieweeId) {
        return NextResponse.json({ error: "Reviewee does not match the job client" }, { status: 400 });
      }
    }

    const { data: existingReview, error: existingError } = await admin
      .from("eloo_reviews")
      .select("id")
      .eq("service_inquiry_id", serviceInquiryId)
      .eq("reviewer_id", user.id)
      .eq("review_type", reviewType)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    if (existingReview) {
      return NextResponse.json({ error: "You have already submitted this review" }, { status: 409 });
    }

    const reviewData: LooseRow = {
      service_inquiry_id: serviceInquiryId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      review_type: reviewType,
      rating,
      title,
      comment,
      is_public: true,
    };

    const communicationRating = optionalRating(body.communication_rating);
    const professionalismRating = optionalRating(body.professionalism_rating);
    const qualityRating = optionalRating(body.quality_rating);
    const punctualityRating = optionalRating(body.punctuality_rating);
    const wouldHireAgain = boolOrNull(body.would_hire_again);
    const wouldWorkWithAgain = boolOrNull(body.would_work_with_again);

    if (communicationRating) reviewData.communication_rating = communicationRating;
    if (professionalismRating) reviewData.professionalism_rating = professionalismRating;
    if (qualityRating) reviewData.quality_rating = qualityRating;
    if (punctualityRating) reviewData.punctuality_rating = punctualityRating;
    if (wouldHireAgain !== null) reviewData.would_hire_again = wouldHireAgain;
    if (wouldWorkWithAgain !== null) reviewData.would_work_with_again = wouldWorkWithAgain;

    const { data: review, error: reviewError } = await admin
      .from("eloo_reviews")
      .insert(reviewData)
      .select("*")
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: reviewError?.message || "Failed to create review" }, { status: 500 });
    }

    const { data: reviewer } = await admin
      .from("eloo_profiles")
      .select("id,first_name,last_name,avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    void syncReviewRatings({ userId: revieweeId, reviewId: String(review.id || "") }).then((result) => {
      if (!result.ok && !result.skipped) console.error("Review rating sync failed:", result.error);
    });
    clearReviewListCacheForUsers([user.id, revieweeId]);

    return NextResponse.json({ review: enrichReview(review, reviewer || undefined) }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const userId = await getAuthenticatedUserId(supabase);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceInquiryId = searchParams.get("service_inquiry_id");
    const shiftApplicationId = searchParams.get("shift_application_id");
    const revieweeId = searchParams.get("reviewee_id");
    const reviewType = searchParams.get("review_type");
    const receivedOnly = searchParams.get("received") === "true" || searchParams.get("scope") === "received";
    const givenOnly = searchParams.get("given") === "true" || searchParams.get("scope") === "given";
    const limit = reviewListLimit(searchParams.get("limit"));
    const cacheKey = reviewCacheKey(userId, searchParams, limit);
    const cached = reviewListCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return reviewsJson(cached.reviews);
    }

    const admin = createAdminSupabaseClient() as unknown as LooseAdminClient;

    if (serviceInquiryId) {
      const { data: inquiry, error: inquiryError } = await admin
        .from("service_inquiries")
        .select("id,user_id")
        .eq("id", serviceInquiryId)
        .maybeSingle();

      if (inquiryError) {
        return NextResponse.json({ error: inquiryError.message }, { status: 500 });
      }
      if (!inquiry) {
        return NextResponse.json({ error: "Service inquiry not found" }, { status: 404 });
      }

      const userIsBuyer = String(inquiry.user_id || "") === userId;
      const userBid = await acceptedBidForInquiry(admin, serviceInquiryId, userId).catch(() => null);
      if (!userIsBuyer && !userBid) {
        return NextResponse.json({ error: "You do not have permission to view these reviews" }, { status: 403 });
      }
    }

    if (shiftApplicationId) {
      const application = await completedShiftApplication(admin, shiftApplicationId).catch((error) => {
        throw error;
      });

      if (!application) {
        return NextResponse.json({ error: "Shift application not found" }, { status: 404 });
      }

      const userIsOwner = String(application.owner_user_id || "") === userId;
      const userIsProvider = String(application.provider_user_id || "") === userId;
      if (!userIsOwner && !userIsProvider) {
        return NextResponse.json({ error: "You do not have permission to view these reviews" }, { status: 403 });
      }
    }

    let query = admin
      .from("eloo_reviews")
      .select(REVIEW_LIST_COLUMNS);

    if (serviceInquiryId) {
      query = query.eq("service_inquiry_id", serviceInquiryId);
    } else if (shiftApplicationId) {
      query = query.eq("shift_application_id", shiftApplicationId);
    } else if (receivedOnly) {
      query = query.eq("reviewee_id", userId);
    } else if (givenOnly) {
      query = query.eq("reviewer_id", userId);
    } else {
      query = query.or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`);
    }

    if (revieweeId) {
      query = query.eq("reviewee_id", revieweeId);
    }

    if (reviewType && isReviewType(reviewType)) {
      query = query.eq("review_type", reviewType);
    }

    const { data: reviews, error: reviewsError } = await query
      .limit(limit)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      return NextResponse.json({ error: reviewsError.message }, { status: 500 });
    }

    const reviewRows = (reviews || []) as LooseRow[];
    const missingReviewerIds = Array.from(
      new Set(reviewRows
        .filter((review: LooseRow) => !embeddedReviewer(review))
        .map((review: LooseRow) => String(review.reviewer_id || ""))
        .filter((id: string) => Boolean(id)))
    );
    const profilesById = await loadReviewProfiles(admin, missingReviewerIds);
    const enrichedReviews = reviewRows.map((review: LooseRow) =>
      enrichReview(review, embeddedReviewer(review) || profilesById.get(String(review.reviewer_id || "")))
    );
    reviewListCache.set(cacheKey, {
      expiresAt: Date.now() + REVIEW_LIST_CACHE_TTL_MS,
      reviews: enrichedReviews,
    });

    return reviewsJson(enrichedReviews);
  } catch (error) {
    console.error("Error in GET /api/reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
