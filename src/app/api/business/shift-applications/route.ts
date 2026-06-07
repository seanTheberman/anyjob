import { calculateShiftAgreedAmount } from "@/lib/shift-payments";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function money(value: unknown) {
  const numeric = Number(value || 0);
  return Math.round(numeric * 100) / 100;
}

type LooseAdminClient = {
  from: (table: string) => any;
};

type LooseRow = Record<string, any>;

async function getUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient() as never as LooseAdminClient;
    const { data: applications, error } = await admin
      .from("shift_applications")
      .select("*, post:business_work_posts(*), payment:shift_escrow_payments(*)")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const applicationRows = (applications || []) as LooseRow[];
    const providerIds = Array.from(new Set(applicationRows.map((item: LooseRow) => item.provider_user_id).filter(Boolean)));
    const [profilesResult, sellersResult] = providerIds.length
      ? await Promise.all([
          admin.from("eloo_profiles").select("id,first_name,last_name,email,city,phone,is_verified").in("id", providerIds),
          admin.from("sellers").select("id,first_name,last_name,email,city,service_category,rating,total_jobs,status").in("id", providerIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];

    if (profilesResult.error || sellersResult.error) {
      return NextResponse.json(
        { error: profilesResult.error?.message || sellersResult.error?.message || "Failed to load provider profiles" },
        { status: 500 }
      );
    }

    const profiles = new Map(((profilesResult.data || []) as LooseRow[]).map((profile: LooseRow) => [profile.id, profile]));
    const sellers = new Map(((sellersResult.data || []) as LooseRow[]).map((seller: LooseRow) => [seller.id, seller]));

    const enriched = applicationRows.map((application: LooseRow) => ({
      ...application,
      provider: profiles.get(application.provider_user_id) || sellers.get(application.provider_user_id) || null,
      seller: sellers.get(application.provider_user_id) || null,
      payment: Array.isArray(application.payment) ? application.payment[0] || null : application.payment || null,
    }));

    return NextResponse.json({ applications: enriched });
  } catch (error) {
    console.error("Business shift applications lookup failed:", error);
    return NextResponse.json({ error: "Failed to load shift applications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const applicationId = text(body.applicationId);
    const action = text(body.action);
    if (!applicationId || !action) {
      return NextResponse.json({ error: "Application and action are required" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient() as never as LooseAdminClient;
    const { data: application, error: appError } = await admin
      .from("shift_applications")
      .select("*, post:business_work_posts(*)")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    if (!application || application.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Shift application not found" }, { status: 404 });
    }

    const post = application.post;

    if (action === "reject") {
      const { data, error } = await admin
        .from("shift_applications")
        .update({ status: "rejected" })
        .eq("id", applicationId)
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ application: data });
    }

    if (action === "accept") {
      if (application.status !== "applied" && application.status !== "accepted") {
        return NextResponse.json({ error: "Only applied shifts can be accepted" }, { status: 409 });
      }

      const agreedAmount = calculateShiftAgreedAmount(post, application);
      const platformFee = 0;
      const totalCharged = money(agreedAmount + platformFee);

      const [appResult, paymentResult] = await Promise.all([
        admin
          .from("shift_applications")
          .update({ status: "accepted", accepted_at: new Date().toISOString() })
          .eq("id", applicationId)
          .select("*")
          .single(),
        admin
          .from("shift_escrow_payments")
          .upsert(
            {
              business_work_post_id: application.business_work_post_id,
              shift_application_id: application.id,
              business_id: application.business_id,
              owner_user_id: application.owner_user_id,
              provider_user_id: application.provider_user_id,
              agreed_amount: agreedAmount,
              platform_fee: platformFee,
              total_charged: totalCharged,
              currency: "EUR",
              status: "requires_payment",
            },
            { onConflict: "shift_application_id" }
          )
          .select("*")
          .single(),
      ]);

      if (appResult.error || paymentResult.error) {
        return NextResponse.json({ error: appResult.error?.message || paymentResult.error?.message }, { status: 500 });
      }

      await admin.from("business_work_posts").update({ status: "filled" }).eq("id", application.business_work_post_id);
      return NextResponse.json({ application: appResult.data, payment: paymentResult.data });
    }

    const { data: payment, error: paymentLookupError } = await admin
      .from("shift_escrow_payments")
      .select("*")
      .eq("shift_application_id", applicationId)
      .maybeSingle();

    if (paymentLookupError) {
      return NextResponse.json({ error: paymentLookupError.message }, { status: 500 });
    }

    if (!payment) {
      return NextResponse.json({ error: "Accept the provider before payment actions" }, { status: 409 });
    }

    if (action === "pay") {
      if (payment.status !== "requires_payment" && payment.status !== "held") {
        return NextResponse.json({ error: "Payment is not waiting for business payment" }, { status: 409 });
      }

      const reference = `ANYJOB-SHIFT-${String(payment.id).slice(0, 8).toUpperCase()}`;
      const [paymentResult, walletResult] = await Promise.all([
        admin
          .from("shift_escrow_payments")
          .update({ status: "held", paid_at: new Date().toISOString(), payment_reference: reference })
          .eq("id", payment.id)
          .select("*")
          .single(),
        admin
          .from("provider_wallet_entries")
          .upsert(
            {
              provider_user_id: payment.provider_user_id,
              source_type: "shift_payment",
              source_id: payment.id,
              amount: payment.agreed_amount,
              currency: payment.currency || "EUR",
              status: "pending",
              description: `${post.role_title || "Shift work"} payment held by AnyJob`,
            },
            { onConflict: "source_type,source_id" }
          )
          .select("*")
          .single(),
      ]);

      if (paymentResult.error || walletResult.error) {
        return NextResponse.json({ error: paymentResult.error?.message || walletResult.error?.message }, { status: 500 });
      }
      return NextResponse.json({ payment: paymentResult.data, walletEntry: walletResult.data });
    }

    if (action === "complete") {
      if (payment.status !== "held" && payment.status !== "released") {
        return NextResponse.json({ error: "Business must pay AnyJob before completing the shift" }, { status: 409 });
      }

      const now = new Date().toISOString();
      const [appResult, paymentResult, walletResult, postResult] = await Promise.all([
        admin.from("shift_applications").update({ status: "completed", completed_at: now }).eq("id", applicationId).select("*").single(),
        admin.from("shift_escrow_payments").update({ status: "released", released_at: now }).eq("id", payment.id).select("*").single(),
        admin
          .from("provider_wallet_entries")
          .upsert(
            {
              provider_user_id: payment.provider_user_id,
              source_type: "shift_payment",
              source_id: payment.id,
              amount: payment.agreed_amount,
              currency: payment.currency || "EUR",
              status: "available",
              description: `${post.role_title || "Shift work"} credited after completion`,
              available_at: now,
            },
            { onConflict: "source_type,source_id" }
          )
          .select("*")
          .single(),
        admin.from("business_work_posts").update({ status: "completed" }).eq("id", application.business_work_post_id).select("*").single(),
      ]);

      if (appResult.error || paymentResult.error || walletResult.error || postResult.error) {
        return NextResponse.json(
          { error: appResult.error?.message || paymentResult.error?.message || walletResult.error?.message || postResult.error?.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ application: appResult.data, payment: paymentResult.data, walletEntry: walletResult.data });
    }

    return NextResponse.json({ error: "Unsupported shift action" }, { status: 400 });
  } catch (error) {
    console.error("Business shift action failed:", error);
    return NextResponse.json({ error: "Failed to update shift application" }, { status: 500 });
  }
}
