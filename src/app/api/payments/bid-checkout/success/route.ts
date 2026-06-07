import { acceptBidAndUnlockChat } from "@/lib/bids/accept-bid";
import { getStripe } from "@/lib/stripe/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const fallbackUrl = new URL("/", request.url);

  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      fallbackUrl.pathname = "/dashboard/requests";
      fallbackUrl.searchParams.set("payment", "missing_session");
      return NextResponse.redirect(fallbackUrl);
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const bidId = session.metadata?.bid_id;
    const inquiryId = session.metadata?.inquiry_id;
    const buyerId = session.metadata?.buyer_id;

    if (
      session.metadata?.type !== "bid_acceptance_fee" ||
      !bidId ||
      !inquiryId ||
      !buyerId ||
      session.payment_status !== "paid"
    ) {
      fallbackUrl.pathname = inquiryId ? `/dashboard/requests/${inquiryId}` : "/dashboard/requests";
      fallbackUrl.searchParams.set("payment", "not_paid");
      return NextResponse.redirect(fallbackUrl);
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== buyerId) {
      fallbackUrl.pathname = `/dashboard/requests/${inquiryId}`;
      fallbackUrl.searchParams.set("payment", "auth_required");
      return NextResponse.redirect(fallbackUrl);
    }

    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("id,inquiry_id,provider_id,status,inquiry:service_inquiries!bids_inquiry_id_fkey(user_id)")
      .eq("id", bidId)
      .single();

    const inquiry = Array.isArray(bid?.inquiry) ? bid?.inquiry[0] : bid?.inquiry;

    if (bidError || !bid || !inquiry || inquiry.user_id !== user.id) {
      fallbackUrl.pathname = `/dashboard/requests/${inquiryId}`;
      fallbackUrl.searchParams.set("payment", "bid_not_found");
      return NextResponse.redirect(fallbackUrl);
    }

    await acceptBidAndUnlockChat(supabase, { ...bid, inquiry });

    fallbackUrl.pathname = `/dashboard/requests/${inquiryId}`;
    fallbackUrl.searchParams.set("payment", "success");
    return NextResponse.redirect(fallbackUrl);
  } catch (error) {
    console.error("Bid checkout confirmation failed:", error);
    fallbackUrl.pathname = "/dashboard/requests";
    fallbackUrl.searchParams.set("payment", "failed");
    return NextResponse.redirect(fallbackUrl);
  }
}
