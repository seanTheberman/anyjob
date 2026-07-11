import { NextRequest, NextResponse } from "next/server";

import { discountedMonthlyPrice, hasPlanDiscount } from "@/lib/plans/provider-plan-config";
import { getBuyerPlanById, getProviderPlanRules } from "@/lib/plans/provider-plan-server";
import { getStripe } from "@/lib/stripe/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sign in as a buyer before upgrading" }, { status: 401 });
    }

    const { planId } = await request.json();
    const admin = createAdminSupabaseClient();
    const rules = await getProviderPlanRules(admin as never);
    const plan = getBuyerPlanById(rules, String(planId || ""));

    if (!plan || plan.id === "buyer-free" || plan.priceMonthly <= 0) {
      return NextResponse.json({ checkoutUrl: "/dashboard/requests", free: true });
    }

    const origin = request.nextUrl.origin;
    const stripe = getStripe();
    const checkoutPrice = discountedMonthlyPrice(plan);
    const useStoredStripePrice = Boolean(plan.stripePriceId && (!hasPlanDiscount(plan) || plan.stripeCouponId));
    const lineItem = useStoredStripePrice
      ? { quantity: 1, price: plan.stripePriceId }
      : {
          quantity: 1,
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: Math.round(checkoutPrice * 100),
            recurring: { interval: "month" as const },
            product_data: {
              name: `AnyJob ${plan.name} buyer plan`,
              description: hasPlanDiscount(plan)
                ? `${plan.description} ${plan.discountPercent}% discount applied.`
                : plan.description,
            },
          },
        };
    const discounts = plan.stripeCouponId ? [{ coupon: plan.stripeCouponId }] : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email || undefined,
      line_items: [lineItem],
      discounts,
      metadata: {
        type: "buyer_plan_subscription",
        user_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name,
        price_monthly: String(plan.priceMonthly),
        discounted_price_monthly: String(checkoutPrice),
        discount_percent: String(plan.discountPercent || 0),
      },
      subscription_data: {
        metadata: {
          type: "buyer_plan_subscription",
          user_id: user.id,
          plan_id: plan.id,
          plan_name: plan.name,
        },
      },
      success_url: `${origin}/api/payments/buyer-plan-checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?subscription=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Buyer plan checkout creation failed:", error);
    const message = error instanceof Error ? error.message : "Failed to create buyer plan checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
