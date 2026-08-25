"use client";

import { LoaderCircle, MapPin, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type ServiceAreaValue = {
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

type Props = {
  areas: ServiceAreaValue[];
  country: string;
  disabled?: boolean;
  radiusKm: number;
  onAreasChange: (areas: ServiceAreaValue[]) => void;
  onRadiusChange: (radiusKm: number) => void;
};

export function ServiceAreaPicker({
  areas,
  country,
  disabled = false,
  radiusKm,
  onAreasChange,
  onRadiusChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ServiceAreaValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedKeys = useMemo(
    () => new Set(areas.map((area) => `${area.provider}:${area.placeId}`)),
    [areas],
  );

  useEffect(() => {
    if (disabled || query.trim().length < 3) {
      setResults([]);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/localities/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error || "Could not search locations.");
        setResults((payload?.areas || []).filter(
          (area: ServiceAreaValue) => !selectedKeys.has(`${area.provider}:${area.placeId}`),
        ));
      } catch (searchError) {
        if (!controller.signal.aborted) {
          setError(searchError instanceof Error ? searchError.message : "Could not search locations.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [disabled, query, selectedKeys]);

  function addArea(area: ServiceAreaValue) {
    if (areas.length >= 12) return;
    onAreasChange([...areas, { ...area, radiusKm, isPrimary: areas.length === 0 }]);
    setQuery("");
    setResults([]);
  }

  function removeArea(index: number) {
    onAreasChange(areas.filter((_, areaIndex) => areaIndex !== index).map(
      (area, areaIndex) => ({ ...area, isPrimary: areaIndex === 0 }),
    ));
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="service-area-search" className="text-sm font-medium text-gray-700">Seller preference areas</label>
          <span className="text-xs font-medium text-gray-500">{areas.length}/12</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Choose cities, towns, districts, or postcodes in {country || "your verified country"}.</p>
        {disabled ? null : (
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="service-area-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={areas.length >= 12}
              autoComplete="off"
              placeholder={areas.length >= 12 ? "Maximum 12 areas selected" : "Search a locality or postcode"}
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
            {loading ? <LoaderCircle className="absolute right-3 top-3 h-5 w-5 animate-spin text-gray-400" /> : null}
            {results.length ? (
              <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {results.map((area) => (
                  <button
                    key={`${area.provider}:${area.placeId}`}
                    type="button"
                    onClick={() => addArea(area)}
                    className="flex w-full items-start gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span className="min-w-0 break-words">{area.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
        {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
      </div>

      {areas.length ? (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {areas.map((area, index) => (
            <div key={`${area.provider}:${area.placeId}`} className="flex min-w-0 items-center gap-3 px-3 py-3">
              <MapPin className="h-4 w-4 shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-gray-900">{area.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{index === 0 ? "Primary area" : `Within ${radiusKm} km`}</p>
              </div>
              {disabled ? null : (
                <button
                  type="button"
                  onClick={() => removeArea(index)}
                  aria-label={`Remove ${area.label}`}
                  className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-gray-500">No preferred service areas selected.</p>
      )}

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="service-radius" className="text-sm font-medium text-gray-700">Travel radius</label>
          <span className="text-sm font-bold text-gray-900">{radiusKm} km</span>
        </div>
        <input
          id="service-radius"
          type="range"
          min={1}
          max={100}
          step={1}
          value={radiusKm}
          disabled={disabled}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
          className="mt-2 w-full accent-blue-600 disabled:opacity-60"
        />
      </div>
    </div>
  );
}
