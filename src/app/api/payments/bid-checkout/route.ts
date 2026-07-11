import { calculateBookingTokenBreakdown } from "@/lib/booking-token";
import { acceptBidAndUnlockChat } from "@/lib/bids/accept-bid";
import { getStripe, getStripeSecretKey } from "@/lib/stripe/server";
import { getBuyerKycStatus } from "@/lib/kyc/buyer-kyc";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    const { bid_id: bidId } = await request.json();
    if (!bidId) {
      return NextResponse.json({ error: "bid_id is required" }, { status: 400 });
    }

    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("*, inquiry:service_inquiries!bids_inquiry_id_fkey(*)")
      .eq("id", bidId)
      .single();

    if (bidError || !bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    if (bid.inquiry.user_id !== user.id) {
      return NextResponse.json({ error: "Only the buyer can accept this bid" }, { status: 403 });
    }

    if (bid.status !== "pending") {
      return NextResponse.json({ error: "Only pending bids can be accepted" }, { status: 409 });
    }

    const admin = createAdminSupabaseClient() as never as { from(table: string): any };
    const buyerKyc = await getBuyerKycStatus(admin, user.id);
    if (!buyerKyc.isComplete) {
      return NextResponse.json(
        {
          error: `Complete buyer KYC before accepting a quote. Upload ${buyerKyc.missing.join(", ")} from Account.`,
          missingKyc: buyerKyc.missing,
        },
        { status: 403 }
      );
    }

    const breakdown = calculateBookingTokenBreakdown(Number(bid.amount));
    if (breakdown.bookingToken <= 0) {
      return NextResponse.json({ error: "Invalid bid amount" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    if (!getStripeSecretKey()) {
      const inquiry = Array.isArray(bid.inquiry) ? bid.inquiry[0] : bid.inquiry;
      await acceptBidAndUnlockChat(supabase, { ...bid, inquiry });
      return NextResponse.json({
        checkoutUrl: `${origin}/dashboard/requests/${bid.inquiry_id}?payment=success&mode=dummy`,
        dummyPayment: true,
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(breakdown.bookingToken * 100),
            product_data: {
              name: "AnyJob booking confirmation",
              description: "Confirms the provider and unlocks chat and contact details.",
            },
          },
        },
      ],
      metadata: {
        type: "bid_acceptance_fee",
        bid_id: bid.id,
        inquiry_id: bid.inquiry_id,
        buyer_id: user.id,
        provider_id: bid.provider_id,
        seller_quote: String(breakdown.sellerQuote),
        anyjob_fee: String(breakdown.bookingToken),
        buyer_total: String(breakdown.buyerTotal),
      },
      success_url: `${origin}/api/payments/bid-checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/requests/${bid.inquiry_id}?payment=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Bid checkout creation failed:", error);
    const message = error instanceof Error ? error.message : "Failed to create Stripe checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
