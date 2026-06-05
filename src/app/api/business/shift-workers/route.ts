import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SHIFT_NICHES } from "@/lib/shift-work";
import { NextRequest, NextResponse } from "next/server";

const VALID_NICHES = new Set(SHIFT_NICHES.map((niche) => niche.value));

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

    const { searchParams } = new URL(request.url);
    const niche = searchParams.get("niche") || "";

    if (!VALID_NICHES.has(niche as never)) {
      return NextResponse.json({ error: "Choose a valid niche to browse workers" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const adminDb = admin as never as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
            in: (column: string, values: string[]) => Promise<{ data: Array<Record<string, unknown>> | null; error: { message: string } | null }>;
          };
          contains: (column: string, value: string[]) => {
            limit: (count: number) => Promise<{ data: Array<Record<string, unknown>> | null; error: { message: string } | null }>;
          };
        };
      };
    };

    const { data: business, error: businessError } = await adminDb
      .from("business_profiles")
      .select("id,status")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (businessError) {
      return NextResponse.json({ error: businessError.message }, { status: 500 });
    }

    if (!business || business.status !== "approved") {
      return NextResponse.json({ error: "Business approval is required before browsing shift workers" }, { status: 403 });
    }

    const { data: workers, error: workerError } = await adminDb
      .from("shift_worker_profiles")
      .select("*")
      .contains("niches", [niche])
      .limit(50);

    if (workerError) {
      return NextResponse.json({ error: workerError.message }, { status: 500 });
    }

    const visibleWorkers = (workers || []).filter((worker) => worker.status === "available");
    const workerIds = visibleWorkers.map((worker) => String(worker.user_id)).filter(Boolean);

    const [profilesResult, sellersResult] = workerIds.length
      ? await Promise.all([
          adminDb.from("eloo_profiles").select("id,first_name,last_name,city,avatar_url,is_verified,kyc_status").eq("role", "provider").in("id", workerIds),
          adminDb.from("sellers").select("id,first_name,last_name,city,service_category,status,rating,total_jobs").eq("status", "approved").in("id", workerIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];

    if (profilesResult.error || sellersResult.error) {
      return NextResponse.json(
        { error: profilesResult.error?.message || sellersResult.error?.message || "Failed to load worker profiles" },
        { status: 500 }
      );
    }

    const profilesById = new Map((profilesResult.data || []).map((profile) => [String(profile.id), profile]));
    const sellersById = new Map((sellersResult.data || []).map((seller) => [String(seller.id), seller]));

    const enrichedWorkers = visibleWorkers.map((worker) => ({
      ...worker,
      profile: profilesById.get(String(worker.user_id)) || null,
      seller: sellersById.get(String(worker.user_id)) || null,
    }));
    return NextResponse.json({ workers: enrichedWorkers });
  } catch (error) {
    console.error("Eligible shift worker lookup failed:", error);
    return NextResponse.json({ error: "Failed to load shift workers" }, { status: 500 });
  }
}
