import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPolicyPage } from "@/components/policies/PublicPolicyPage";
import { getCmsPolicyDocument } from "@/lib/cms/policy-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Use — AnyJob",
  description: "AnyJob terms of use for buyers, providers, shift workers, agencies, contractors, and businesses.",
};

export default async function TermsOfUsePage() {
  const document = await getCmsPolicyDocument("terms-of-use");
  if (!document) notFound();

  return <PublicPolicyPage document={document} />;
}
