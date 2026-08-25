"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VerifiedLocation = {
  countryCode: string;
  country: string;
  region: string;
  city: string;
  postalCode: string;
  coarseLatitude: number | null;
  coarseLongitude: number | null;
  accuracyMeters: number | null;
};

type ResolveResponse = {
  location?: VerifiedLocation;
  token?: string;
  error?: string;
};

export function useVerifiedMarketLocation(autoRequest = true) {
  const requested = useRef(false);
  const [location, setLocation] = useState<VerifiedLocation | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      return null;
    }
    setLoading(true);
    setError("");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 15_000,
          maximumAge: 5 * 60_000,
        });
      });
      const response = await fetch("/api/location/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as ResolveResponse;
      if (!response.ok || !payload.location || !payload.token) {
        throw new Error(payload.error || "Location could not be verified.");
      }
      setLocation(payload.location);
      setToken(payload.token);
      return { location: payload.location, token: payload.token };
    } catch (cause) {
      const denied = typeof cause === "object" && cause !== null && "code" in cause && cause.code === 1;
      setError(denied ? "Location permission is required to use the marketplace." : cause instanceof Error ? cause.message : "Location could not be verified.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoRequest || requested.current) return;
    requested.current = true;
    void requestLocation();
  }, [autoRequest, requestLocation]);

  return { location, token, loading, error, requestLocation };
}
