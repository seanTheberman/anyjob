import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type VerifiedMarketLocation = {
  countryCode: string;
  country: string;
  region: string;
  city: string;
  postalCode: string;
  coarseLatitude: number | null;
  coarseLongitude: number | null;
  accuracyMeters: number | null;
  ipCountryCode: string | null;
  gpsCountryCode: string | null;
  source: "gps" | "ip" | "gps_ip";
  expiresAt: number;
};

export class MarketLocationError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function signingKey() {
  const key = process.env.LOCATION_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing location token signing secret");
  return key;
}

function cleanCountryCode(value: string | null | undefined) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

type HeaderReader = Pick<Headers, "get">;

function headerValue(headers: HeaderReader, name: string) {
  const value = headers.get(name);
  if (!value) return "";
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function countryName(code: string) {
  return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
}

export function marketLocationFromHeaders(headers: HeaderReader) {
  const countryCode = cleanCountryCode(headers.get("x-vercel-ip-country"));
  return {
    countryCode,
    country: countryCode ? countryName(countryCode) : "",
    region: headerValue(headers, "x-vercel-ip-country-region"),
    city: headerValue(headers, "x-vercel-ip-city"),
    postalCode: headerValue(headers, "x-vercel-ip-postal-code"),
    latitude: Number(headers.get("x-vercel-ip-latitude") || NaN),
    longitude: Number(headers.get("x-vercel-ip-longitude") || NaN),
  };
}

export function ipMarketLocation(request: Request) {
  return marketLocationFromHeaders(request.headers);
}

type ReverseResult = {
  countryCode: string | null;
  country: string;
  region: string;
  city: string;
  postalCode: string;
};

type DeviceLocationResult = {
  countryCode: string | null;
  country: string;
  region: string;
  city: string;
  postalCode: string;
};

function cleanLocationText(value: unknown, maxLength = 120) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function deviceLocationResult(value: unknown): DeviceLocationResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const countryCode = cleanCountryCode(cleanLocationText(row.countryCode, 2));
  return {
    countryCode,
    country: cleanLocationText(row.country),
    region: cleanLocationText(row.region),
    city: cleanLocationText(row.city),
    postalCode: cleanLocationText(row.postalCode, 30),
  };
}

function formatIrishEircode(value: unknown) {
  const compact = cleanLocationText(value, 30).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z0-9]{7}$/.test(compact)) return "";
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

function resolvedPostalCode(
  countryCode: string,
  reverse: ReverseResult | null,
  device: DeviceLocationResult | null,
  ip: ReturnType<typeof ipMarketLocation>,
) {
  const matchingDevice = device?.countryCode === countryCode ? device : null;
  if (countryCode === "IE") {
    return formatIrishEircode(matchingDevice?.postalCode) || formatIrishEircode(reverse?.postalCode);
  }
  return reverse?.postalCode || matchingDevice?.postalCode || (!reverse ? ip.postalCode : "");
}

async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseResult | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "geocodejson");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("zoom", "14");
    url.searchParams.set("addressdetails", "1");
    const response = await fetch(url, {
      headers: {
        Accept: "application/geocode+json, application/json",
        "Accept-Language": "en",
        "User-Agent": "AnyJob Marketplace/1.0 (https://anyjob-mu.vercel.app)",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      features?: Array<{ properties?: { geocoding?: Record<string, unknown> } }>;
    };
    const geo = payload.features?.[0]?.properties?.geocoding || {};
    const text = (key: string) => (typeof geo[key] === "string" ? String(geo[key]).trim() : "");
    return {
      countryCode: cleanCountryCode(text("country_code")),
      country: text("country"),
      region: text("state") || text("county"),
      city: text("city") || text("locality") || text("district") || text("county"),
      postalCode: text("postcode"),
    };
  } catch {
    return null;
  }
}

function validCoordinate(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

export async function resolveMarketLocation(request: Request, input: Record<string, unknown>) {
  const latitude = validCoordinate(input.latitude, -90, 90);
  const longitude = validCoordinate(input.longitude, -180, 180);
  const accuracy = Number(input.accuracyMeters);
  const ip = ipMarketLocation(request);
  const device = deviceLocationResult(input.deviceLocation);
  const reverse = latitude != null && longitude != null
    ? await reverseGeocode(latitude, longitude)
    : null;
  const gpsCountryCode = reverse?.countryCode || null;

  if (ip.countryCode && gpsCountryCode && ip.countryCode !== gpsCountryCode) {
    throw new MarketLocationError(
      `Your device location (${countryName(gpsCountryCode)}) does not match your network location (${countryName(ip.countryCode)}). Disable any VPN and try again.`,
      409,
    );
  }

  const code = gpsCountryCode || ip.countryCode;
  if (!code) {
    throw new MarketLocationError("AnyJob could not verify your marketplace country. Enable location access and try again.");
  }
  const matchingDevice = device?.countryCode === code ? device : null;
  const city = reverse?.city || matchingDevice?.city || ip.city;
  if (!city) {
    throw new MarketLocationError("AnyJob could not determine your city. Move to an area with location signal and try again.");
  }

  return {
    countryCode: code,
    country: reverse?.country || matchingDevice?.country || ip.country || countryName(code),
    region: reverse?.region || matchingDevice?.region || ip.region,
    city,
    postalCode: resolvedPostalCode(code, reverse, device, ip),
    coarseLatitude: latitude == null ? (Number.isFinite(ip.latitude) ? Math.round(ip.latitude * 100) / 100 : null) : Math.round(latitude * 100) / 100,
    coarseLongitude: longitude == null ? (Number.isFinite(ip.longitude) ? Math.round(ip.longitude * 100) / 100 : null) : Math.round(longitude * 100) / 100,
    accuracyMeters: Number.isFinite(accuracy) ? Math.max(0, Math.round(accuracy)) : null,
    ipCountryCode: ip.countryCode,
    gpsCountryCode,
    source: gpsCountryCode && ip.countryCode ? "gps_ip" : gpsCountryCode ? "gps" : "ip",
    expiresAt: Date.now() + 2 * 60 * 60_000,
  } satisfies VerifiedMarketLocation;
}

export function signMarketLocation(location: VerifiedMarketLocation) {
  const payload = Buffer.from(JSON.stringify(location)).toString("base64url");
  const signature = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyMarketLocationToken(request: Request, token: unknown) {
  if (typeof token !== "string" || !token.includes(".")) {
    throw new MarketLocationError("Verify your location before continuing.");
  }
  const [payload, suppliedSignature] = token.split(".", 2);
  const expectedSignature = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new MarketLocationError("Location verification is invalid. Verify your location again.");
  }
  let location: VerifiedMarketLocation;
  try {
    location = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as VerifiedMarketLocation;
  } catch {
    throw new MarketLocationError("Location verification is invalid. Verify your location again.");
  }
  if (!cleanCountryCode(location.countryCode) || !location.city || !location.country) {
    throw new MarketLocationError("Location verification is incomplete. Verify your location again.");
  }
  if (!location.expiresAt || location.expiresAt < Date.now()) {
    throw new MarketLocationError("Location verification expired. Verify your location again.");
  }
  const currentIpCountry = ipMarketLocation(request).countryCode;
  if (currentIpCountry && currentIpCountry !== location.countryCode) {
    throw new MarketLocationError("Your network country changed. Disable any VPN and verify your location again.", 409);
  }
  return location;
}

export async function persistUserMarketLocation(userId: string, location: VerifiedMarketLocation) {
  // Generated database types do not yet include the location migration tables.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminSupabaseClient() as never as { from(table: string): any };
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    country_code: location.countryCode,
    country_name: location.country,
    region: location.region || null,
    city: location.city || null,
    postal_code: location.postalCode || null,
    coarse_latitude: location.coarseLatitude,
    coarse_longitude: location.coarseLongitude,
    accuracy_meters: location.accuracyMeters,
    ip_country_code: location.ipCountryCode,
    gps_country_code: location.gpsCountryCode,
    verification_source: location.source,
    verified_at: now,
    updated_at: now,
  };
  const { error } = await admin.from("user_market_locations").upsert(row, { onConflict: "user_id" });
  if (error) throw new Error(error.message);

  const profileFields = {
    country: location.country,
    country_code: location.countryCode,
    region: location.region || null,
    city: location.city,
    postal_code: location.postalCode || null,
    location_verified_at: now,
  };
  const updates = await Promise.all([
    admin.from("eloo_profiles").update(profileFields).eq("id", userId),
    admin.from("buyers").update(profileFields).eq("id", userId),
    admin.from("sellers").update(profileFields).eq("id", userId),
    admin.from("business_profiles").update(profileFields).eq("owner_user_id", userId),
    admin.from("shift_worker_profiles").update({ country_code: location.countryCode }).eq("user_id", userId),
  ]);
  const profileError = updates.find((result: { error?: { message?: string } | null }) => result.error)?.error;
  if (profileError) throw new Error(profileError.message || "Could not update profile location");
}

export async function viewerCountryCode(request: Request, userId?: string | null) {
  const ipCode = ipMarketLocation(request).countryCode;
  if (userId) {
    // Generated database types do not yet include user_market_locations.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminSupabaseClient() as never as { from(table: string): any };
    const { data } = await admin
      .from("user_market_locations")
      .select("country_code")
      .eq("user_id", userId)
      .maybeSingle();
    const stored = cleanCountryCode(data?.country_code);
    if (stored) return stored;
  }
  if (ipCode) return ipCode;
  return "IE";
}

export function countryCodeFromName(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["ireland", "ie", "eire", "éire"].includes(normalized)) return "IE";
  if (["united kingdom", "uk", "gb", "great britain", "england", "scotland", "wales", "northern ireland"].includes(normalized)) return "GB";
  if (["france", "fr"].includes(normalized)) return "FR";
  if (["india", "in"].includes(normalized)) return "IN";
  return cleanCountryCode(String(value || ""));
}
