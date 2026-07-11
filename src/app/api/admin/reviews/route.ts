import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";
import { syncReviewRatings } from "@/lib/reviews/sync-review-ratings";

type LooseRow = Record<string, any>;

function displayName(row?: LooseRow) {
  if (!row) return "AnyJob user";
  const first = String(row.first_name || "").trim();
  const last = String(row.last_name || "").trim();
  const company = String(row.company_name || row.business_name || "").trim();
  const email = String(row.email || row.contact_email || "").trim();
  return [first, last].filter(Boolean).join(" ") || company || email || "AnyJob user";
}

async function loadProfiles(admin: { from(table: string): any }, userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniqueIds.length) return new Map<string, { name: string; email: string }>();

  const [profilesResult, buyersResult, sellersResult, businessesResult] = await Promise.all([
    admin.from("eloo_profiles").select("id,first_name,last_name,email").in("id", uniqueIds),
    admin.from("buyers").select("id,first_name,last_name,email").in("id", uniqueIds),
    admin.from("sellers").select("id,first_name,last_name,email").in("id", uniqueIds),
    admin.from("business_profiles").select("owner_user_id,business_name,contact_email").in("owner_user_id", uniqueIds),
  ]);

  const rowsById = new Map<string, LooseRow>();
  for (const row of [...(profilesResult.data || []), ...(buyersResult.data || []), ...(sellersResult.data || [])]) {
    rowsById.set(String(row.id), row);
  }
  for (const row of businessesResult.data || []) {
    const ownerId = String(row.owner_user_id || "");
    if (ownerId && !rowsById.has(ownerId)) rowsById.set(ownerId, row);
  }

  return new Map(
    uniqueIds.map((id) => {
      const row = rowsById.get(id);
      return [id, { name: displayName(row), email: String(row?.email || row?.contact_email || "") }];
    })
  );
}

export async function GET() {
  try {
    const adminUser = await getAdminApiUser();
    if (!adminUser) return adminForbidden();

    const admin = createAdminSupabaseClient() as never as { from(table: string): any };
    const { data: reviews, error } = await admin
      .from("eloo_reviews")
      .select("id,reviewer_id,reviewee_id,rating,title,comment,review_type,service_inquiry_id,shift_application_id,business_work_post_id,is_public,created_at")
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = (reviews || []).flatMap((review: LooseRow) => [String(review.reviewer_id || ""), String(review.reviewee_id || "")]);
    const profiles = await loadProfiles(admin, userIds);

    const enriched = (reviews || []).map((review: LooseRow) => ({
      ...review,
      reviewer: profiles.get(String(review.reviewer_id || "")) || { name: "AnyJob user", email: "" },
      reviewee: profiles.get(String(review.reviewee_id || "")) || { name: "AnyJob user", email: "" },
    }));

    return NextResponse.json({ reviews: enriched });
  } catch (error) {
    console.error("Admin review lookup failed:", error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminUser = await getAdminApiUser();
    if (!adminUser) return adminForbidden();

    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const reviewId = String(body.reviewId || url.searchParams.get("reviewId") || "");
    const reason = String(body.reason || "Deleted by admin").trim() || "Deleted by admin";

    if (!reviewId) {
      return NextResponse.json({ error: "Review id is required" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient() as never as { from(table: string): any };
    const { data: review, error: lookupError } = await admin
      .from("eloo_reviews")
      .select("*")
      .eq("id", reviewId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const { error: deleteError } = await admin
      .from("eloo_reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    await logAdminAction({
      actorId: adminUser.id,
      action: "reviews.delete",
      targetType: "review",
      targetId: reviewId,
      metadata: { reason, review },
    });

    void syncReviewRatings({ userId: String(review.reviewee_id || "") }).then((result) => {
      if (!result.ok && !result.skipped) console.error("Review rating sync failed:", result.error);
    });

    return NextResponse.json({ ok: true, reviewId });
  } catch (error) {
    console.error("Admin review delete failed:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
