import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { marketLocationFromHeaders } from "@/lib/location/market-location";

export const MAX_SERVICE_AREAS = 12;
export const DEFAULT_SERVICE_RADIUS_KM = 15;

export type ServiceArea = {
  id?: string;
  provider: "geoapify" | "photon" | "profile";
  placeId: string;
  label: string;
  locality: string;
  region: string;
  country: string;
  countryCode: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
  isPrimary: boolean;
};

type LooseAdminClient = { from(table: string): any };

function cleanText(value: unknown, maxLength = 180) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function coordinate(value: unknown, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function radius(value: unknown) {
  const parsed = Math.round(Number(value));
  return Number.isFinite(parsed)
    ? Math.min(100, Math.max(1, parsed))
    : DEFAULT_SERVICE_RADIUS_KM;
}

export function serviceAreaFromRow(row: Record<string, unknown>): ServiceArea {
  return {
    id: cleanText(row.id),
    provider: row.provider === "geoapify" || row.provider === "profile" ? row.provider : "photon",
    placeId: cleanText(row.provider_place_id),
    label: cleanText(row.label),
    locality: cleanText(row.locality),
    region: cleanText(row.region),
    country: cleanText(row.country_name),
    countryCode: cleanText(row.country_code, 2).toUpperCase(),
    postalCode: cleanText(row.postal_code, 30),
    latitude: coordinate(row.latitude, -90, 90),
    longitude: coordinate(row.longitude, -180, 180),
    radiusKm: radius(row.radius_km),
    isPrimary: Boolean(row.is_primary),
  };
}

export function parseServiceAreaInput(value: unknown, countryCode: string, index: number): ServiceArea | null {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const locality = cleanText(row.locality, 120);
  const label = cleanText(row.label);
  const placeId = cleanText(row.placeId, 240);
  const provider = row.provider === "geoapify" || row.provider === "photon" || row.provider === "profile"
    ? row.provider
    : null;
  const areaCountryCode = cleanText(row.countryCode, 2).toUpperCase();

  if (!provider || !placeId || !locality || !label || areaCountryCode !== countryCode) return null;

  return {
    provider,
    placeId,
    label,
    locality,
    region: cleanText(row.region, 120),
    country: cleanText(row.country, 120),
    countryCode: areaCountryCode,
    postalCode: cleanText(row.postalCode, 30),
    latitude: coordinate(row.latitude, -90, 90),
    longitude: coordinate(row.longitude, -180, 180),
    radiusKm: radius(row.radiusKm),
    isPrimary: index === 0,
  };
}

export function serviceAreaToRow(sellerId: string, area: ServiceArea) {
  return {
    seller_id: sellerId,
    provider: area.provider,
    provider_place_id: area.placeId,
    label: area.label,
    locality: area.locality,
    region: area.region || null,
    country_name: area.country,
    country_code: area.countryCode,
    postal_code: area.postalCode || null,
    latitude: area.latitude,
    longitude: area.longitude,
    radius_km: area.radiusKm,
    is_primary: area.isPrimary,
  };
}

export async function getSellerServiceAreas(sellerIds: string[], adminClient?: LooseAdminClient) {
  const uniqueIds = Array.from(new Set(sellerIds.filter(Boolean)));
  const bySeller = new Map<string, ServiceArea[]>();
  if (!uniqueIds.length) return bySeller;

  const admin = adminClient || (createAdminSupabaseClient() as never as LooseAdminClient);
  const { data, error } = await admin
    .from("seller_service_areas")
    .select("id,seller_id,provider,provider_place_id,label,locality,region,country_name,country_code,postal_code,latitude,longitude,radius_km,is_primary")
    .in("seller_id", uniqueIds)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  for (const row of data || []) {
    const sellerId = cleanText(row.seller_id);
    bySeller.set(sellerId, [...(bySeller.get(sellerId) || []), serviceAreaFromRow(row)]);
  }
  return bySeller;
}

export function distanceKm(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
) {
  const radians = (value: number) => value * Math.PI / 180;
  const deltaLatitude = radians(second.latitude - first.latitude);
  const deltaLongitude = radians(second.longitude - first.longitude);
  const latitude1 = radians(first.latitude);
  const latitude2 = radians(second.latitude);
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function serviceAreaMatches(
  areas: ServiceArea[],
  viewer: { countryCode?: string | null; city?: string | null; latitude?: number | null; longitude?: number | null },
) {
  const countryCode = cleanText(viewer.countryCode, 2).toUpperCase();
  const city = cleanText(viewer.city, 120).toLocaleLowerCase();
  return areas.some((area) => {
    if (area.countryCode !== countryCode) return false;
    if (
      viewer.latitude != null && viewer.longitude != null
      && area.latitude != null && area.longitude != null
    ) {
      return distanceKm(
        { latitude: viewer.latitude, longitude: viewer.longitude },
        { latitude: area.latitude, longitude: area.longitude },
      ) <= area.radiusKm;
    }
    return Boolean(city && area.locality.toLocaleLowerCase() === city);
  });
}

export function serviceAreasForDisplay(areas: ServiceArea[]) {
  return areas.map((area) => ({
    label: area.label,
    locality: area.locality,
    region: area.region,
    country: area.country,
    countryCode: area.countryCode,
    radiusKm: area.radiusKm,
  }));
}

export async function viewerServiceLocation(request: Request, userId?: string | null) {
  const headerLocation = marketLocationFromHeaders(request.headers);
  if (userId) {
    const admin = createAdminSupabaseClient() as never as LooseAdminClient;
    const { data } = await admin
      .from("user_market_locations")
      .select("country_code,city,coarse_latitude,coarse_longitude")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.country_code) {
      return {
        countryCode: cleanText(data.country_code, 2).toUpperCase(),
        city: cleanText(data.city, 120),
        latitude: coordinate(data.coarse_latitude, -90, 90),
        longitude: coordinate(data.coarse_longitude, -180, 180),
      };
    }
  }
  return {
    countryCode: headerLocation.countryCode || "IE",
    city: headerLocation.city,
    latitude: coordinate(headerLocation.latitude, -90, 90),
    longitude: coordinate(headerLocation.longitude, -180, 180),
  };
}
