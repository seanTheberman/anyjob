import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  MarketLocationError,
  persistUserMarketLocation,
  verifyMarketLocationToken,
} from "@/lib/location/market-location";

const BUDGETS: Record<string, { min: number; max: number }> = {
  "0-50": { min: 0, max: 50 },
  "50-100": { min: 50, max: 100 },
  "100-200": { min: 100, max: 200 },
  "200-500": { min: 200, max: 500 },
  "500+": { min: 500, max: 999999 },
};

function value(body: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (body[key] !== undefined) return body[key];
  }
  return undefined;
}

function text(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
}

function number(input: unknown, fallback = 0) {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function meaningfulLength(input: string) {
  return input.replace(/[^a-zA-Z0-9]/g, "").length;
}

function validDate(input: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(input) &&
    !Number.isNaN(Date.parse(`${input}T00:00:00`))
  );
}

export async function POST(request: NextRequest) {
  try {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await auth.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const location = verifyMarketLocationToken(
    request,
    value(body, "location_token", "locationToken") || request.cookies.get("anyjob_market_location")?.value,
  );
  await persistUserMarketLocation(user.id, location);
  const category = text(value(body, "category_slug", "category"));
  const subcategory = text(value(body, "subcategory_slug", "subcategory"));
  const serviceType = text(value(body, "service_type", "serviceType"));
  const urgency = text(value(body, "job_urgency", "urgency"));
  const title = text(value(body, "job_title", "title"));
  const description = text(value(body, "job_description", "description"));
  const preferredDate = text(value(body, "preferred_date", "preferredDate"));
  const address = text(body.address);
  const city = location.city;
  const duration = number(
    value(body, "estimated_duration_hours", "durationHours"),
  );
  const budgetRange = text(value(body, "budget_range", "budgetRange"));
  const budget = BUDGETS[budgetRange];

  const validationError =
    (!category && "Choose a service category.") ||
    (!subcategory && "Choose a service within the selected category.") ||
    (!serviceType && "Choose a service type.") ||
    (!urgency && "Choose the job urgency.") ||
    (meaningfulLength(title) < 3 &&
      "Enter a clear job title of at least 3 characters.") ||
    (meaningfulLength(description) < 10 &&
      "Describe the work in at least 10 meaningful characters.") ||
    (!validDate(preferredDate) && "Choose a valid preferred date.") ||
    ((!address || !city) && "Enter both the service address and city.") ||
    (duration === 0 && "Choose the estimated duration.") ||
    (!budget && "Choose a valid budget range.");

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const admin = createAdminSupabaseClient() as never as {
    // The generated database type does not yet include these legacy marketplace tables.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from(table: string): any;
  };
  const [{ data: profile }, { data: buyer }] = await Promise.all([
    admin
      .from("eloo_profiles")
      .select("first_name,last_name,email,phone")
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("buyers")
      .select("first_name,last_name,email,phone")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  const person = buyer || profile || {};
  const postalCode = location.postalCode;
  const customTags = value(body, "custom_tags", "tags");
  const defaultCoarseLabel = [
    city,
    postalCode ? `${postalCode.slice(0, 3)} area` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const { data, error } = await admin
    .from("service_inquiries")
    .insert({
      user_id: user.id,
      email: user.email || person.email,
      phone: text(body.phone) || person.phone || "",
      first_name:
        person.first_name || user.user_metadata?.first_name || "AnyJob",
      last_name: person.last_name || user.user_metadata?.last_name || "Buyer",
      category_slug: category,
      subcategory_slug: subcategory,
      custom_tags: Array.isArray(customTags)
        ? customTags
            .filter((tag): tag is string => typeof tag === "string")
            .slice(0, 8)
        : [],
      service_type: serviceType,
      job_description: `${title}\n\n${description}`,
      job_urgency: urgency,
      preferred_date: preferredDate,
      preferred_time_start:
        text(value(body, "preferred_time_start", "startTime")) || null,
      preferred_time_end:
        text(value(body, "preferred_time_end", "endTime")) || null,
      flexible_timing:
        value(body, "flexible_timing", "flexibleTiming") === true,
      address,
      city,
      postal_code: postalCode,
      country: location.country,
      country_code: location.countryCode,
      region: location.region || null,
      latitude: null,
      longitude: null,
      coarse_latitude: location.coarseLatitude,
      coarse_longitude: location.coarseLongitude,
      location_accuracy_meters: location.accuracyMeters,
      location_verified_at: new Date().toISOString(),
      coarse_location_label: defaultCoarseLabel,
      estimated_duration_hours: duration,
      number_of_people_needed: Math.max(
        1,
        number(value(body, "number_of_people_needed", "peopleNeeded"), 1),
      ),
      budget_range_min: budget.min,
      budget_range_max: budget.max,
      materials_provided:
        value(body, "materials_provided", "materialsProvided") === true,
      equipment_needed:
        text(value(body, "equipment_needed", "equipmentNeeded")) || null,
      status: "pending",
      session_id: text(body.session_id) || randomUUID(),
      submitted_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ inquiry: data }, { status: 201 });
  } catch (error) {
    if (error instanceof MarketLocationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Mobile request creation failed:", error);
    return NextResponse.json({ error: "Could not create request" }, { status: 500 });
  }
}
