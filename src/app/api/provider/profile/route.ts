import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProviderStats } from "@/lib/provider-stats";
import {
  getSellerServiceAreas,
  MAX_SERVICE_AREAS,
  parseServiceAreaInput,
  serviceAreaToRow,
  type ServiceArea,
} from "@/lib/location/service-areas";

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
  contactWindows?: string[] | string;
  unavailable?: boolean;
  unavailableUntil?: string;
  unavailableNote?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  hourlyRate?: number;
  profileImageUrl?: string;
  serviceAreas?: unknown[];
  serviceAreaRadiusKm?: number;
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

function textLines(value: unknown) {
  const rows = Array.isArray(value) ? value : text(value).split(/\r?\n/);
  return rows
    .map((row) => text(row))
    .filter(Boolean)
    .slice(0, 14);
}

function dateValue(value: unknown) {
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? raw : null;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient() as never as LooseAdminClient;
  const [{ data: seller, error: sellerError }, { data: files, error: filesError }, stats, serviceAreaMap] = await Promise.all([
    admin.from("sellers").select("*").eq("id", user.id).maybeSingle(),
    admin
      .from("user_images")
      .select("id,image_url,public_id,image_type,title,description")
      .eq("user_id", user.id)
      .in("image_type", ["id_document", "selfie_video", "portfolio", "portfolio_video"])
      .order("created_at", { ascending: false }),
    getProviderStats(admin, user.id),
    getSellerServiceAreas([user.id], admin),
  ]);

  if (sellerError) return NextResponse.json({ error: sellerError.message }, { status: 500 });
  if (filesError) return NextResponse.json({ error: filesError.message }, { status: 500 });

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    seller,
    files: files || [],
    stats,
    serviceAreas: serviceAreaMap.get(user.id) || [],
  });
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
  const { data: existingSeller, error: existingSellerError } = await admin
    .from("sellers")
    .select("availability,address,city,postal_code,country,country_code,region,location_verified_at,service_area_radius_km")
    .eq("id", user.id)
    .maybeSingle();

  if (existingSellerError) {
    return NextResponse.json({ error: existingSellerError.message }, { status: 500 });
  }
  if (!existingSeller?.country_code || !existingSeller?.country) {
    return NextResponse.json({ error: "Verify your marketplace location before saving your profile." }, { status: 409 });
  }

  let serviceAreas: ServiceArea[] | null = null;
  if (Array.isArray(body.serviceAreas)) {
    if (body.serviceAreas.length > MAX_SERVICE_AREAS) {
      return NextResponse.json({ error: `Choose up to ${MAX_SERVICE_AREAS} service areas.` }, { status: 400 });
    }
    const parsedAreas = body.serviceAreas.map((area, index) => parseServiceAreaInput(area, existingSeller.country_code, index));
    if (parsedAreas.some((area) => !area)) {
      return NextResponse.json({ error: "One or more service areas are invalid or outside your verified country." }, { status: 400 });
    }
    serviceAreas = parsedAreas as ServiceArea[];
    const uniqueAreaKeys = new Set(serviceAreas.map((area) => `${area.provider}:${area.placeId}`));
    if (uniqueAreaKeys.size !== serviceAreas.length) {
      return NextResponse.json({ error: "Each service area can only be selected once." }, { status: 400 });
    }
  }

  const requestedRadius = Math.round(Number(body.serviceAreaRadiusKm));
  const serviceAreaRadiusKm = Number.isFinite(requestedRadius)
    ? Math.min(100, Math.max(1, requestedRadius))
    : Number(existingSeller.service_area_radius_km) || 15;

  const existingAvailability = existingSeller?.availability && typeof existingSeller.availability === "object"
    ? existingSeller.availability
    : {};
  const sellerUpdate = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    description: text(body.bio) || null,
    service_category: text(body.serviceCategory) || "Service provider",
    experience_level: text(body.experienceLevel) || null,
    availability: {
      ...existingAvailability,
      marketplaceAvailability: availabilityMode,
      note: text(body.availabilityNote) || null,
      contactWindows: textLines(body.contactWindows),
      unavailable: Boolean(body.unavailable),
      unavailableUntil: dateValue(body.unavailableUntil),
      unavailableNote: text(body.unavailableNote) || null,
    },
    address: text(body.address),
    city: existingSeller.city,
    postal_code: existingSeller.postal_code,
    country: existingSeller.country,
    country_code: existingSeller.country_code,
    region: existingSeller.region,
    location_verified_at: existingSeller.location_verified_at,
    service_area_radius_km: serviceAreaRadiusKm,
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
    city: existingSeller.city,
    postal_code: existingSeller.postal_code,
    country: existingSeller.country,
    country_code: existingSeller.country_code,
    region: existingSeller.region,
    location_verified_at: existingSeller.location_verified_at,
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

  if (serviceAreas) {
    const normalizedAreas = serviceAreas as ServiceArea[];
    const rows = normalizedAreas.map((area, index) => serviceAreaToRow(user.id, {
      ...area,
      radiusKm: serviceAreaRadiusKm,
      isPrimary: index === 0,
    }));
    if (rows.length) {
      const { error: areaUpsertError } = await admin
        .from("seller_service_areas")
        .upsert(rows, { onConflict: "seller_id,provider,provider_place_id" });
      if (areaUpsertError) return NextResponse.json({ error: areaUpsertError.message }, { status: 500 });

      const keepKeys = new Set(rows.map((row) => `${row.provider}:${row.provider_place_id}`));
      const { data: storedAreas, error: storedAreaError } = await admin
        .from("seller_service_areas")
        .select("id,provider,provider_place_id")
        .eq("seller_id", user.id);
      if (storedAreaError) return NextResponse.json({ error: storedAreaError.message }, { status: 500 });
      const staleIds = (storedAreas || [])
        .filter((area: Record<string, unknown>) => !keepKeys.has(`${area.provider}:${area.provider_place_id}`))
        .map((area: Record<string, unknown>) => area.id);
      if (staleIds.length) {
        const { error: deleteError } = await admin.from("seller_service_areas").delete().in("id", staleIds);
        if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    } else {
      const { error: deleteError } = await admin.from("seller_service_areas").delete().eq("seller_id", user.id);
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, profile: body, serviceAreas: serviceAreas || undefined });
}
