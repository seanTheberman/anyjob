import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getProviderApplicationEntitlement } from "@/lib/plans/provider-plan-server";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberOrNull(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Sign in as a provider before applying" }, { status: 401 });
    }

    const body = await request.json();
    const postId = text(body.postId);
    if (!postId) {
      return NextResponse.json({ error: "Shift post is required" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient() as never as { from: (table: string) => any };
    const { data: workerProfile, error: workerError } = await admin
      .from("shift_worker_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (workerError) {
      return NextResponse.json({ error: workerError.message }, { status: 500 });
    }

    if (!workerProfile || workerProfile.status !== "available") {
      return NextResponse.json({ error: "Shift work profile must be available before applying" }, { status: 403 });
    }

    const { data: post, error: postError } = await admin
      .from("business_work_posts")
      .select("*, business:business_profiles(id,status)")
      .eq("id", postId)
      .maybeSingle();

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }

    const business = post?.business as { status?: string } | null | undefined;
    const workerNiches = Array.isArray(workerProfile.niches) ? workerProfile.niches.map(String) : [];

    if (!post || !["approved", "submitted"].includes(String(post.status || "").toLowerCase()) || business?.status !== "approved" || post.work_type === "freelance_service") {
      return NextResponse.json({ error: "This shift is not open for applications" }, { status: 409 });
    }

    if (post.owner_user_id === user.id) {
      return NextResponse.json({ error: "Business owners cannot apply to their own shift" }, { status: 403 });
    }

    if (!workerNiches.includes(String(post.niche))) {
      return NextResponse.json({ error: "This shift does not match your enabled worker niches" }, { status: 403 });
    }

    const { data: existingApplication } = await admin
      .from("shift_applications")
      .select("id")
      .eq("business_work_post_id", post.id)
      .eq("provider_user_id", user.id)
      .maybeSingle();

    if (!existingApplication) {
      const entitlement = await getProviderApplicationEntitlement(admin, user.id);
      if (!entitlement.allowed) {
        return NextResponse.json(
          {
            error: entitlement.message,
            upgradeRequired: true,
            pricingUrl: "/pricing",
            plan: entitlement.plan,
            usage: entitlement.usage,
          },
          { status: 402 }
        );
      }
    }

    const { data: application, error: applyError } = await admin
      .from("shift_applications")
      .upsert(
        {
          business_work_post_id: post.id,
          business_id: post.business_id,
          owner_user_id: post.owner_user_id,
          provider_user_id: user.id,
          status: "applied",
          proposed_hourly_rate: numberOrNull(body.proposedHourlyRate) ?? numberOrNull(post.business_preferred_hourly_rate),
          proposed_day_rate: numberOrNull(body.proposedDayRate) ?? numberOrNull(post.business_preferred_day_rate),
          message: text(body.message) || null,
          applied_at: new Date().toISOString(),
        },
        { onConflict: "business_work_post_id,provider_user_id" }
      )
      .select("*")
      .single();

    if (applyError) {
      return NextResponse.json({ error: applyError.message }, { status: 500 });
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Shift application failed:", error);
    return NextResponse.json({ error: "Failed to apply for shift" }, { status: 500 });
  }
}
