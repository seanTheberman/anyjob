import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPolicyPage } from "@/components/policies/PublicPolicyPage";
import { getCmsPolicyDocument } from "@/lib/cms/policy-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy — AnyJob",
  description: "AnyJob privacy policy for account, marketplace, KYC, provider, business, and payment-related data.",
};

export default async function PrivacyPolicyPage() {
  const document = await getCmsPolicyDocument("privacy-policy");
  if (!document) notFound();

  return <PublicPolicyPage document={document} />;
}
