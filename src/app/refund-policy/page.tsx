import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPolicyPage } from "@/components/policies/PublicPolicyPage";
import { getCmsPolicyDocument } from "@/lib/cms/policy-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Refund Policy — AnyJob",
  description: "AnyJob refund policy for booking tokens, cancellations, provider rejections, and disputes.",
};

export default async function RefundPolicyPage() {
  const document = await getCmsPolicyDocument("refund-policy");
  if (!document) notFound();

  return <PublicPolicyPage document={document} />;
}
