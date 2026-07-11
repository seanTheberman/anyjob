import { NextRequest, NextResponse } from "next/server";

import { notifyJobEvent } from "@/lib/notifications/email-functions";
import { getPlanById, getProviderPlanRules } from "@/lib/plans/provider-plan-server";
import { getStripe } from "@/lib/stripe/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function isoFromSeconds(value: unknown) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

function oneMonthFromNow() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export async function GET(request: NextRequest) {
  const fallbackUrl = new URL("/pricing", request.url);

  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      fallbackUrl.searchParams.set("subscription", "missing_session");
      return NextResponse.redirect(fallbackUrl);
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const userId = session.metadata?.user_id;
    const planId = session.metadata?.plan_id;

    if (
      session.metadata?.type !== "provider_plan_subscription" ||
      !userId ||
      !planId ||
      session.mode !== "subscription" ||
      session.status !== "complete"
    ) {
      fallbackUrl.searchParams.set("subscription", "not_complete");
      return NextResponse.redirect(fallbackUrl);
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      fallbackUrl.searchParams.set("subscription", "auth_required");
      return NextResponse.redirect(fallbackUrl);
    }

    const admin = createAdminSupabaseClient();
    const rules = await getProviderPlanRules(admin as never);
    const plan = getPlanById(rules, planId);
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null;

    let stripeStatus = "active";
    let currentPeriodStart = new Date().toISOString();
    let currentPeriodEnd = oneMonthFromNow();

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subscriptionRecord = subscription as never as Record<string, unknown>;
      stripeStatus = String(subscriptionRecord.status || "active");
      currentPeriodStart = isoFromSeconds(subscriptionRecord.current_period_start) || currentPeriodStart;
      currentPeriodEnd = isoFromSeconds(subscriptionRecord.current_period_end) || currentPeriodEnd;
    }

    const { error: subscriptionError } = await (admin as never as { from(table: string): any })
      .from("provider_plan_subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_id: plan.id,
          status: ["active", "trialing"].includes(stripeStatus) ? stripeStatus : "active",
          stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id || null,
          stripe_checkout_session_id: session.id,
          stripe_subscription_id: subscriptionId,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (subscriptionError) {
      throw subscriptionError;
    }

    await notifyJobEvent({
      action: "provider_plan_subscription_success",
      tenantSlug: "default",
      userId: user.id,
      email: user.email,
      sessionId: session.id,
      planId: plan.id,
      planName: plan.name,
      applicationLimit: plan.applicationLimit,
      usageWindowDays: rules.usageWindowDays,
      currentPeriodEnd,
    });

    fallbackUrl.searchParams.set("subscription", "success");
    fallbackUrl.searchParams.set("plan", plan.id);
    return NextResponse.redirect(fallbackUrl);
  } catch (error) {
    console.error("Provider plan checkout confirmation failed:", error);
    fallbackUrl.searchParams.set("subscription", "failed");
    return NextResponse.redirect(fallbackUrl);
  }
}
