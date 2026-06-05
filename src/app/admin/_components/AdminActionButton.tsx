"use client";

import { useState } from "react";

interface AdminActionButtonProps {
  label: string;
  context?: string;
  variant?: "primary" | "secondary";
}

export function AdminActionButton({ label, context = "admin item", variant = "secondary" }: AdminActionButtonProps) {
  const [message, setMessage] = useState<string | null>(null);

  function runAction() {
    const nextMessage = `${label} queued for ${context}.`;
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(null), 3500);
  }

  const className = variant === "primary"
    ? "inline-flex h-9 items-center justify-center rounded-lg bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
    : "inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50";

  return (
    <span className="relative inline-flex">
      <button type="button" onClick={runAction} className={className}>
        {label}
      </button>
      {message ? (
        <span className="absolute right-0 top-11 z-20 w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 shadow-lg">
          {message}
        </span>
      ) : null}
    </span>
  );
}
