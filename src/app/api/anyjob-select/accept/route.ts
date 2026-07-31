import { NextRequest, NextResponse } from "next/server";

import { calculateBookingTokenBreakdown } from "@/lib/booking-token";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function thankYouUrl(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/anyjob-select/thank-you", request.url);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

export async function GET(request: NextRequest) {
  const token = String(request.nextUrl.searchParams.get("token") || "");
  const bidId = String(request.nextUrl.searchParams.get("bid") || "");

  if (!token || !bidId) {
    return NextResponse.redirect(thankYouUrl(request, { status: "invalid" }));
  }

  try {
    const supabase = createAdminSupabaseClient() as never as { from(table: string): any };
    const { data: selection, error: selectionError } = await supabase
      .from("admin_select_quote_acceptances")
      .select("*, bid:bids!admin_select_quote_acceptances_bid_id_fkey(*, inquiry:service_inquiries!bids_inquiry_id_fkey(*))")
      .eq("token", token)
      .eq("bid_id", bidId)
      .maybeSingle();

    const bid = selection?.bid;
    const inquiry = Array.isArray(bid?.inquiry) ? bid?.inquiry[0] : bid?.inquiry;
    if (selectionError || !selection || !bid || !inquiry) {
      return NextResponse.redirect(thankYouUrl(request, { status: "invalid" }));
    }

    if (String(bid.status || "") !== "pending" && String(selection.status || "") !== "paid") {
      return NextResponse.redirect(thankYouUrl(request, { status: "unavailable", token }));
    }

    const now = new Date().toISOString();
    const breakdown = calculateBookingTokenBreakdown(Number(bid.amount || 0));

    if (String(selection.status || "") === "emailed") {
      await supabase
        .from("admin_select_quote_acceptances")
        .update({
          status: "selected",
          selected_at: now,
          metadata: {
            ...(selection.metadata || {}),
            selected_from_email_link: true,
            selected_buyer_total: breakdown.buyerTotal,
          },
        })
        .eq("id", selection.id);

      await supabase
        .from("service_inquiries")
        .update({
          select_quote_selected_bid_id: bid.id,
          select_quote_selected_at: now,
          updated_at: now,
        })
        .eq("id", inquiry.id);

      if (inquiry.admin_posted_by) {
        await supabase.from("eloo_notifications").insert({
          user_id: inquiry.admin_posted_by,
          title: "AnyJob Select quote chosen",
          message: `${selection.recipient_email} wants to continue with ${String((selection.metadata || {}).provider_name || "this provider")} for ${String(inquiry.job_description || "the job").slice(0, 90)}.`,
          type: "anyjob_select_quote_selected",
          action_url: `/admin/jobs?tab=awaiting_buyer&q=${String(inquiry.id).slice(0, 8)}`,
          is_read: false,
          data: {
            inquiry_id: inquiry.id,
            bid_id: bid.id,
            selection_id: selection.id,
            recipient_email: selection.recipient_email,
            buyer_total: breakdown.buyerTotal,
          },
        });
      }
    }

    return NextResponse.redirect(thankYouUrl(request, {
      status: "selected",
      token,
      job: String(inquiry.id).slice(0, 8),
    }));
  } catch (error) {
    console.error("AnyJob Select quote acceptance failed:", error);
    return NextResponse.redirect(thankYouUrl(request, { status: "failed", token }));
  }
}
