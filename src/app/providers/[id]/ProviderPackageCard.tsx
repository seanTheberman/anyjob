"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Clock, MessageCircle, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

type PackageKey = "basic" | "standard" | "premium";

type ProviderPackageCardProps = {
  bookingHref: string;
  providerName: string;
  category: string;
  baseRate: number;
  responseTime: string;
};

const packageOrder: PackageKey[] = ["basic", "standard", "premium"];

function formatPrice(value: number) {
  if (!value) return "Rate not set";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProviderPackageCard({
  bookingHref,
  providerName,
  category,
  baseRate,
  responseTime,
}: ProviderPackageCardProps) {
  const [selected, setSelected] = useState<PackageKey>("basic");

  const packages = useMemo(() => ({
    basic: {
      label: "Basic",
      title: "Starter booking",
      price: baseRate,
      delivery: "1 task",
      revisions: "1 revision",
      description: `A focused ${category.toLowerCase()} booking for one clear task.`,
      features: ["Direct provider request", "Secure booking flow", responseTime].filter(Boolean),
    },
    standard: {
      label: "Standard",
      title: "Most booked",
      price: Math.max(baseRate * 2, baseRate + 25),
      delivery: "2 tasks",
      revisions: "2 revisions",
      description: `A longer ${category.toLowerCase()} session with priority coordination.`,
      features: ["Priority request review", "Flexible task details", "Progress updates"],
    },
    premium: {
      label: "Premium",
      title: "Full support",
      price: Math.max(baseRate * 3, baseRate + 50),
      delivery: "Custom scope",
      revisions: "3 revisions",
      description: `Best for multi-step ${category.toLowerCase()} work or urgent help.`,
      features: ["Custom scope planning", "Fastest available slot", "Extended support"],
    },
  }), [baseRate, category, responseTime]);

  const activePackage = packages[selected];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-3 border-b border-slate-200">
        {packageOrder.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelected(key)}
            className={cn(
              "h-12 border-r border-slate-200 text-sm font-bold text-slate-600 last:border-r-0",
              selected === key && "border-b-2 border-slate-950 text-slate-950"
            )}
          >
            {packages[key].label}
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
            {activePackage.delivery}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4 text-slate-500" />
            {activePackage.revisions}
          </span>
        </div>

        <ul className="mt-5 space-y-2">
          {activePackage.features.map((feature) => (
            <li key={feature} className="flex gap-2 text-sm font-medium text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          href={bookingHref}
          className="mt-6 flex h-12 w-full items-center justify-center rounded bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-red-600"
        >
          Continue
        </Link>

        <Link
          href={`/dashboard/mail?provider=${encodeURIComponent(providerName)}`}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded border border-slate-300 px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-50"
        >
          <MessageCircle className="h-4 w-4" />
          Contact provider
        </Link>
      </div>
    </div>
  );
}
