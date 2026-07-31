import { NextRequest, NextResponse } from "next/server";

import { verifyAnyJobSelectToken } from "@/lib/anyjob-select";
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
      throw selectionError || new Error("AnyJob Select quote selection not found");
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
    const payload = verifyAnyJobSelectToken(token);
    if (payload && payload.bidId === bidId) {
      try {
        const supabase = createAdminSupabaseClient() as never as { from(table: string): any };
        const { data: bid } = await supabase
          .from("bids")
          .select("*, inquiry:service_inquiries!bids_inquiry_id_fkey(*)")
          .eq("id", payload.bidId)
          .eq("inquiry_id", payload.inquiryId)
          .maybeSingle();
        const inquiry = Array.isArray(bid?.inquiry) ? bid?.inquiry[0] : bid?.inquiry;
        if (!bid || !inquiry || String(bid.status || "") !== "pending") {
          return NextResponse.redirect(thankYouUrl(request, { status: "unavailable", token }));
        }
        const now = new Date().toISOString();
        const breakdown = calculateBookingTokenBreakdown(Number(bid.amount || 0));
        await supabase.from("eloo_notifications").insert({
          user_id: payload.adminUserId || inquiry.user_id,
          title: "AnyJob Select quote chosen",
          message: `${payload.recipientEmail} wants to continue with this provider for ${String(inquiry.job_description || "the job").slice(0, 90)}.`,
          type: "anyjob_select_quote_selected",
          action_url: `/admin/jobs?tab=awaiting_buyer&q=${String(inquiry.id).slice(0, 8)}`,
          is_read: false,
          data: {
            inquiry_id: inquiry.id,
            bid_id: bid.id,
            recipient_email: payload.recipientEmail,
            buyer_total: breakdown.buyerTotal,
            selected_at: now,
            signed_token_fallback: true,
          },
        });
        return NextResponse.redirect(thankYouUrl(request, {
          status: "selected",
          token,
          job: String(inquiry.id).slice(0, 8),
        }));
      } catch (fallbackError) {
        console.error("AnyJob Select signed token acceptance failed:", fallbackError);
      }
    }
    console.error("AnyJob Select quote acceptance failed:", error);
    return NextResponse.redirect(thankYouUrl(request, { status: "failed", token }));
  }
}
