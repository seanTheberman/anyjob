export type CmsPolicyBlock = {
  key: string;
  title: string;
  body: string;
};

export type CmsPolicyDocument = {
  slug: "privacy-policy" | "terms-of-use" | "refund-policy";
  path: string;
  title: string;
  description: string;
  updatedLabel: string;
  blocks: CmsPolicyBlock[];
};

export const POLICY_DOCUMENTS: CmsPolicyDocument[] = [
  {
    slug: "privacy-policy",
    path: "/privacy-policy",
    title: "Privacy Policy",
    description: "How AnyJob collects, uses, stores, and protects account, marketplace, KYC, and payment-related data.",
    updatedLabel: "Managed from Admin Settings",
    blocks: [
      {
        key: "overview",
        title: "Overview",
        body:
          "AnyJob collects the information needed to operate a trusted services marketplace. This includes account details, job requests, provider profiles, business registration details, KYC information, support messages, notifications, and payment-related records.",
      },
      {
        key: "data_we_collect",
        title: "Data we collect",
        body:
          "We may collect name, email, phone number, addresses, job details, uploaded documents, identity verification files, provider skills, business registration information, profile media, communications, device/session data, and transaction metadata. Payment card details are processed by payment partners and are not stored directly by AnyJob.",
      },
      {
        key: "how_we_use_data",
        title: "How we use data",
        body:
          "We use data to create accounts, verify buyers, providers, and businesses, match jobs, send notifications, process payments, support disputes, prevent fraud, enforce policies, improve marketplace quality, and comply with legal obligations.",
      },
      {
        key: "sharing_and_processors",
        title: "Sharing and processors",
        body:
          "AnyJob may share necessary information with providers, buyers, business accounts, payment processors, email/SMS providers, verification providers, hosting providers, support tools, and authorities where required by law or safety obligations.",
      },
      {
        key: "retention_and_rights",
        title: "Retention and rights",
        body:
          "Records are retained for as long as needed for marketplace operations, disputes, fraud prevention, legal compliance, tax/accounting, and safety checks. Users can contact AnyJob to request access, correction, deletion, or restriction where legally available.",
      },
    ],
  },
  {
    slug: "terms-of-use",
    path: "/terms-of-use",
    title: "Terms of Use",
    description: "Rules for using AnyJob as a buyer, provider, shift worker, agency, contractor, or business account.",
    updatedLabel: "Managed from Admin Settings",
    blocks: [
      {
        key: "platform_role",
        title: "Platform role",
        body:
          "AnyJob operates a marketplace that helps buyers request services, providers offer work, and businesses hire eligible workers. AnyJob may facilitate matching, messaging, payment flows, verification, notifications, and support, but providers and businesses remain responsible for their own work, compliance, insurance, and representations.",
      },
      {
        key: "account_rules",
        title: "Account rules",
        body:
          "Users must provide accurate information, keep login details secure, maintain only permitted accounts, complete required verification, and avoid misuse, fraud, harassment, illegal work, spam, scraping, or attempts to bypass platform payment and safety flows.",
      },
      {
        key: "jobs_quotes_and_orders",
        title: "Jobs, quotes, and orders",
        body:
          "Buyers must describe work honestly. Providers must quote only for work they can perform. A booking, gig order, or shift may require payment, KYC, terms acceptance, and completion of requirement questions before work can start.",
      },
      {
        key: "provider_obligations",
        title: "Provider obligations",
        body:
          "Providers are responsible for service quality, legal eligibility, tools, insurance, safety, taxes, licenses, documents, punctuality, communication, and rejecting work they cannot complete. AnyJob may restrict accounts that fail safety, KYC, insurance, or conduct requirements.",
      },
      {
        key: "changes_and_enforcement",
        title: "Changes and enforcement",
        body:
          "AnyJob may update these terms, policies, fees, and marketplace rules. We may suspend, limit, or remove accounts, jobs, badges, profiles, or payments when required for safety, compliance, fraud prevention, disputes, or policy enforcement.",
      },
    ],
  },
  {
    slug: "refund-policy",
    path: "/refund-policy",
    title: "Refund Policy",
    description: "How AnyJob reviews refunds, booking tokens, cancellations, disputes, and payment releases.",
    updatedLabel: "Managed from Admin Settings",
    blocks: [
      {
        key: "overview",
        title: "Overview",
        body:
          "Refund eligibility depends on booking status, provider acceptance, work progress, cancellation timing, payment state, uploaded evidence, communication history, and the specific service or shift arrangement.",
      },
      {
        key: "booking_tokens",
        title: "Booking tokens and upfront payments",
        body:
          "Booking tokens and upfront payments may be applied toward the accepted quote or held while AnyJob reviews cancellation, no-show, dispute, fraud, or incomplete-work claims. Payment processor fees may affect the final refund amount where applicable.",
      },
      {
        key: "buyer_cancellations",
        title: "Buyer cancellations",
        body:
          "Buyers should cancel as early as possible. Refunds may be reduced or declined when a provider has already accepted, reserved time, travelled, purchased materials, started work, or completed the requested service.",
      },
      {
        key: "provider_rejections",
        title: "Provider rejections or no-shows",
        body:
          "If a provider rejects an order after payment, fails to attend, or cannot complete agreed work, AnyJob may refund the buyer, rematch the job, hold funds, or take account action after reviewing the case.",
      },
      {
        key: "disputes",
        title: "Disputes and review",
        body:
          "AnyJob may ask both sides for messages, images, documents, timestamps, requirement answers, payment records, or other proof. Refund decisions may include full refund, partial refund, provider payment, credit, rematch, or further investigation.",
      },
    ],
  },
];

export function policySettingKey(documentSlug: string, blockKey: string) {
  return `cms_policy_${documentSlug}_${blockKey}`.replace(/[^a-zA-Z0-9_]+/g, "_").toLowerCase();
}

export function getPolicySettingKeys() {
  return POLICY_DOCUMENTS.flatMap((document) => document.blocks.map((block) => policySettingKey(document.slug, block.key)));
}

export function mergePolicySettings(settings: Map<string, string | null | undefined>, document: CmsPolicyDocument): CmsPolicyDocument {
  return {
    ...document,
    blocks: document.blocks.map((block) => {
      const savedValue = settings.get(policySettingKey(document.slug, block.key));
      const body = savedValue && savedValue !== "Default policy" ? savedValue : block.body;
      return { ...block, body };
    }),
  };
}
