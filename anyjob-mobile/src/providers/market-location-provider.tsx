import * as Location from "expo-location";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState, Linking, Platform } from "react-native";

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
  needsSettings: boolean;
  openSettings: () => Promise<void>;
  refresh: () => Promise<MobileMarketLocation | null>;
};

const MarketLocationContext = createContext<MarketLocationContextValue | null>(null);

export function MarketLocationProvider({ children }: { children: React.ReactNode }) {
  const { loading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<MobileMarketLocation | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsSettings, setNeedsSettings] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setNeedsSettings(true);
        throw new Error("Location Services are turned off. Open Settings to enable location for AnyJob.");
      }
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!permission.granted) {
        setNeedsSettings(!permission.canAskAgain);
        throw new Error(
          permission.canAskAgain
            ? "Approximate location permission is required to use the AnyJob marketplace."
            : "Location access is disabled. Open Settings and allow location access for AnyJob.",
        );
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const deviceAddress = Platform.OS === "web"
        ? null
        : (await Location.reverseGeocodeAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }).catch(() => []))[0] || null;
      const result = await api<{ location: MobileMarketLocation; token: string }>(
        "/api/location/resolve",
        {
          method: "POST",
          ...jsonBody({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
            deviceLocation: deviceAddress
              ? {
                  countryCode: deviceAddress.isoCountryCode,
                  country: deviceAddress.country,
                  region: deviceAddress.region,
                  city: deviceAddress.city || deviceAddress.district || deviceAddress.subregion,
                  postalCode: deviceAddress.postalCode,
                }
              : null,
          }),
        },
      );
      setLocation(result.location);
      setToken(result.token);
      setNeedsSettings(false);
      void queryClient.invalidateQueries({ queryKey: ["account"] });
      return result.location;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Location could not be verified.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const openSettings = useCallback(() => Linking.openSettings(), []);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh, user?.id]);

  useEffect(() => {
    if (!needsSettings) return;
    let leftApp = false;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        leftApp = true;
        return;
      }
      if (leftApp) {
        leftApp = false;
        void refresh();
      }
    });
    return () => subscription.remove();
  }, [needsSettings, refresh]);

  const value = useMemo(
    () => ({ location, token, loading, error, needsSettings, openSettings, refresh }),
    [error, loading, location, needsSettings, openSettings, refresh, token],
  );
  return <MarketLocationContext.Provider value={value}>{children}</MarketLocationContext.Provider>;
}

export function useMarketLocation() {
  const value = useContext(MarketLocationContext);
  if (!value) throw new Error("useMarketLocation must be used inside MarketLocationProvider");
  return value;
}
