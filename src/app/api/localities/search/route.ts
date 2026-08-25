import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ServiceArea } from "@/lib/location/service-areas";

type LooseAdminClient = { from(table: string): any };

type GeoapifyResult = {
  place_id?: string;
  formatted?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
  postcode?: string;
  lat?: number;
  lon?: number;
};

type PhotonFeature = {
  geometry?: { coordinates?: unknown[] };
  properties?: Record<string, unknown>;
};

const recentRequests = new Map<string, number[]>();

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function allowed(userId: string) {
  const now = Date.now();
  if (recentRequests.size > 5000) {
    for (const [key, times] of recentRequests) {
      if (!times.some((time) => now - time < 60_000)) recentRequests.delete(key);
    }
  }
  const recent = (recentRequests.get(userId) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 40) return false;
  recent.push(now);
  recentRequests.set(userId, recent);
  return true;
}

function localityLabel(parts: Array<string | undefined>) {
  return Array.from(new Set(parts.map((part) => text(part)).filter(Boolean))).join(", ");
}

async function searchGeoapify(query: string, countryCode: string): Promise<ServiceArea[]> {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return [];

  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.searchParams.set("text", query);
  url.searchParams.set("type", "locality");
  url.searchParams.set("filter", `countrycode:${countryCode.toLowerCase()}`);
  url.searchParams.set("format", "json");
  url.searchParams.set("lang", "en");
  url.searchParams.set("limit", "8");
  url.searchParams.set("apiKey", key);
  const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error("Locality search is temporarily unavailable.");
  const payload = await response.json() as { results?: GeoapifyResult[] };

  return (payload.results || []).flatMap((result) => {
    const resultCountry = text(result.country_code).toUpperCase();
    const locality = text(result.city || result.town || result.village || result.suburb || result.district || result.county);
    if (!result.place_id || !locality || resultCountry !== countryCode) return [];
    return [{
      provider: "geoapify" as const,
      placeId: result.place_id,
      label: text(result.formatted) || localityLabel([locality, result.state, result.country]),
      locality,
      region: text(result.state || result.county),
      country: text(result.country),
      countryCode: resultCountry,
      postalCode: text(result.postcode),
      latitude: Number.isFinite(Number(result.lat)) ? Number(result.lat) : null,
      longitude: Number.isFinite(Number(result.lon)) ? Number(result.lon) : null,
      radiusKm: 15,
      isPrimary: false,
    }];
  });
}

async function searchPhoton(query: string, countryCode: string): Promise<ServiceArea[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycode", countryCode);
  for (const layer of ["locality", "district", "city", "county", "state"]) {
    url.searchParams.append("layer", layer);
  }
  url.searchParams.set("lang", "en");
  url.searchParams.set("limit", "12");
  const response = await fetch(url, {
    headers: { "User-Agent": "AnyJob Marketplace/1.0 (https://anyjob-mu.vercel.app)" },
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error("Locality search is temporarily unavailable.");
  const payload = await response.json() as { features?: PhotonFeature[] };

  return (payload.features || []).flatMap((feature) => {
    const properties = feature.properties || {};
    const resultCountry = text(properties.countrycode).toUpperCase();
    const locality = text(properties.city || properties.town || properties.village || properties.district || properties.county || properties.name);
    const coordinates = feature.geometry?.coordinates || [];
    const longitude = Number(coordinates[0]);
    const latitude = Number(coordinates[1]);
    const placeId = [text(properties.osm_type), String(properties.osm_id || ""), locality].filter(Boolean).join(":");
    if (!placeId || !locality || resultCountry !== countryCode) return [];
    return [{
      provider: "photon" as const,
      placeId,
      label: localityLabel([
        text(properties.name) === locality ? undefined : text(properties.name),
        locality,
        text(properties.state || properties.county),
        text(properties.country),
      ]),
      locality,
      region: text(properties.state || properties.county),
      country: text(properties.country),
      countryCode: resultCountry,
      postalCode: text(properties.postcode),
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      radiusKm: 15,
      isPrimary: false,
    }];
  }).slice(0, 8);
}

export async function GET(request: NextRequest) {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!allowed(user.id)) return NextResponse.json({ error: "Too many searches. Wait a moment and try again." }, { status: 429 });

  const query = text(request.nextUrl.searchParams.get("q")).slice(0, 100);
  if (query.length < 3) return NextResponse.json({ areas: [] });

  const admin = createAdminSupabaseClient() as never as LooseAdminClient;
  const { data: seller, error } = await admin
    .from("sellers")
    .select("country,country_code")
    .eq("id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!seller?.country_code) {
    return NextResponse.json({ error: "Verify your marketplace location before choosing service areas." }, { status: 409 });
  }

  try {
    const areas = process.env.GEOAPIFY_API_KEY
      ? await searchGeoapify(query, seller.country_code)
      : await searchPhoton(query, seller.country_code);
    return NextResponse.json({ areas, country: seller.country, countryCode: seller.country_code });
  } catch (searchError) {
    return NextResponse.json(
      { error: searchError instanceof Error ? searchError.message : "Locality search failed." },
      { status: 502 },
    );
  }
}
