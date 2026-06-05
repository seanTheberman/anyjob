import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanString(item)).filter(Boolean);
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: business, error: businessError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (businessError) {
      return NextResponse.json({ error: businessError.message }, { status: 500 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error("Business status lookup failed:", error);
    return NextResponse.json({ error: "Failed to load business profile" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Sign in before registering a business" }, { status: 401 });
    }

    const body = await request.json();
    const businessName = cleanString(body.businessName);
    const legalName = cleanString(body.legalName);
    const registrationNumber = cleanString(body.registrationNumber);
    const businessType = cleanString(body.businessType);
    const industry = cleanString(body.industry);
    const contactName = cleanString(body.contactName);
    const contactEmail = cleanString(body.contactEmail);
    const contactPhone = cleanString(body.contactPhone);
    const address = cleanString(body.address);
    const city = cleanString(body.city);
    const postalCode = cleanString(body.postalCode);
    const country = cleanString(body.country) || "France";
    const documentUrl = cleanString(body.documentUrl) || cleanString(body.documentDataUrl);
    const documentSource = cleanString(body.documentDataUrl) ? "upload" : "url";
    const typicalWorkTypes = cleanArray(body.typicalWorkTypes);
    const typicalRolesNeeded = cleanArray(body.typicalRolesNeeded);

    const required = [
      businessName,
      registrationNumber,
      businessType,
      industry,
      contactName,
      contactEmail,
      contactPhone,
      address,
      city,
      documentUrl,
    ];

    if (required.some((value) => !value)) {
      return NextResponse.json(
        { error: "Business name, registration number, contact details, address, and business document are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: "Invalid business contact email" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const adminDb = admin as never as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            order: (column: string, options?: { ascending?: boolean }) => {
              limit: (count: number) => {
                maybeSingle: () => Promise<{ data: { id?: string; owner_user_id?: string } | null; error: { message: string } | null }>;
              };
            };
          };
        };
        insert: (values: Record<string, unknown>) => {
          select: (columns?: string) => {
            single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }>;
          };
        };
        update: (values: Record<string, unknown>) => {
          eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };

    const { data: existingForUser } = await adminDb
      .from("business_profiles")
      .select("id,owner_user_id")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingForUser?.id) {
      return NextResponse.json(
        { error: "This account already has a business registration. Use admin review or update after rejection." },
        { status: 409 }
      );
    }

    const { data: business, error: insertError } = await adminDb
      .from("business_profiles")
      .insert({
        owner_user_id: user.id,
        business_name: businessName,
        legal_name: legalName || businessName,
        registration_number: registrationNumber,
        business_type: businessType,
        industry,
        contact_name: contactName,
        contact_email: contactEmail.toLowerCase(),
        contact_phone: contactPhone,
        address,
        city,
        postal_code: postalCode || null,
        country,
        document_url: documentUrl,
        document_source: documentSource,
        typical_work_types: typicalWorkTypes,
        typical_roles_needed: typicalRolesNeeded,
        status: "pending",
      })
      .select("*")
      .single();

    if (insertError) {
      const conflict = insertError.code === "23505" ? "A business with this registration number already exists" : insertError.message;
      return NextResponse.json({ error: conflict }, { status: insertError.code === "23505" ? 409 : 500 });
    }

    await Promise.all([
      adminDb.from("eloo_profiles").update({
        has_business_profile: true,
        business_registration_status: "pending",
        updated_at: new Date().toISOString(),
      }).eq("id", user.id),
      adminDb.from("user_profiles").update({ updated_at: new Date().toISOString() }).eq("id", user.id),
    ]);

    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    console.error("Business registration failed:", error);
    return NextResponse.json({ error: "Failed to register business" }, { status: 500 });
  }
}
