import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password,
    });

    if (authError) {
      console.error('Login error:', authError);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Login failed" },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminSupabaseClient() as never as {
      from(table: string): {
        select(columns: string): {
          eq(column: string, value: string): {
            maybeSingle(): Promise<{ data: { status?: string } | null; error: unknown }>;
          };
        };
      };
    };
    const [{ data: authProfile }, { data: appProfile }, { data: buyerProfile }, { data: adminFlag }] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("is_active")
        .eq("id", authData.user.id)
        .maybeSingle(),
      supabase
        .from("eloo_profiles")
        .select("is_active")
        .eq("id", authData.user.id)
        .maybeSingle(),
      supabase
        .from("buyers")
        .select("is_active")
        .eq("id", authData.user.id)
        .maybeSingle(),
      adminSupabase
        .from("admin_user_flags")
        .select("status")
        .eq("user_id", authData.user.id)
        .maybeSingle(),
    ]);

    if (authProfile?.is_active === false || appProfile?.is_active === false || buyerProfile?.is_active === false || adminFlag?.status === "blocked") {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "This account is suspended. Please contact AnyJob support." },
        { status: 403 }
      );
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('eloo_profiles')
      .select('role, first_name, last_name, avatar_url, is_verified, has_business_profile, business_registration_status, provider_work_mode, can_work_freelance, can_work_shifts')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      // Try checking sellers table as fallback
      const { data: sellerProfile, error: sellerError } = await supabase
        .from('sellers')
        .select('status, first_name, last_name, profile_image_url, provider_work_mode, can_work_freelance, can_work_shifts')
        .eq('id', authData.user.id)
        .single();
      
      if (sellerError || !sellerProfile) {
        return NextResponse.json(
          { error: "User profile not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Login successful",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: 'seller',
          displayName: `${sellerProfile.first_name} ${sellerProfile.last_name}`.trim() || authData.user.email?.split("@")[0] || "Account",
          fullName: `${sellerProfile.first_name} ${sellerProfile.last_name}`,
          avatarUrl: sellerProfile.profile_image_url,
          status: sellerProfile.status,
          hasBusinessProfile: false,
          providerWorkMode: sellerProfile.provider_work_mode || null,
          canWorkFreelance: Boolean(sellerProfile.can_work_freelance || sellerProfile.provider_work_mode === "freelance" || sellerProfile.provider_work_mode === "both"),
          canWorkShifts: Boolean(sellerProfile.can_work_shifts || sellerProfile.provider_work_mode === "shift" || sellerProfile.provider_work_mode === "both"),
        },
        session: authData.session
      }, { status: 200 });
    }

    // Fetch role-specific data
    let userData = null;
    if (profile.role === 'client') {
      const { data: buyerData } = await supabase
        .from('buyers')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      userData = buyerData;
    } else if (profile.role === 'seller' || profile.role === 'provider') {
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      userData = sellerData;
    }

    const providerWorkMode = userData?.provider_work_mode || profile.provider_work_mode || null;
    const providerModeAllowsFreelance = providerWorkMode === "freelance" || providerWorkMode === "both";
    const providerModeAllowsShifts = providerWorkMode === "shift" || providerWorkMode === "both";
    const canWorkFreelance = Boolean(userData?.can_work_freelance ?? profile.can_work_freelance ?? providerModeAllowsFreelance);
    const canWorkShifts = Boolean(userData?.can_work_shifts ?? profile.can_work_shifts ?? providerModeAllowsShifts);
    const displayName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || authData.user.email?.split("@")[0] || "Account";

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profile.role,
        displayName,
        fullName: displayName,
        avatarUrl: profile.avatar_url,
        isVerified: profile.is_verified,
        hasBusinessProfile: Boolean(profile.has_business_profile || authData.user.user_metadata?.account_kind === "business"),
        businessRegistrationStatus: profile.business_registration_status || null,
        providerWorkMode,
        canWorkFreelance,
        canWorkShifts,
        ...userData
      },
      session: authData.session
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
