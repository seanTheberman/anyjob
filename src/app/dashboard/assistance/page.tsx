"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SupportTicketCenter } from "@/components/support/SupportTicketCenter";

export default function AssistancePage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <SupportTicketCenter
          defaultRequesterType="user"
          requesterOptions={["user", "business"]}
          heading="Assistance requests"
          description="Raise buyer or business account issues and track AnyJob support replies from one place."
        />
      </div>
    </DashboardLayout>
  );
}
