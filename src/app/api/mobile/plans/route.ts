import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFastAuthUser } from "@/lib/auth/fast-user";
import { getProviderActivePlan, getProviderPlanRules } from "@/lib/plans/provider-plan-server";

export async function GET() {
  const auth = await createServerSupabaseClient();
  const fastUser = await getFastAuthUser(auth);
  const user = fastUser?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminSupabaseClient() as never as { from(table: string): any };
  const [rules, profile, seller, business] = await Promise.all([
    getProviderPlanRules(admin),
    admin.from("eloo_profiles").select("role,has_business_profile").eq("id", user.id).maybeSingle(),
    admin.from("sellers").select("id").eq("id", user.id).maybeSingle(),
    admin.from("business_profiles").select("id,status").eq("owner_user_id", user.id).maybeSingle(),
  ]);
  const role = seller.data ? "provider" : String(profile.data?.role || "buyer").toLowerCase();
  const activeProviderPlan = role === "provider" ? await getProviderActivePlan(admin, user.id, rules) : null;
  const buyerSubscription = role !== "provider"
    ? await admin.from("buyer_plan_subscriptions").select("plan_id,status,current_period_end").eq("user_id", user.id).in("status", ["active", "trialing"]).maybeSingle()
    : { data: null };
  return NextResponse.json({
    role,
    hasBusiness: Boolean(business.data || profile.data?.has_business_profile),
    businessStatus: business.data?.status || null,
    activePlanId: activeProviderPlan?.id || buyerSubscription.data?.plan_id || (role === "provider" ? "free" : "buyer-free"),
    rules,
  });
}
