import { NextResponse } from "next/server";

import { getFastAuthUser } from "@/lib/auth/fast-user";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const user = await getFastAuthUser(supabase);

  if (!user) {
    return NextResponse.json({ user: null });
  }

  const [{ data: profile }, { data: seller }] = await Promise.all([
    supabase
      .from("eloo_profiles")
      .select("role, first_name, last_name, has_business_profile, business_registration_status, provider_work_mode, can_work_freelance, can_work_shifts")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("sellers")
      .select("id, first_name, last_name, status, provider_work_mode, can_work_freelance, can_work_shifts")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const metadata = user.user?.user_metadata || {};
  const role = String(profile?.role || (seller ? "seller" : metadata.role) || "client").toLowerCase();
  const firstName = profile?.first_name || seller?.first_name || metadata.first_name || "";
  const lastName = profile?.last_name || seller?.last_name || metadata.last_name || "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || metadata.full_name || user.email?.split("@")[0] || "Account";
  const providerWorkMode = seller?.provider_work_mode || profile?.provider_work_mode || metadata.provider_work_mode || null;
  const providerModeAllowsFreelance = providerWorkMode === "freelance" || providerWorkMode === "both";
  const providerModeAllowsShifts = providerWorkMode === "shift" || providerWorkMode === "both";
  const canWorkFreelance = Boolean(seller?.can_work_freelance ?? profile?.can_work_freelance ?? providerModeAllowsFreelance);
  const canWorkShifts = Boolean(seller?.can_work_shifts ?? profile?.can_work_shifts ?? providerModeAllowsShifts);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role,
      displayName,
      hasBusinessProfile: Boolean(profile?.has_business_profile || metadata.account_kind === "business"),
      businessRegistrationStatus: profile?.business_registration_status || null,
      providerWorkMode,
      canWorkFreelance,
      canWorkShifts,
    },
  });
}
