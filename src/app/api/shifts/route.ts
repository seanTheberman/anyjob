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
    const adminDb = admin as never as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
            in: (column: string, values: string[]) => {
              order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: Array<Record<string, unknown>> | null; error: { message: string } | null }>;
            };
          };
        };
      };
    };

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

    const { data: jobs, error: jobsError } = await adminDb
      .from("business_work_posts")
      .select("*, business:business_profiles(id,business_name,status,industry,city)")
      .eq("status", "submitted")
      .in("niche", requestedNiches)
      .order("created_at", { ascending: false });

    if (jobsError) {
      return NextResponse.json({ error: jobsError.message }, { status: 500 });
    }

    const visibleJobs = (jobs || []).filter((job) => {
      const business = job.business as { status?: string } | null;
      return business?.status === "approved" && job.work_type !== "freelance_service";
    });

    const visibleJobIds = visibleJobs.map((job) => String(job.id));
    const { data: applications } = visibleJobIds.length
      ? await (admin as never as {
          from: (table: string) => {
            select: (columns: string) => {
              eq: (column: string, value: string) => {
                in: (column: string, values: string[]) => Promise<{ data: Array<Record<string, unknown>> | null }>;
              };
            };
          };
        })
          .from("shift_applications")
          .select("*, payment:shift_escrow_payments(*)")
          .eq("provider_user_id", user.id)
          .in("business_work_post_id", visibleJobIds)
      : { data: [] };

    const applicationsByPost = new Map((applications || []).map((application) => {
      const payment = Array.isArray(application.payment) ? application.payment[0] || null : application.payment || null;
      return [String(application.business_work_post_id), { ...application, payment }];
    }));

    return NextResponse.json({
      jobs: visibleJobs.map((job) => ({
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
