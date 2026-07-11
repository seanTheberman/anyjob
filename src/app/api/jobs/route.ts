import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getBuyerTrustForUsers } from "@/lib/badges/buyer-trust";
import { getBuyerKycStatus } from "@/lib/kyc/buyer-kyc";
import { NextRequest, NextResponse } from "next/server";

function coarsePostalCode(postalCode?: string | null) {
  const prefix = postalCode?.trim().slice(0, 3);
  return prefix ? `${prefix} area` : "";
}

function distanceKm(fromLat?: number | null, fromLng?: number | null, toLat?: number | null, toLng?: number | null) {
  if (fromLat == null || fromLng == null || toLat == null || toLng == null) return null;
  const radiusKm = 6371;
  const latDelta = ((toLat - fromLat) * Math.PI) / 180;
  const lngDelta = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);
  return Math.round(radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function averageRating(rows: Array<{ rating?: number | null }>) {
  const values = rows.map((row) => Number(row.rating || 0)).filter((value) => Number.isFinite(value) && value > 0);
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

// GET: Fetch available jobs for providers to browse and bid on
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = createAdminSupabaseClient() as never as { from(table: string): any };
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const city = searchParams.get("city");

    // Fetch approved/open inquiries for bidding. In the current Supabase enum,
    // "submitted" is the live/admin-approved value and "pending" is review.
    let query = supabase
      .from("service_inquiries")
      .select("*")
      .eq("status", "submitted")
      .neq("user_id", user.id)
      .order("submitted_at", { ascending: false });

    if (category) {
      query = query.eq("category_slug", category);
    }
    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    const { data: jobs, error } = await query;
    if (error) throw error;

    const { data: providerProfile } = await supabase
      .from("eloo_profiles")
      .select("latitude, longitude")
      .eq("id", user.id)
      .maybeSingle();

    const buyerIds = Array.from(new Set((jobs || []).map((job) => String(job.user_id || "")).filter(Boolean)));
    const buyerKycByUser = new Map(
      await Promise.all(
        buyerIds.map(async (buyerId) => {
          const status = await getBuyerKycStatus(admin, buyerId);
          return [buyerId, status] as const;
        })
      )
    );
    const visibleJobs = (jobs || []).filter((job) => buyerKycByUser.get(String(job.user_id || ""))?.isComplete);
    const buyerTrustByUser = await getBuyerTrustForUsers(admin, buyerIds);
    const buyerRatingsResult = buyerIds.length
      ? await admin
          .from("eloo_reviews")
          .select("reviewee_id,rating")
          .in("reviewee_id", buyerIds)
          .eq("review_type", "seller_to_buyer")
          .eq("is_public", true)
      : { data: [], error: null };
    const buyerRatingRows = buyerRatingsResult.error ? [] : buyerRatingsResult.data || [];
    const buyerRatingsByUser = new Map<string, { rating: number; reviewCount: number }>();
    for (const buyerId of buyerIds) {
      const rows = ((buyerRatingRows || []) as Array<{ reviewee_id?: string | null; rating?: number | null }>)
        .filter((row) => row.reviewee_id === buyerId);
      buyerRatingsByUser.set(buyerId, {
        rating: averageRating(rows),
        reviewCount: rows.length,
      });
    }

    // For each job, get the bid count and whether current provider already bid
    const jobsWithBidInfo = await Promise.all(
      visibleJobs.map(async (job) => {
        const { count: bidCount } = await supabase
          .from("bids")
          .select("*", { count: "exact", head: true })
          .eq("inquiry_id", job.id);

        const { data: myBid } = await supabase
          .from("bids")
          .select("id, amount, status")
          .eq("inquiry_id", job.id)
          .eq("provider_id", user.id)
          .single();

        // Use the admin client here because providers are allowed to inspect
        // job photos even when storage rows are hidden by owner-only RLS.
        const { data: workImages } = await admin
          .from("user_images")
          .select("id, image_url, created_at")
          .eq("inquiry_id", job.id)
          .eq("image_type", "work_image")
          .order("created_at", { ascending: true });

        const coarseLabel = job.coarse_location_label || [job.city, coarsePostalCode(job.postal_code)].filter(Boolean).join(", ");
        const safeJob = { ...job };
        delete safeJob.address;
        delete safeJob.latitude;
        delete safeJob.longitude;
        delete safeJob.postal_code;
        delete safeJob.user_id;
        const buyerRating = buyerRatingsByUser.get(String(job.user_id || ""));

        return {
          ...safeJob,
          address: coarseLabel || "Approximate location shared after quote",
          postal_code: coarsePostalCode(job.postal_code),
          coarse_location_label: coarseLabel,
          coarse_latitude: job.coarse_latitude,
          coarse_longitude: job.coarse_longitude,
          distance_km: distanceKm(
            providerProfile?.latitude ? Number(providerProfile.latitude) : null,
            providerProfile?.longitude ? Number(providerProfile.longitude) : null,
            job.coarse_latitude ? Number(job.coarse_latitude) : null,
            job.coarse_longitude ? Number(job.coarse_longitude) : null
          ),
          bid_count: bidCount || 0,
          my_bid: myBid || null,
          work_image_count: workImages?.length || 0,
          work_images: (workImages || []).map((image: { id: string; image_url: string }) => ({
            id: image.id,
            image_url: image.image_url,
          })),
          buyer_rating: buyerRating?.reviewCount ? buyerRating.rating : undefined,
          buyer_review_count: buyerRating?.reviewCount || undefined,
          buyerTrust: buyerTrustByUser.get(String(job.user_id || "")) || null,
        };
      })
    );

    return NextResponse.json({ jobs: jobsWithBidInfo });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
