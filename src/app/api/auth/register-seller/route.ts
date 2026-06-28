import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanString(item)).filter(Boolean);
}

function cleanNumber(value: unknown, fallback: number | null = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const {
      firstName,
      lastName,
      businessName,
      accountType = "individual",
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
      workMode = "freelance",
      shiftNiches,
      shiftRoles,
      shiftSkills,
      shiftCertifications,
      shiftAvailability,
      travelRadiusKm,
      preferredHourlyRate,
      preferredDayRate,
      openToFreelanceJobs,
      openToUrgentShifts,
      openToRecurringShifts,
      termsAccepted,
      newsletterAccepted
    } = body;

    const providerAccountType = accountType === "business" || accountType === "agency" ? accountType : "individual";
    const providerBusinessName = cleanString(businessName);
    const providerWorkMode = workMode === "shift" || workMode === "both" ? workMode : "freelance";
    const wantsShiftWork = providerWorkMode === "shift" || providerWorkMode === "both";
    const shiftNicheList = cleanStringArray(shiftNiches);
    const shiftRoleList = cleanStringArray(shiftRoles);
    const shiftSkillList = cleanStringArray(shiftSkills);
    const shiftCertificationList = cleanStringArray(shiftCertifications);
    const hourlyRate = cleanNumber(preferredHourlyRate);
    const dayRate = cleanNumber(preferredDayRate);

    // Validation
    if (!firstName || !lastName || !email || !phone || !password || !address || 
        !city || !postalCode || !birthDate || !serviceCategory) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    if ((providerAccountType === "business" || providerAccountType === "agency") && !providerBusinessName) {
      return NextResponse.json(
        { error: "Business or agency name is required" },
        { status: 400 }
      );
    }

    if (wantsShiftWork && (!shiftNicheList.length || !shiftRoleList.length || (!hourlyRate && !dayRate))) {
      return NextResponse.json(
        { error: "Shift workers must choose at least one niche, one role, and a preferred hourly or day rate" },
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

    const availabilityMetadata = {
      providerAccountType,
      businessName: providerBusinessName || null,
      marketplaceAvailability: "",
      responseTime: "",
    };

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
          availability: availabilityMetadata,
          provider_work_mode: providerWorkMode,
          can_work_freelance: providerWorkMode === "freelance" || providerWorkMode === "both",
          can_work_shifts: wantsShiftWork,
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
        provider_work_mode: providerWorkMode,
        can_work_freelance: providerWorkMode === "freelance" || providerWorkMode === "both",
        can_work_shifts: wantsShiftWork,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Provider profile insert error:', profileError);
      return NextResponse.json(
        { error: "Failed to create provider profile" },
        { status: 500 }
      );
    }

    if (wantsShiftWork) {
      const admin = createAdminSupabaseClient();
      const adminDb = admin as never as {
        from: (table: string) => {
          upsert: (values: Record<string, unknown>, options?: Record<string, unknown>) => {
            select: (columns?: string) => {
              single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
            };
          };
        };
      };

      const { error: shiftProfileError } = await adminDb
        .from("shift_worker_profiles")
        .upsert({
          user_id: authData.user.id,
          provider_profile_id: authData.user.id,
          work_mode: providerWorkMode === "both" ? "both" : "shift",
          niches: shiftNicheList,
          preferred_roles: shiftRoleList,
          skills: shiftSkillList,
          certifications: shiftCertificationList,
          availability: shiftAvailability && typeof shiftAvailability === "object" ? shiftAvailability : {},
          travel_radius_km: cleanNumber(travelRadiusKm, 10),
          preferred_hourly_rate: hourlyRate,
          preferred_day_rate: dayRate,
          market_rate_acknowledged_at: new Date().toISOString(),
          open_to_freelance_jobs: providerWorkMode === "both" || openToFreelanceJobs === true,
          open_to_urgent_shifts: openToUrgentShifts === true,
          open_to_recurring_shifts: openToRecurringShifts === true,
          status: "available",
        }, { onConflict: "user_id" })
        .select("*")
        .single();

      if (shiftProfileError) {
        console.error("Shift worker profile insert error:", shiftProfileError);
        return NextResponse.json(
          { error: "Seller account was created, but shift worker profile setup failed" },
          { status: 500 }
        );
      }
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
