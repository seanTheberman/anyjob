import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    // Fetch submitted inquiries (open for bids) excluding user's own
    let query = supabase
      .from("service_inquiries")
      .select("*")
      .eq("status", "submitted")
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

        return {
          ...job,
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
