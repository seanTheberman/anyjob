import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      address,
      city,
      postalCode,
      birthDate,
      serviceCategory,
      experience,
      description,
      siret,
      insurance,
      idDocumentUrl,
      selfieVideoUrl,
      insuranceDocumentUrl,
      termsAccepted,
      newsletterAccepted
    } = body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !password || !address || 
        !city || !postalCode || !birthDate || !serviceCategory) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
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

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "You must accept the terms and conditions" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('sellers')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: "A seller account with this email already exists" },
        { status: 409 }
      );
    }

    // Check if SIRET already exists (if provided)
    if (siret) {
      const { data: existingSiret } = await supabase
        .from('sellers')
        .select('siret')
        .eq('siret', siret)
        .single();

      if (existingSiret) {
        return NextResponse.json(
          { error: "This SIRET number is already registered" },
          { status: 409 }
        );
      }
    }

    // Create auth user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          role: 'seller',
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
        { error: "Failed to create seller account" },
        { status: 500 }
      );
    }

    // Insert seller profile data
    const { error: sellerError } = await supabase
      .from('sellers')
      .insert([
        {
          id: authData.user.id,
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          address: address,
          city: city,
          postal_code: postalCode,
          birth_date: birthDate,
          service_category: serviceCategory,
          experience_level: experience || null,
          description: description || null,
          siret: siret || null,
          insurance_status: insurance || null,
          id_document_url: idDocumentUrl || null,
          selfie_video_url: selfieVideoUrl || null,
          insurance_document_url: insuranceDocumentUrl || null,
          kyc_submitted_at: idDocumentUrl && selfieVideoUrl && (insuranceDocumentUrl || insurance) ? new Date().toISOString() : null,
          terms_accepted: termsAccepted,
          newsletter_subscribed: newsletterAccepted || false,
          status: 'pending',
          email_verified: false,
          phone_verified: false,
          background_check_status: 'pending'
        }
      ]);

    if (sellerError) {
      console.error('Seller insert error:', sellerError);
      return NextResponse.json(
        { error: "Failed to create seller profile" },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase
      .from('eloo_profiles')
      .upsert({
        id: authData.user.id,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        phone,
        city,
        postal_code: postalCode,
        role: 'provider',
        is_verified: false,
        kyc_status: idDocumentUrl && selfieVideoUrl && (insuranceDocumentUrl || insurance) ? 'submitted' : 'not_started',
        kyc_submitted_at: idDocumentUrl && selfieVideoUrl && (insuranceDocumentUrl || insurance) ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Provider profile insert error:', profileError);
      return NextResponse.json(
        { error: "Failed to create provider profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Seller registration successful! Your account is pending KYC verification.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'seller',
        status: 'pending'
      },
      session: authData.session
    }, { status: 201 });

  } catch (error) {
    console.error('Seller registration error:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
