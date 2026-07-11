import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  DEFAULT_PROVIDER_PLAN_RULES,
  PROVIDER_PLAN_RULES_SETTING_KEY,
  type BuyerPlanConfig,
  type ProviderPlanConfig,
  type ProviderPlanRules,
  parseProviderPlanRules,
} from "./provider-plan-config";

type AdminClient = ReturnType<typeof createAdminSupabaseClient> | { from(table: string): any };

export type ProviderPlanEntitlement = {
  allowed: boolean;
  plan: ProviderPlanConfig;
  usage: {
    bids: number;
    shifts: number;
    total: number;
    limit: number;
    remaining: number | null;
    windowDays: number;
  };
  message?: string;
};

export async function getProviderPlanRules(admin: AdminClient = createAdminSupabaseClient()): Promise<ProviderPlanRules> {
  const { data, error } = await (admin as any)
    .from("admin_settings")
    .select("value")
    .eq("key", PROVIDER_PLAN_RULES_SETTING_KEY)
    .maybeSingle();

  if (error) {
    console.error("Provider plan settings load failed:", error);
    return DEFAULT_PROVIDER_PLAN_RULES;
  }

  return parseProviderPlanRules(data?.value);
}

export function getPlanById(rules: ProviderPlanRules, planId?: string | null) {
  return rules.plans.find((plan) => plan.id === planId) || rules.plans[0] || DEFAULT_PROVIDER_PLAN_RULES.plans[0];
}

export function getBuyerPlanById(rules: ProviderPlanRules, planId?: string | null): BuyerPlanConfig {
  return rules.buyerPlans.find((plan) => plan.id === planId) || rules.buyerPlans[0] || DEFAULT_PROVIDER_PLAN_RULES.buyerPlans[0];
}

export async function getProviderActivePlan(
  admin: AdminClient,
  userId: string,
  rules: ProviderPlanRules
): Promise<ProviderPlanConfig> {
  const now = new Date().toISOString();
  const { data, error } = await (admin as any)
    .from("provider_plan_subscriptions")
    .select("plan_id,status,current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .or(`current_period_end.is.null,current_period_end.gte.${now}`)
    .order("current_period_end", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Provider active plan lookup failed:", error);
    return getPlanById(rules, "free");
  }

  return getPlanById(rules, data?.plan_id || "free");
}

async function countRows(query: PromiseLike<{ count: number | null; error: any }>) {
  const { count, error } = await query;
  if (error) {
    console.error("Provider plan usage count failed:", error);
    return 0;
  }
  return count || 0;
}

export async function getProviderApplicationEntitlement(
  admin: AdminClient,
  userId: string
): Promise<ProviderPlanEntitlement> {
  const rules = await getProviderPlanRules(admin);
  const plan = await getProviderActivePlan(admin, userId, rules);
  const since = new Date(Date.now() - rules.usageWindowDays * 24 * 60 * 60 * 1000).toISOString();

  const [bids, shifts] = await Promise.all([
    countRows(
      (admin as any)
        .from("bids")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", userId)
        .gte("created_at", since)
    ),
    countRows(
      (admin as any)
        .from("shift_applications")
        .select("id", { count: "exact", head: true })
        .eq("provider_user_id", userId)
        .gte("applied_at", since)
    ),
  ]);

  const total = bids + shifts;
  const limit = plan.applicationLimit;
  const remaining = limit < 0 ? null : Math.max(limit - total, 0);
  const allowed = limit < 0 || total < limit;

  return {
    allowed,
    plan,
    usage: {
      bids,
      shifts,
      total,
      limit,
      remaining,
      windowDays: rules.usageWindowDays,
    },
    message: allowed
      ? undefined
      : `${plan.name} plan limit reached. Upgrade your provider plan to apply for more jobs and shifts.`,
  };
}
