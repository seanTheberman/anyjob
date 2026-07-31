import { NextRequest, NextResponse } from "next/server";

import { acceptBidAndUnlockChat } from "@/lib/bids/accept-bid";
import { getStripe } from "@/lib/stripe/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const fallbackUrl = new URL("/anyjob-select/thank-you", request.url);

  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      fallbackUrl.searchParams.set("status", "missing_session");
      return NextResponse.redirect(fallbackUrl);
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const selectionId = session.metadata?.selection_id;
    const token = session.metadata?.token || "";

    if (
      session.metadata?.type !== "anyjob_select_quote_acceptance_fee" ||
      !selectionId ||
      session.payment_status !== "paid"
    ) {
      fallbackUrl.searchParams.set("status", "not_paid");
      if (token) fallbackUrl.searchParams.set("token", token);
      return NextResponse.redirect(fallbackUrl);
    }

    const supabase = createAdminSupabaseClient() as never as { from(table: string): any };
    const { data: selection, error } = await supabase
      .from("admin_select_quote_acceptances")
      .select("*, bid:bids!admin_select_quote_acceptances_bid_id_fkey(*, inquiry:service_inquiries!bids_inquiry_id_fkey(*))")
      .eq("id", selectionId)
      .maybeSingle();

    const bid = selection?.bid;
    const inquiry = Array.isArray(bid?.inquiry) ? bid?.inquiry[0] : bid?.inquiry;
    if (error || !selection || !bid || !inquiry) {
      fallbackUrl.searchParams.set("status", "selection_not_found");
      if (token) fallbackUrl.searchParams.set("token", token);
      return NextResponse.redirect(fallbackUrl);
    }

    await acceptBidAndUnlockChat(createAdminSupabaseClient() as any, { ...bid, inquiry });
    const paidAt = new Date().toISOString();
    await supabase
      .from("admin_select_quote_acceptances")
      .update({
        status: "paid",
        paid_at: paidAt,
        stripe_checkout_session_id: session.id,
      })
      .eq("id", selection.id);
    await supabase
      .from("service_inquiries")
      .update({
        select_quote_payment_status: "paid",
        select_quote_selected_bid_id: bid.id,
        select_quote_selected_at: selection.selected_at || paidAt,
        updated_at: paidAt,
      })
      .eq("id", inquiry.id);

    if (inquiry.admin_posted_by) {
      await supabase.from("eloo_notifications").insert({
        user_id: inquiry.admin_posted_by,
        title: "AnyJob Select payment received",
        message: `${selection.recipient_email} paid to start the selected quote.`,
        type: "anyjob_select_quote_paid",
        action_url: `/admin/jobs?tab=all&q=${String(inquiry.id).slice(0, 8)}`,
        is_read: false,
        data: {
          inquiry_id: inquiry.id,
          bid_id: bid.id,
          selection_id: selection.id,
          stripe_checkout_session_id: session.id,
        },
      });
    }

    fallbackUrl.searchParams.set("status", "paid");
    fallbackUrl.searchParams.set("job", String(inquiry.id).slice(0, 8));
    return NextResponse.redirect(fallbackUrl);
  } catch (error) {
    console.error("AnyJob Select checkout confirmation failed:", error);
    fallbackUrl.searchParams.set("status", "failed");
    return NextResponse.redirect(fallbackUrl);
  }
}
