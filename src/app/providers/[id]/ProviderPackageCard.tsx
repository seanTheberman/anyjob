"use client";

import { useMemo, useState } from "react";
import { Check, Clock, RefreshCw } from "lucide-react";

import type { ProviderPackageData } from "@/lib/real-providers";
import { cn } from "@/lib/utils";

type ProviderPackageCardProps = {
  bookingHref: string;
  providerId: string;
  providerName: string;
  listedPackages: ProviderPackageData[];
};

function formatPrice(value: number) {
  if (!value) return "Rate not set";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProviderPackageCard({
  bookingHref,
  providerName,
  listedPackages,
}: ProviderPackageCardProps) {
  const packages = useMemo(
    () => listedPackages.filter((item) => item.price > 0).slice(0, 3),
    [listedPackages],
  );
  const [selected, setSelected] = useState(0);
  const activePackage = packages[Math.min(selected, Math.max(packages.length - 1, 0))];

  const packageRequestHref = activePackage
    ? `${bookingHref}&serviceId=${encodeURIComponent(activePackage.serviceId)}&packageTier=${encodeURIComponent(activePackage.tier)}`
    : bookingHref;

  if (!activePackage) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">Custom requests only</h2>
        <p className="mt-2 text-sm leading-5 text-slate-600">
          {providerName} has not published a fixed-price package yet.
        </p>
        <a
          href={bookingHref}
          className="mt-5 flex h-12 w-full items-center justify-center rounded bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-red-600"
        >
          Post a custom request
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div
        className="grid border-b border-slate-200"
        style={{ gridTemplateColumns: `repeat(${packages.length}, minmax(0, 1fr))` }}
      >
        {packages.map((item, index) => (
          <button
            key={`${item.serviceId}-${item.tier}`}
            type="button"
            onClick={() => setSelected(index)}
            className={cn(
              "h-12 truncate border-r border-slate-200 px-2 text-sm font-bold text-slate-600 last:border-r-0",
              selected === index && "border-b-2 border-slate-950 text-slate-950",
            )}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-950">{activePackage.title}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">{activePackage.description}</p>
          </div>
          <p className="shrink-0 text-2xl font-bold text-slate-950">{formatPrice(activePackage.price)}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-500" />
            {activePackage.deliveryDays} day{activePackage.deliveryDays === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4 text-slate-500" />
            {activePackage.revisions} revision{activePackage.revisions === 1 ? "" : "s"}
          </span>
        </div>

        {activePackage.features.length ? (
          <ul className="mt-5 space-y-2">
            {activePackage.features.map((feature) => (
              <li key={feature} className="flex gap-2 text-sm font-medium text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <a
          href={packageRequestHref}
          className="mt-6 flex h-12 w-full items-center justify-center rounded bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-red-600"
        >
          Hire this package
        </a>

        <p className="mt-3 rounded bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
          Send the full requirements to {providerName}, or
          <a href={bookingHref} className="ml-1 text-slate-950 underline underline-offset-2">
            post a custom request instead
          </a>
          .
        </p>
      </div>

    </div>
  );
}
