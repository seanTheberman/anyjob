"use client";

import { LocateFixed, Loader2 } from "lucide-react";

import type { VerifiedLocation } from "@/hooks/useVerifiedMarketLocation";

export function VerifiedLocationFields({
  location,
  loading,
  error,
  onRetry,
}: {
  location: VerifiedLocation | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">Verified marketplace location</p>
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          {location ? "Refresh" : "Use location"}
        </button>
      </div>
      {error ? <p className="text-sm font-medium text-red-700" role="alert">{error}</p> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ReadOnlyField label="City" value={location?.city || "Waiting for location"} />
        <ReadOnlyField label="State / region" value={location?.region || "Not available"} />
        <ReadOnlyField label="Postal code" value={location?.postalCode || "Not available"} />
        <ReadOnlyField label="Country" value={location?.country || "Waiting for location"} />
      </div>
      <p className="text-xs text-gray-500">Location data © OpenStreetMap contributors. Street address is entered separately.</p>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        readOnly
        value={value}
        className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-gray-700"
      />
    </label>
  );
}
