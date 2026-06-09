"use client";

import { ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";

const INSURANCE_NOTICE_TITLE = "Provider insurance warning";
const INSURANCE_NOTICE_MESSAGE =
  "AnyJob does not provide individual insurance. Providers must arrange their own insurance for emergencies, accidents, or liability. AnyJob may restrict or block work when a provider lacks required insurance.";

export function InsuranceNotice({ compact = false, accent = "red" }: { compact?: boolean; accent?: "red" | "green" | "slate" }) {
  const color = accent === "green"
    ? {
        border: "border-green-200",
        bg: "bg-green-50",
        iconBg: "bg-white",
        icon: "text-green-700",
        title: "text-green-950",
        text: "text-green-900",
      }
    : accent === "slate"
      ? {
          border: "border-amber-200",
          bg: "bg-amber-50",
          iconBg: "bg-white",
          icon: "text-amber-700",
          title: "text-amber-950",
          text: "text-amber-900",
        }
      : {
          border: "border-red-200",
          bg: "bg-red-50",
          iconBg: "bg-white",
          icon: "text-red-700",
          title: "text-red-950",
          text: "text-red-900",
        };

  return (
    <section
      aria-label="Insurance warning"
      className={cn(
        "rounded-lg border shadow-sm",
        color.border,
        color.bg,
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex shrink-0 items-center justify-center rounded-full", color.iconBg, compact ? "h-8 w-8" : "h-10 w-10")}>
          <ShieldAlert className={cn(color.icon, compact ? "h-4 w-4" : "h-5 w-5")} />
        </span>
        <div className="min-w-0">
          <p className={cn("font-bold", color.title, compact ? "text-sm" : "text-base")}>{INSURANCE_NOTICE_TITLE}</p>
          <p className={cn("mt-1 leading-6", color.text, compact ? "text-xs" : "text-sm")}>{INSURANCE_NOTICE_MESSAGE}</p>
        </div>
      </div>
    </section>
  );
}
