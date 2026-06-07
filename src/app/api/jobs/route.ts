import { createServerSupabaseClient } from "@/lib/supabase/server";
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

// GET: Fetch available jobs for providers to browse and bid on
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const city = searchParams.get("city");

    // Fetch open inquiries for bidding. "submitted" is the canonical live status.
    let query = supabase
      .from("service_inquiries")
      .select("*")
      .in("status", ["submitted", "live", "open", "pending"])
      .neq("user_id", user.id)
      .order("submitted_at", { ascending: false });

    console.log("Jobs query:", query);

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

    // For each job, get the bid count and whether current provider already bid
    const jobsWithBidInfo = await Promise.all(
      (jobs || []).map(async (job) => {
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

        // Get work images count
        const { count: imageCount } = await supabase
          .from("user_images")
          .select("*", { count: "exact", head: true })
          .eq("inquiry_id", job.id)
          .eq("image_type", "work_image");

        const coarseLabel = job.coarse_location_label || [job.city, coarsePostalCode(job.postal_code)].filter(Boolean).join(", ");
        const safeJob = { ...job };
        delete safeJob.address;
        delete safeJob.latitude;
        delete safeJob.longitude;
        delete safeJob.postal_code;

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
          work_image_count: imageCount || 0,
        };
      })
    );

    return NextResponse.json({ jobs: jobsWithBidInfo });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
