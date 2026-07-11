"use client";

import { HelpCircle, Mail, ShieldCheck } from "lucide-react";
import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportTicketCenter } from "@/components/support/SupportTicketCenter";

const items = [
  {
    icon: HelpCircle,
    title: "Getting started",
    text: "Complete your profile, add services, and keep your availability current.",
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    text: "Upload clear documents from your profile verification tab before applying to jobs.",
  },
  {
    icon: Mail,
    title: "Support",
    text: "Contact the AnyJob team from messages or email support for account help.",
  },
];

export default function ProHelpPage() {
  return (
    <ProviderLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Help & support</h1>
          <p className="text-gray-600 mt-2">Provider guidance and account support.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="w-6 h-6 text-red-600 mb-2" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <SupportTicketCenter
            defaultRequesterType="provider"
            requesterOptions={["provider", "contractor"]}
            heading="Raise a support ticket"
            description="Use this for provider, contractor, KYC, job application, payment, and technical issues. Delayed unresolved tickets move upward in the admin support queue."
            compact
          />
        </div>
      </div>
    </ProviderLayout>
  );
}
