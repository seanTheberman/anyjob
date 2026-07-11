"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export function BuyerPlanCheckoutButton({
  planId,
  label,
  isFree,
  featured,
}: {
  planId: string;
  label: string;
  isFree: boolean;
  featured?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);

    if (isFree) {
      window.location.href = "/dashboard/requests";
      return;
    }

    setPending(true);
    const response = await fetch("/api/payments/buyer-plan-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);

    if (response.status === 401) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }

    if (!response.ok || !payload.checkoutUrl) {
      setError(payload.error || "Could not start checkout.");
      return;
    }

    window.location.href = payload.checkoutUrl;
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={pending}
        className={[
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
          featured
            ? "bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700"
            : "bg-slate-950 text-white hover:bg-slate-800",
        ].join(" ")}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Opening checkout..." : label}
        {!pending ? <ArrowRight className="h-4 w-4" /> : null}
      </button>
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
