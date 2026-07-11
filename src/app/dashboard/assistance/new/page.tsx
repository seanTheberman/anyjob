"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SupportTicketCenter } from "@/components/support/SupportTicketCenter";

export default function NewAssistanceRequestPage() {
  const [type, setType] = useState<"user" | "business">("user");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setType(params.get("type") === "business" ? "business" : "user");
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/dashboard/assistance" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to assistance
        </Link>
        <SupportTicketCenter
          key={type}
          defaultRequesterType={type}
          requesterOptions={["user", "business"]}
          heading="New support ticket"
          description="Tell AnyJob what happened. The admin support queue will prioritize unresolved and delayed tickets automatically."
          initialShowForm
        />
      </div>
    </DashboardLayout>
  );
}
