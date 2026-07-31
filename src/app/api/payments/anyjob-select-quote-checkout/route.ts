import { NextRequest, NextResponse } from "next/server";

import { acceptBidAndUnlockChat } from "@/lib/bids/accept-bid";
import { verifyAnyJobSelectToken } from "@/lib/anyjob-select";
import { calculateBookingTokenBreakdown } from "@/lib/booking-token";
import { getStripe, getStripeSecretKey } from "@/lib/stripe/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function selectedQuote(token: string) {
  const supabase = createAdminSupabaseClient() as never as { from(table: string): any };
  const { data, error } = await supabase
    .from("admin_select_quote_acceptances")
    .select("*, bid:bids!admin_select_quote_acceptances_bid_id_fkey(*, inquiry:service_inquiries!bids_inquiry_id_fkey(*))")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function selectedQuoteFromSignedToken(token: string) {
  const payload = verifyAnyJobSelectToken(token);
  if (!payload) return null;
  const supabase = createAdminSupabaseClient() as never as { from(table: string): any };
  const { data: bid, error } = await supabase
    .from("bids")
    .select("*, inquiry:service_inquiries!bids_inquiry_id_fkey(*)")
    .eq("id", payload.bidId)
    .eq("inquiry_id", payload.inquiryId)
    .maybeSingle();
  if (error || !bid) return null;
  return {
    id: `signed:${payload.bidId}`,
    token,
    recipient_email: payload.recipientEmail,
    status: "selected",
    signedTokenFallback: true,
    bid,
  };
}

export async function GET(request: NextRequest) {
  const token = String(request.nextUrl.searchParams.get("token") || "");
  const fallbackUrl = new URL("/anyjob-select/thank-you", request.url);
  if (!token) {
    fallbackUrl.searchParams.set("status", "invalid");
    return NextResponse.redirect(fallbackUrl);
  }

  try {
    let selection = null;
    try {
      selection = await selectedQuote(token);
    } catch (error) {
      console.error("AnyJob Select table lookup failed, trying signed token:", error);
      selection = await selectedQuoteFromSignedToken(token);
    }
    const bid = selection?.bid;
    const inquiry = Array.isArray(bid?.inquiry) ? bid?.inquiry[0] : bid?.inquiry;
    if (!selection || !bid || !inquiry || !["selected", "emailed"].includes(String(selection.status || ""))) {
      fallbackUrl.searchParams.set("status", "unavailable");
      return NextResponse.redirect(fallbackUrl);
    }

    const breakdown = calculateBookingTokenBreakdown(Number(bid.amount || 0));
    if (breakdown.bookingToken <= 0) {
      fallbackUrl.searchParams.set("status", "invalid_amount");
      fallbackUrl.searchParams.set("token", token);
      return NextResponse.redirect(fallbackUrl);
    }

    if (process.env.ANYJOB_SELECT_STRIPE_ENABLED !== "true" || !getStripeSecretKey()) {
      const supabase = createAdminSupabaseClient() as any;
      await acceptBidAndUnlockChat(supabase, { ...bid, inquiry });
      if (!selection.signedTokenFallback) {
        await supabase
          .from("admin_select_quote_acceptances")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", selection.id);
      }
      fallbackUrl.searchParams.set("status", "paid");
      fallbackUrl.searchParams.set("mode", "dummy");
      return NextResponse.redirect(fallbackUrl);
    }

    const origin = request.nextUrl.origin;
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: selection.recipient_email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(breakdown.bookingToken * 100),
            product_data: {
              name: "AnyJob Select booking confirmation",
              description: "Confirms the provider selected from an AnyJob Select quote email.",
            },
          },
        },
      ],
      metadata: {
        type: "anyjob_select_quote_acceptance_fee",
        selection_id: selection.id,
        token,
        bid_id: bid.id,
        inquiry_id: bid.inquiry_id,
        buyer_email: selection.recipient_email,
        provider_id: bid.provider_id,
        seller_quote: String(breakdown.sellerQuote),
        anyjob_fee: String(breakdown.bookingToken),
        buyer_total: String(breakdown.buyerTotal),
      },
      success_url: `${origin}/api/payments/anyjob-select-quote-checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/anyjob-select/thank-you?status=cancelled&token=${encodeURIComponent(token)}`,
    });

    return NextResponse.redirect(session.url || fallbackUrl);
  } catch (error) {
    console.error("AnyJob Select checkout failed:", error);
    fallbackUrl.searchParams.set("status", "failed");
    fallbackUrl.searchParams.set("token", token);
    return NextResponse.redirect(fallbackUrl);
  }
}
