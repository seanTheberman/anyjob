"use client";

import type { ReactNode } from "react";
import { useState } from "react";

interface AdminActionButtonProps {
  label: string;
  context?: string;
  variant?: "primary" | "secondary";
  children?: ReactNode;
}

export function AdminActionButton({ label, context = "admin item", variant = "secondary", children }: AdminActionButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function runAction() {
    const normalized = `${label} ${context}`.toLowerCase();
    if (label.toLowerCase() === "download") {
      const kind = normalized.includes("seller")
        ? "sellers"
        : normalized.includes("service")
          ? "service_inquiries"
          : normalized.includes("booking")
            ? "bookings"
            : normalized.includes("review")
              ? "reviews"
              : "profiles";
      window.location.href = `/api/admin/export?kind=${kind}`;
      setMessage(`Downloading ${context}.`);
      window.setTimeout(() => setMessage(null), 3500);
      return;
    }

    setPending(true);
    setMessage(null);
    const response = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, context }),
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);
    setMessage(response.ok ? payload.message || `${label} completed.` : payload.error || `${label} failed.`);
    window.setTimeout(() => setMessage(null), 4500);
  }

  const className = variant === "primary"
    ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
    : "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50";

  return (
    <span className="relative inline-flex">
      <button type="button" disabled={pending} onClick={runAction} className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}>
        {pending ? "Working..." : children || label}
      </button>
      {message ? (
        <span className="absolute right-0 top-11 z-20 w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 shadow-lg">
          {message}
        </span>
      ) : null}
    </span>
  );
}
