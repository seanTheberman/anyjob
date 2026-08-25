import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { upsertCustomAuthUser } from "@/lib/custom-auth/users";
import { invokeEmailFunction } from "@/lib/notifications/email-functions";
import { NextRequest, NextResponse } from "next/server";
import {
  MarketLocationError,
  persistUserMarketLocation,
  verifyMarketLocationToken,
} from "@/lib/location/market-location";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      locationToken,
      newsletterSubscribed
    } = body;
    const location = verifyMarketLocationToken(
      request,
      locationToken || request.cookies.get("anyjob_market_location")?.value,
    );

    // Validation
    if (!firstName || !lastName || !email || !password || !address) {
      return NextResponse.json(
        { error: "First name, last name, email, password, and address are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('buyers')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Create auth user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          role: 'buyer',
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return NextResponse.json(
        { error: authError.message || "Failed to create account" },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // Insert buyer profile data
    const adminSupabase = createAdminSupabaseClient() as unknown as {
      from: (table: string) => {
        insert: (values: unknown) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error: buyerError } = await adminSupabase
      .from('buyers')
      .insert([
        {
          id: authData.user.id,
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          address: address || null,
          city: location.city,
          postal_code: location.postalCode || null,
          country: location.country,
          country_code: location.countryCode,
          region: location.region || null,
          location_verified_at: new Date().toISOString(),
          newsletter_subscribed: newsletterSubscribed || false,
          email_verified: false,
          phone_verified: false
        }
      ]);

    if (buyerError) {
      console.error('Buyer insert error:', buyerError);
      // If buyer profile creation fails, we should clean up the auth user
      // but Supabase doesn't provide easy way to delete auth users from server
      return NextResponse.json(
        { error: "Failed to create buyer profile" },
        { status: 500 }
      );
    }

    await persistUserMarketLocation(authData.user.id, location);

    await upsertCustomAuthUser({
      supabaseUserId: authData.user.id,
      email: email.toLowerCase(),
      password,
      role: "buyer",
      metadata: {
        firstName,
        lastName,
        phone: phone || null,
      },
    });

    const verificationEmail = await invokeEmailFunction({
      functionName: "email-verification",
      payload: {
        tenantSlug: "default",
        action: "request",
        email: email.toLowerCase(),
      },
      useServiceRole: true,
    });

    if (!verificationEmail.ok) {
      console.error("Buyer verification email failed:", verificationEmail);
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Check your email to verify your account.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'buyer'
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof MarketLocationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
