import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

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
      termsAccepted,
      newsletterAccepted
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !address || !city || !postalCode || !birthDate || !serviceCategory || !termsAccepted) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('eloo_tasker_registrations')
      .select('email')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: "Erreur lors de la vérification de l'email" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Check if SIRET already exists (if provided)
    if (siret) {
      const { data: existingSiret, error: siretCheckError } = await supabase
        .from('eloo_tasker_registrations')
        .select('siret')
        .eq('siret', siret)
        .single();

      if (siretCheckError && siretCheckError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: "Erreur lors de la vérification du SIRET" },
          { status: 500 }
        );
      }

      if (existingSiret) {
        return NextResponse.json(
          { error: "Un compte avec ce numéro SIRET existe déjà" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new tasker registration
    const { data: taskerData, error: insertError } = await supabase
      .from('eloo_tasker_registrations')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          phone: phone,
          password_hash: passwordHash,
          address: address,
          city: city,
          postal_code: postalCode,
          birth_date: birthDate,
          service_category: serviceCategory,
          experience: experience || null,
          description: description || null,
          siret: siret || null,
          insurance: insurance || null,
          terms_accepted: termsAccepted,
          newsletter_accepted: newsletterAccepted,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: "Erreur lors de la création du compte" },
        { status: 500 }
      );
    }

    // Return success response (without sensitive data)
    const { password_hash, ...taskerResponse } = taskerData;
    
    return NextResponse.json({
      success: true,
      message: "Inscription envoyée avec succès! Votre compte est en attente de validation.",
      tasker: taskerResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Méthode non autorisée" },
    { status: 405 }
  );
}
