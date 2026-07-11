import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient();
    const adminDb = admin as never as { from: (table: string) => any };

    const { data: workerProfile, error: workerError } = await adminDb
      .from("shift_worker_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (workerError) {
      return NextResponse.json({ error: workerError.message }, { status: 500 });
    }

    if (!workerProfile || workerProfile.status !== "available") {
      return NextResponse.json({ jobs: [], reason: "Shift work is available after choosing shift work in provider onboarding." });
    }

    const niches = Array.isArray(workerProfile.niches) ? workerProfile.niches.map(String).filter(Boolean) : [];
    if (!niches.length) {
      return NextResponse.json({ jobs: [], reason: "Add at least one shift niche to see business shift jobs." });
    }

    const { searchParams } = new URL(request.url);
    const nicheFilter = searchParams.get("niche");
    if (nicheFilter && !niches.includes(nicheFilter)) {
      return NextResponse.json({
        jobs: [],
        workerProfile,
        reason: "This niche is not enabled in your shift-worker profile yet.",
      });
    }

    const requestedNiches = nicheFilter ? [nicheFilter] : niches;

    const { data: openJobs, error: jobsError } = await adminDb
      .from("business_work_posts")
      .select("*, business:business_profiles(id,business_name,status,industry,city)")
      .eq("status", "submitted")
      .in("niche", requestedNiches)
      .order("created_at", { ascending: false });

    if (jobsError) {
      return NextResponse.json({ error: jobsError.message }, { status: 500 });
    }

    const visibleJobs = (openJobs || []).filter((job: Record<string, unknown>) => {
      const business = job.business as { status?: string } | null;
      return business?.status === "approved" && job.work_type !== "freelance_service";
    });

    const { data: applications, error: applicationsError } = await adminDb
      .from("shift_applications")
      .select("*, payment:shift_escrow_payments(*), post:business_work_posts(*, business:business_profiles(id,business_name,status,industry,city))")
      .eq("provider_user_id", user.id)
      .order("created_at", { ascending: false });

    if (applicationsError) {
      return NextResponse.json({ error: applicationsError.message }, { status: 500 });
    }

    const applicationRows = ((applications || []) as Array<Record<string, unknown>>).filter((application) => {
      const post = application.post as Record<string, unknown> | null;
      const business = post?.business as { status?: string } | null;
      return (
        post &&
        business?.status === "approved" &&
        post.work_type !== "freelance_service" &&
        requestedNiches.includes(String(post.niche || "")) &&
        !["rejected", "withdrawn"].includes(String(application.status || "").toLowerCase())
      );
    });

    const applicationIds = applicationRows.map((application) => String(application.id));
    const { data: reviews } = applicationIds.length
      ? await adminDb
          .from("eloo_reviews")
          .select("id,shift_application_id,review_type,reviewer_id,reviewee_id,rating,title,comment,created_at")
          .eq("reviewer_id", user.id)
          .in("shift_application_id", applicationIds)
      : { data: [] };

    const reviewsByApplication = new Map(
      ((reviews || []) as Array<Record<string, unknown>>).map((review) => [String(review.shift_application_id || ""), review])
    );

    const applicationsByPost = new Map(applicationRows.map((application) => {
      const payment = Array.isArray(application.payment) ? application.payment[0] || null : application.payment || null;
      const appWithRelations = {
        ...application,
        payment,
        myReview: reviewsByApplication.get(String(application.id)) || null,
      };
      return [String(application.business_work_post_id), appWithRelations];
    }));

    const jobsById = new Map<string, Record<string, unknown>>();
    visibleJobs.forEach((job: Record<string, unknown>) => {
      jobsById.set(String(job.id), job);
    });
    applicationRows.forEach((application) => {
      const post = application.post as Record<string, unknown> | null;
      if (post) jobsById.set(String(post.id), post);
    });

    return NextResponse.json({
      jobs: Array.from(jobsById.values()).map((job) => ({
        ...job,
        myApplication: applicationsByPost.get(String(job.id)) || null,
      })),
      workerProfile,
    });
  } catch (error) {
    console.error("Shift board lookup failed:", error);
    return NextResponse.json({ error: "Failed to load shift jobs" }, { status: 500 });
  }
}
