import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LooseAdminClient = {
  from(table: string): any;
};

async function currentUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient() as never as LooseAdminClient;
  const [reviewsResult, bookingsResult, badgesResult] = await Promise.all([
    admin
      .from("eloo_reviews")
      .select("id,rating,comment,created_at,reviewer:eloo_profiles!eloo_reviews_reviewer_id_fkey(first_name,last_name,avatar_url)")
      .eq("reviewee_id", user.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
    admin
      .from("eloo_bookings")
      .select("id,city,address,scheduled_date,total_price,service:eloo_provider_services(title),client:eloo_profiles!eloo_bookings_client_id_fkey(first_name,last_name,avatar_url)")
      .eq("provider_id", user.id)
      .eq("status", "completed")
      .order("scheduled_date", { ascending: false }),
    admin
      .from("provider_badges")
      .select("id,awarded_at,awarded_reason,badge:badge_definitions!provider_badges_badge_id_fkey(name,description,icon,color)")
      .eq("provider_id", user.id)
      .order("awarded_at", { ascending: false }),
  ]);

  if (reviewsResult.error || bookingsResult.error || badgesResult.error) {
    return NextResponse.json(
      { error: reviewsResult.error?.message || bookingsResult.error?.message || badgesResult.error?.message || "Could not load provider data." },
      { status: 500 },
    );
  }

  const bookingIds = (bookingsResult.data || []).map((booking: { id: string }) => booking.id);
  const bookingReviewsResult = bookingIds.length
    ? await admin
      .from("eloo_reviews")
      .select("booking_id,rating,comment")
      .in("booking_id", bookingIds)
    : { data: [], error: null };

  if (bookingReviewsResult.error) {
    return NextResponse.json({ error: bookingReviewsResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    reviews: reviewsResult.data || [],
    bookings: bookingsResult.data || [],
    bookingReviews: bookingReviewsResult.data || [],
    badges: badgesResult.data || [],
  });
}
