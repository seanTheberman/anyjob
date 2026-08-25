"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Check, Clock, Loader2, RefreshCw, X } from "lucide-react";

import type { ProviderPackageData } from "@/lib/real-providers";
import { cn } from "@/lib/utils";
import { VerifiedLocationFields } from "@/components/location/VerifiedLocationFields";
import { useVerifiedMarketLocation } from "@/hooks/useVerifiedMarketLocation";

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
  providerId,
  providerName,
  listedPackages,
}: ProviderPackageCardProps) {
  const packages = useMemo(
    () => listedPackages.filter((item) => item.price > 0).slice(0, 3),
    [listedPackages],
  );
  const [selected, setSelected] = useState(0);
  const [showHireForm, setShowHireForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    preferredDate: "",
    preferredTime: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });
  const marketLocation = useVerifiedMarketLocation(false);
  const activePackage = packages[Math.min(selected, Math.max(packages.length - 1, 0))];

  useEffect(() => {
    if (selected >= packages.length) setSelected(0);
  }, [packages.length, selected]);

  useEffect(() => {
    if (!marketLocation.location) return;
    setForm((current) => ({
      ...current,
      city: marketLocation.location?.city || "",
      postalCode: marketLocation.location?.postalCode || "",
    }));
  }, [marketLocation.location]);

  const setField = (key: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  async function hirePackage() {
    if (!activePackage) return;
    setSubmitting(true);
    setError("");

    try {
      const directResponse = await fetch("/api/direct-hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          serviceId: activePackage.serviceId,
          packageTier: activePackage.tier,
          locationToken: marketLocation.token,
          ...form,
        }),
      });
      const directData = await directResponse.json().catch(() => ({}));

      if (directResponse.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!directResponse.ok) {
        throw new Error(directData.error || "Could not start direct hire.");
      }

      const checkoutResponse = await fetch("/api/payments/bid-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bid_id: directData.bid?.id }),
      });
      const checkoutData = await checkoutResponse.json().catch(() => ({}));

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || "Could not start payment.");
      }
      window.location.href = checkoutData.checkoutUrl || `/dashboard/requests/${directData.inquiry?.id}`;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start direct hire.");
      setSubmitting(false);
    }
  }

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

        <button
          type="button"
          onClick={() => {
            setShowHireForm(true);
            void marketLocation.requestLocation();
          }}
          className="mt-6 flex h-12 w-full items-center justify-center rounded bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-red-600"
        >
          Hire this package
        </button>

        <p className="mt-3 rounded bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
          Book this fixed-price package directly, or
          <a href={bookingHref} className="ml-1 text-slate-950 underline underline-offset-2">
            post a custom request instead
          </a>
          .
        </p>
      </div>

      {showHireForm ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 px-3 py-4 sm:items-center sm:justify-center">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-600">Direct hire</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">{activePackage.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {providerName} · {formatPrice(activePackage.price)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close direct hire"
                onClick={() => setShowHireForm(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-950"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">
                Date
                <input type="date" required value={form.preferredDate} onChange={setField("preferredDate")} className="mt-1 h-11 w-full rounded border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-slate-950" />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Time
                <input type="time" required value={form.preferredTime} onChange={setField("preferredTime")} className="mt-1 h-11 w-full rounded border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-slate-950" />
              </label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                Address
                <input required value={form.address} onChange={setField("address")} placeholder="Street address" className="mt-1 h-11 w-full rounded border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-slate-950" />
              </label>
              <div className="sm:col-span-2">
                <VerifiedLocationFields
                  location={marketLocation.location}
                  loading={marketLocation.loading}
                  error={marketLocation.error}
                  onRetry={() => void marketLocation.requestLocation()}
                />
              </div>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                Notes for provider
                <textarea value={form.notes} onChange={setField("notes")} placeholder="Add access notes, scope, or timing details" rows={4} className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-slate-950" />
              </label>
            </div>

            {error ? <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}

            <button
              type="button"
              disabled={submitting || !form.preferredDate || !form.preferredTime || !form.address.trim() || !form.city.trim() || !marketLocation.token}
              onClick={hirePackage}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded bg-red-600 px-4 text-sm font-black text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Pay and hire package
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
