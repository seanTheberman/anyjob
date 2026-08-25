import { NextRequest, NextResponse } from "next/server";

import { notifyJobEvent } from "@/lib/notifications/email-functions";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function cleanReason(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await auth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (body.action !== "reject") {
      return NextResponse.json({ error: "Unsupported private request action." }, { status: 400 });
    }

    const admin = createAdminSupabaseClient() as never as { from(table: string): any };
    const { data: inquiry, error: inquiryError } = await admin
      .from("service_inquiries")
      .select("id,user_id,target_provider_id,request_visibility,provider_decision_status,status")
      .eq("id", id)
      .maybeSingle();
    if (inquiryError) throw inquiryError;
    if (!inquiry || inquiry.request_visibility !== "private") {
      return NextResponse.json({ error: "Private request not found." }, { status: 404 });
    }
    if (inquiry.target_provider_id !== user.id) {
      return NextResponse.json({ error: "This request was sent to another provider." }, { status: 403 });
    }
    if (inquiry.provider_decision_status !== "pending") {
      return NextResponse.json({ error: "This request has already been reviewed." }, { status: 409 });
    }

    const timestamp = new Date().toISOString();
    const reason = cleanReason(body.reason);
    const { data: updated, error: updateError } = await admin
      .from("service_inquiries")
      .update({
        provider_decision_status: "rejected",
        provider_decision_at: timestamp,
        provider_rejection_reason: reason || null,
        status: "rejected",
        updated_at: timestamp,
      })
      .eq("id", id)
      .eq("target_provider_id", user.id)
      .eq("provider_decision_status", "pending")
      .select("*")
      .single();
    if (updateError) throw updateError;

    const { data: provider } = await admin
      .from("sellers")
      .select("first_name,last_name,email")
      .eq("id", user.id)
      .maybeSingle();
    const notificationResult = await notifyJobEvent({
      action: "direct_request_rejected",
      jobId: id,
      inquiryId: id,
      buyerUserId: inquiry.user_id,
      providerUserId: user.id,
      providerEmail: provider?.email || user.email,
      providerName: [provider?.first_name, provider?.last_name].filter(Boolean).join(" "),
      reason,
    });
    if (!notificationResult.ok) {
      console.error("Private request rejection email failed:", notificationResult);
    }

    return NextResponse.json({ inquiry: updated });
  } catch (error) {
    console.error("Private request rejection failed:", error);
    return NextResponse.json({ error: "Could not reject this private request." }, { status: 500 });
  }
}
