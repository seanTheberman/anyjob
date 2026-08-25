import * as Location from "expo-location";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, jsonBody } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export type MobileMarketLocation = {
  countryCode: string;
  country: string;
  region: string;
  city: string;
  postalCode: string;
  coarseLatitude: number | null;
  coarseLongitude: number | null;
  accuracyMeters: number | null;
};

type MarketLocationContextValue = {
  location: MobileMarketLocation | null;
  token: string;
  loading: boolean;
  error: string;
  refresh: () => Promise<MobileMarketLocation | null>;
};

const MarketLocationContext = createContext<MarketLocationContextValue | null>(null);

export function MarketLocationProvider({ children }: { children: React.ReactNode }) {
  const { loading: authLoading, user } = useAuth();
  const [location, setLocation] = useState<MobileMarketLocation | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Approximate location permission is required to use the AnyJob marketplace.");
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await api<{ location: MobileMarketLocation; token: string }>(
        "/api/location/resolve",
        {
          method: "POST",
          ...jsonBody({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
          }),
        },
      );
      setLocation(result.location);
      setToken(result.token);
      return result.location;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Location could not be verified.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh, user?.id]);

  const value = useMemo(
    () => ({ location, token, loading, error, refresh }),
    [error, loading, location, refresh, token],
  );
  return <MarketLocationContext.Provider value={value}>{children}</MarketLocationContext.Provider>;
}

export function useMarketLocation() {
  const value = useContext(MarketLocationContext);
  if (!value) throw new Error("useMarketLocation must be used inside MarketLocationProvider");
  return value;
}
