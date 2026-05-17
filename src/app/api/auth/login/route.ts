import { createServerSupabaseClient } from "@/lib/supabase/server";
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

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('eloo_profiles')
      .select('role, first_name, last_name, avatar_url, is_verified')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      // Try checking sellers table as fallback
      const { data: sellerProfile, error: sellerError } = await supabase
        .from('sellers')
        .select('status, first_name, last_name, profile_image_url')
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
          fullName: `${sellerProfile.first_name} ${sellerProfile.last_name}`,
          avatarUrl: sellerProfile.profile_image_url,
          status: sellerProfile.status
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

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profile.role,
        fullName: `${profile.first_name} ${profile.last_name}`,
        avatarUrl: profile.avatar_url,
        isVerified: profile.is_verified,
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
