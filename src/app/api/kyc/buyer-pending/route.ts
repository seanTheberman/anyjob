import { NextRequest, NextResponse } from "next/server";

import { getBuyerKycStatus } from "@/lib/kyc/buyer-kyc";
import { notifyJobEvent } from "@/lib/notifications/email-functions";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AdminClient = {
  from: (table: string) => any;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient() as never as AdminClient;
    const { data: job, error: jobError } = await admin
      .from("service_inquiries")
      .select("id,user_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) throw jobError;
    if (!job || job.user_id !== user.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const buyerKyc = await getBuyerKycStatus(admin, user.id);
    if (buyerKyc.isComplete) {
      return NextResponse.json({ ok: true, skipped: "buyer_kyc_complete" });
    }

    const result = await notifyJobEvent({
      action: "buyer_kyc_pending",
      tenantSlug: "default",
      jobId,
      buyerUserId: user.id,
      missingKyc: buyerKyc.missing,
    });

    if (!result.ok) {
      console.error("Buyer KYC pending email failed:", result);
      return NextResponse.json({ ok: true, emailQueued: false }, { status: 202 });
    }

    return NextResponse.json({ ok: true, emailQueued: true, result: result.body });
  } catch (error) {
    console.error("Buyer KYC pending notification failed:", error);
    return NextResponse.json({ error: "KYC notification could not be sent" }, { status: 500 });
  }
}
