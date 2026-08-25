import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  MarketLocationError,
  persistUserMarketLocation,
  verifyMarketLocationToken,
} from "@/lib/location/market-location";

const TIER_LABELS: Record<string, string> = {
  basic: "Basic",
  starter: "Starter",
  standard: "Standard",
  premium: "Premium",
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
}

function record(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

function number(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function selectedPackage(service: Record<string, any>, requestedTier: string) {
  const details = record(service.gig_details);
  const packages = Array.isArray(details.packages) ? details.packages.map(record) : [];
  const normalizedTier = requestedTier.toLowerCase();
  const selected = packages.find((item, index) => {
    const tier = text(item.tier).toLowerCase() || ["starter", "standard", "premium"][index];
    return tier === normalizedTier;
  });
  if (!selected) return null;

  return {
    tier: text(selected.tier).toLowerCase() || normalizedTier,
    title: text(selected.title) || text(service.title) || "Service package",
    description: text(selected.description) || text(service.description),
    price: Math.max(0, number(selected.price)),
    deliveryDays: Math.max(1, number(selected.deliveryDays ?? selected.delivery_days, 1)),
    revisions: Math.max(0, number(selected.revisions, 0)),
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sign in to hire this provider." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const location = verifyMarketLocationToken(
      request,
      body.locationToken || request.cookies.get("anyjob_market_location")?.value,
    );
    await persistUserMarketLocation(user.id, location);
    const providerId = text(body.providerId);
    const serviceId = text(body.serviceId);
    const tier = text(body.packageTier || body.tier).toLowerCase();
    const preferredDate = text(body.preferredDate);
    const preferredTime = text(body.preferredTime);
    const address = text(body.address);
    const city = location.city;
    const postalCode = location.postalCode;
    const notes = text(body.notes);

    const validationError =
      (!providerId && "Choose a provider.") ||
      (!serviceId && "Choose a provider service.") ||
      (!tier && "Choose a service package.") ||
      (!validDate(preferredDate) && "Choose a valid booking date.") ||
      (!preferredTime && "Choose a preferred time.") ||
      ((!address || !city) && "Enter the service address and city.");

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (providerId === user.id) {
      return NextResponse.json({ error: "You cannot hire yourself." }, { status: 403 });
    }

    const admin = createAdminSupabaseClient() as never as { from(table: string): any };
    const [
      { data: provider, error: providerError },
      { data: service, error: serviceError },
      { data: profile },
      { data: buyer },
    ] = await Promise.all([
      admin
        .from("sellers")
        .select("id,email,first_name,last_name,service_category,hourly_rate,status,country_code")
        .eq("id", providerId)
        .eq("status", "approved")
        .maybeSingle(),
      admin
        .from("eloo_provider_services")
        .select("id,provider_id,title,description,hourly_rate,min_hours,tags,gig_details,is_active")
        .eq("id", serviceId)
        .eq("provider_id", providerId)
        .eq("is_active", true)
        .maybeSingle(),
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

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider is not available for direct hire." }, { status: 404 });
    }

    if (provider.country_code !== location.countryCode) {
      return NextResponse.json({ error: "This provider is not available in your marketplace country." }, { status: 403 });
    }

    if (serviceError || !service) {
      return NextResponse.json({ error: "This provider package is no longer available." }, { status: 404 });
    }

    const chosenPackage = selectedPackage(service, tier);
    if (!chosenPackage || chosenPackage.price <= 0) {
      return NextResponse.json({ error: "This package is no longer available." }, { status: 404 });
    }

    const person = buyer || profile || {};
    const amount = chosenPackage.price;
    const duration = Math.max(1, number(service.min_hours, 1));
    const providerName = [provider.first_name, provider.last_name].filter(Boolean).join(" ") || "Provider";
    const label = TIER_LABELS[chosenPackage.tier] || chosenPackage.title || "Package";
    const serviceDetails = record(service.gig_details);
    const category = text(serviceDetails.category) || text(provider.service_category) || "service";
    const title = chosenPackage.title;
    const serviceTags = Array.isArray(service.tags)
      ? service.tags.map(text).filter(Boolean)
      : [];
    const description = [
      title,
      "",
      chosenPackage.description || `Direct hire for the ${label.toLowerCase()} package listed by ${providerName}.`,
      `Package price: €${amount.toFixed(2)}. Delivery: ${chosenPackage.deliveryDays} day${chosenPackage.deliveryDays === 1 ? "" : "s"}. Revisions: ${chosenPackage.revisions}.`,
      notes ? `Buyer notes: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const timestamp = new Date().toISOString();
    const { data: inquiry, error: inquiryError } = await admin
      .from("service_inquiries")
      .insert({
        user_id: user.id,
        email: user.email || person.email || "",
        phone: text(person.phone) || "",
        first_name: text(person.first_name) || user.user_metadata?.first_name || "AnyJob",
        last_name: text(person.last_name) || user.user_metadata?.last_name || "Buyer",
        category_slug: category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "direct-hire",
        subcategory_slug: "direct-package-hire",
        custom_tags: ["direct hire", label.toLowerCase(), category.toLowerCase(), ...serviceTags].filter(Boolean).slice(0, 8),
        service_type: "one_time",
        job_description: description,
        job_urgency: "scheduled",
        preferred_date: preferredDate,
        preferred_time_start: preferredTime,
        preferred_time_end: null,
        flexible_timing: false,
        address,
        city,
        postal_code: postalCode,
        estimated_duration_hours: duration,
        number_of_people_needed: 1,
        budget_range_min: amount,
        budget_range_max: amount,
        materials_provided: false,
        equipment_needed: null,
        status: "submitted",
        matched_provider_ids: [providerId],
        session_id: randomUUID(),
        submitted_at: timestamp,
        updated_at: timestamp,
      })
      .select("*")
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json({ error: inquiryError?.message || "Could not create direct hire." }, { status: 500 });
    }

    const { data: bid, error: bidError } = await admin
      .from("bids")
      .insert({
        inquiry_id: inquiry.id,
        provider_id: providerId,
        amount,
        message: `Direct hire package selected: ${title}`,
        estimated_duration_hours: duration,
        available_date: preferredDate,
        status: "pending",
      })
      .select()
      .single();

    if (bidError || !bid) {
      await admin.from("service_inquiries").delete().eq("id", inquiry.id);
      return NextResponse.json({ error: bidError?.message || "Could not prepare package checkout." }, { status: 500 });
    }

    return NextResponse.json({ inquiry, bid }, { status: 201 });
  } catch (error) {
    if (error instanceof MarketLocationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Direct hire failed:", error);
    return NextResponse.json({ error: "Direct hire failed" }, { status: 500 });
  }
}
