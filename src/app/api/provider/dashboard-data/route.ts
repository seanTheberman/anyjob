import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFastAuthUser } from "@/lib/auth/fast-user";

type LooseAdminClient = {
  from(table: string): any;
};

async function currentUser() {
  const supabase = await createServerSupabaseClient();
  return getFastAuthUser(supabase);
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient() as never as LooseAdminClient;
  const [reviewsResult, givenReviewsResult, bookingsResult, serviceJobsResult, badgesResult, shiftsResult] = await Promise.all([
    admin
      .from("eloo_reviews")
      .select("id,rating,comment,created_at,reviewer:eloo_profiles!eloo_reviews_reviewer_id_fkey(first_name,last_name,avatar_url)")
      .eq("reviewee_id", user.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
    admin
      .from("eloo_reviews")
      .select("id,service_inquiry_id,shift_application_id,review_type")
      .eq("reviewer_id", user.id),
    admin
      .from("eloo_bookings")
      .select("id,city,address,scheduled_date,total_price,service:eloo_provider_services(title),client:eloo_profiles!eloo_bookings_client_id_fkey(first_name,last_name,avatar_url)")
      .eq("provider_id", user.id)
      .eq("status", "completed")
      .order("scheduled_date", { ascending: false }),
    admin
      .from("bids")
      .select("id,amount,status,inquiry:service_inquiries(id,user_id,job_description,city,status,preferred_date)")
      .eq("provider_id", user.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false }),
    admin
      .from("provider_badges")
      .select("id,awarded_at,awarded_reason,badge:badge_definitions!provider_badges_badge_id_fkey(name,description,icon,color)")
      .eq("provider_id", user.id)
      .order("awarded_at", { ascending: false }),
    admin
      .from("shift_applications")
      .select("*, post:business_work_posts(*, business:business_profiles(id,business_name,city,industry)), payment:shift_escrow_payments(*)")
      .eq("provider_user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false }),
  ]);

  if (reviewsResult.error || givenReviewsResult.error || bookingsResult.error || serviceJobsResult.error || badgesResult.error || shiftsResult.error) {
    return NextResponse.json(
      { error: reviewsResult.error?.message || givenReviewsResult.error?.message || bookingsResult.error?.message || serviceJobsResult.error?.message || badgesResult.error?.message || shiftsResult.error?.message || "Could not load provider data." },
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

  const shiftIds = (shiftsResult.data || []).map((application: { id: string }) => application.id);
  const shiftReviewsResult = shiftIds.length
    ? await admin
      .from("eloo_reviews")
      .select("id,shift_application_id,review_type,reviewer_id,reviewee_id,rating,title,comment,created_at")
      .in("shift_application_id", shiftIds)
    : { data: [], error: null };

  if (shiftReviewsResult.error) {
    return NextResponse.json({ error: shiftReviewsResult.error.message }, { status: 500 });
  }

  const completedServiceJobs = ((serviceJobsResult.data || []) as Array<Record<string, any>>)
    .map((bid) => ({
      ...bid,
      inquiry: Array.isArray(bid.inquiry) ? bid.inquiry[0] || null : bid.inquiry || null,
    }))
    .filter((bid) => ["completed", "converted"].includes(String(bid.inquiry?.status || "").toLowerCase()));

  return NextResponse.json({
    reviews: reviewsResult.data || [],
    givenReviews: givenReviewsResult.data || [],
    bookings: bookingsResult.data || [],
    completedServiceJobs,
    bookingReviews: bookingReviewsResult.data || [],
    badges: badgesResult.data || [],
    shiftApplications: (shiftsResult.data || []).map((application: Record<string, unknown>) => ({
      ...application,
      payment: Array.isArray(application.payment) ? application.payment[0] || null : application.payment || null,
      post: Array.isArray(application.post) ? application.post[0] || null : application.post || null,
    })),
    shiftReviews: shiftReviewsResult.data || [],
  });
}
