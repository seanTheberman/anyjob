import { getStripe } from "@/lib/stripe/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type LooseAdminClient = {
  from: (table: string) => any;
};

export async function GET(request: NextRequest) {
  const fallbackUrl = new URL("/dashboard/business", request.url);

  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      fallbackUrl.searchParams.set("payment", "missing_session");
      return NextResponse.redirect(fallbackUrl);
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentId = session.metadata?.payment_id;
    const applicationId = session.metadata?.shift_application_id;
    const ownerUserId = session.metadata?.owner_user_id;

    if (
      session.metadata?.type !== "shift_escrow_payment" ||
      !paymentId ||
      !applicationId ||
      !ownerUserId ||
      session.payment_status !== "paid"
    ) {
      fallbackUrl.searchParams.set("payment", "not_paid");
      return NextResponse.redirect(fallbackUrl);
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== ownerUserId) {
      fallbackUrl.searchParams.set("payment", "auth_required");
      return NextResponse.redirect(fallbackUrl);
    }

    const admin = createAdminSupabaseClient() as never as LooseAdminClient;
    const { data: payment, error: paymentError } = await admin
      .from("shift_escrow_payments")
      .select("*, application:shift_applications(*), post:business_work_posts(*)")
      .eq("id", paymentId)
      .eq("shift_application_id", applicationId)
      .maybeSingle();

    if (paymentError || !payment || payment.owner_user_id !== user.id) {
      fallbackUrl.searchParams.set("payment", "payment_not_found");
      return NextResponse.redirect(fallbackUrl);
    }

    const post = Array.isArray(payment.post) ? payment.post[0] || null : payment.post || null;
    const paidAt = new Date().toISOString();
    const reference = session.payment_intent
      ? `STRIPE-${String(session.payment_intent)}`
      : `STRIPE-CHECKOUT-${session.id}`;

    const [paymentResult, walletResult] = await Promise.all([
      admin
        .from("shift_escrow_payments")
        .update({ status: "held", paid_at: paidAt, payment_reference: reference })
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
            description: `${post?.role_title || "Shift work"} payment held by AnyJob`,
          },
          { onConflict: "source_type,source_id" }
        )
        .select("*")
        .single(),
    ]);

    if (paymentResult.error || walletResult.error) {
      throw paymentResult.error || walletResult.error;
    }

    fallbackUrl.searchParams.set("payment", "success");
    fallbackUrl.searchParams.set("application", applicationId);
    return NextResponse.redirect(fallbackUrl);
  } catch (error) {
    console.error("Shift escrow checkout confirmation failed:", error);
    fallbackUrl.searchParams.set("payment", "failed");
    return NextResponse.redirect(fallbackUrl);
  }
}
