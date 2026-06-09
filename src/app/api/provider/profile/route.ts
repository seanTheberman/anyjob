import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ProviderProfilePayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  serviceCategory?: string;
  experienceLevel?: string;
  availabilityMode?: string;
  availabilityNote?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  hourlyRate?: number;
  profileImageUrl?: string;
};

const availabilityOptions = ["Today", "This week", "Weekends", "Evenings", "Remote"];

type LooseAdminClient = {
  from(table: string): any;
};

async function currentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient() as never as LooseAdminClient;
  const [{ data: seller, error: sellerError }, { data: files, error: filesError }] = await Promise.all([
    admin.from("sellers").select("*").eq("id", user.id).maybeSingle(),
    admin
      .from("user_images")
      .select("id,image_url,public_id,image_type,title,description")
      .eq("user_id", user.id)
      .in("image_type", ["id_document", "selfie_video", "portfolio", "portfolio_video"])
      .order("created_at", { ascending: false }),
  ]);

  if (sellerError) return NextResponse.json({ error: sellerError.message }, { status: 500 });
  if (filesError) return NextResponse.json({ error: filesError.message }, { status: 500 });

  return NextResponse.json({ user: { id: user.id, email: user.email }, seller, files: files || [] });
}

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as ProviderProfilePayload;
  const firstName = text(body.firstName);
  const lastName = text(body.lastName);
  const email = text(body.email).toLowerCase();
  const phone = text(body.phone);
  const availabilityMode = availabilityOptions.includes(text(body.availabilityMode)) ? text(body.availabilityMode) : "This week";
  const hourlyRate = Number(body.hourlyRate);

  if (!firstName || !lastName || !email || !phone) {
    return NextResponse.json({ error: "First name, last name, email, and phone are required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient() as never as LooseAdminClient;
  const now = new Date().toISOString();
  const sellerUpdate = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    description: text(body.bio) || null,
    service_category: text(body.serviceCategory) || "Service provider",
    experience_level: text(body.experienceLevel) || null,
    availability: {
      marketplaceAvailability: availabilityMode,
      note: text(body.availabilityNote) || null,
    },
    address: text(body.address),
    city: text(body.city),
    postal_code: text(body.postalCode),
    country: text(body.country) || "France",
    hourly_rate: Number.isFinite(hourlyRate) ? hourlyRate : 0,
    profile_image_url: text(body.profileImageUrl) || null,
    updated_at: now,
  };

  const profileUpdate = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    bio: text(body.bio) || null,
    city: text(body.city),
    postal_code: text(body.postalCode),
    avatar_url: text(body.profileImageUrl) || null,
    updated_at: now,
  };

  const [sellerResult, profileResult] = await Promise.all([
    admin.from("sellers").update(sellerUpdate).eq("id", user.id),
    admin.from("eloo_profiles").update(profileUpdate).eq("id", user.id),
  ]);

  if (sellerResult.error || profileResult.error) {
    return NextResponse.json(
      { error: sellerResult.error?.message || profileResult.error?.message || "Profile changes could not be saved." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, profile: body });
}
