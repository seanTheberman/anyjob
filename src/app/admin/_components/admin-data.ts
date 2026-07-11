import {
  Activity,
  Award,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  Newspaper,
  CreditCard,
  FileText,
  Headphones,
  History,
  LayoutDashboard,
  ScanFace,
  Settings,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

export const adminNavItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Providers", href: "/admin/providers", icon: ShieldCheck },
  { label: "Badges", href: "/admin/badges", icon: Award },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Businesses", href: "/admin/businesses", icon: Building2 },
  { label: "Blog", href: "/admin/blog", icon: Newspaper },
  { label: "KYC Review", href: "/admin/kyc", icon: ScanFace },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Jobs", href: "/admin/jobs", icon: BriefcaseBusiness },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Support", href: "/admin/support", icon: Headphones },
  { label: "History", href: "/admin/history", icon: History },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export type AdminUser = {
  id: string;
  name: string;
  role: string;
  email: string;
  city: string;
  bookings: number;
  spend: string;
  status: string;
  risk: string;
  lastSeen: string;
};

export type AdminProvider = {
  id: string;
  name: string;
  service: string;
  city: string;
  verification: string;
  kycStatus: string;
  documents: string;
  docsSubmitted: boolean;
  documentStatus: string;
  rating: string;
  jobs: number;
  accountStatus: string;
};

export type AdminBusiness = {
  id: string;
  name: string;
  kind: "hiring" | "contractor";
  kindLabel: string;
  source: "business_profile" | "provider_account";
  registrationNumber: string;
  industry: string;
  city: string;
  contact: string;
  document: string;
  docsSubmitted: boolean;
  status: string;
  workTypes: string;
  created: string;
};

export type KycReview = {
  id: string;
  providerId: string;
  provider: string;
  issue: string;
  document: string;
  submittedDocuments: string[];
  missingDocuments: string[];
  docsSubmitted: boolean;
  priority: string;
  status: string;
  submitted: string;
  accountImpact: string;
};

export type AdminLiveJob = {
  id: string;
  source: "service_inquiry" | "business_work_post";
  userId: string;
  shortId: string;
  datePosted: string;
  postedLabel: string;
  idleDays: number;
  status: string;
  sourceLabel: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  town: string;
  county: string;
  type: string;
  description: string;
  schedule: string;
  budget: string;
  requirements: string;
  size: string;
  beds: string;
  purpose: string;
  quotes: number;
  quoteDetails: Array<{
    id: string;
    providerId: string;
    providerName: string;
    providerEmail: string;
    providerPhone: string;
    status: string;
    sellerQuote: string;
    anyJobFee: string;
    buyerTotal: string;
    message: string;
    estimatedDuration: string;
    availableDate: string;
    createdLabel: string;
    updatedLabel: string;
  }>;
  chatMessages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string;
    createdLabel: string;
    isRead: boolean;
  }>;
  lastActivity: string;
  lastActivityAt: string | null;
  tabStatus: "pending_review" | "live" | "expired" | "awaiting_buyer" | "no_quotes" | "completed" | "cancelled" | "all";
};

export type AdminSettingField = {
  key: string;
  label: string;
  defaultValue: string;
  type?: "text" | "textarea" | "toggle";
  help?: string;
  placeholder?: string;
  rows?: number;
};

export type AdminSettingGroup = {
  title: string;
  description: string;
  items: AdminSettingField[];
};

export const settingsGroups: AdminSettingGroup[] = [
  {
    title: "Marketplace rules",
    description: "Core marketplace limits and matching behavior.",
    items: [
      {
        key: "marketplace_rules_booking_token_amount",
        label: "Booking token policy",
        defaultValue:
          "Buyers pay the configured booking token before provider contact details or confirmed booking actions are released. The token is applied toward the first accepted quote or held according to the dispute policy when a booking is cancelled.",
        type: "textarea",
        rows: 5,
      },
      {
        key: "marketplace_rules_provider_response_sla",
        label: "Provider response SLA policy",
        defaultValue:
          "Providers should respond to new quote invitations and buyer messages within 24 hours. Jobs with no provider response may be re-matched, escalated to support, or deprioritized in marketplace ranking.",
        type: "textarea",
        rows: 5,
      },
      {
        key: "marketplace_rules_auto_match_radius",
        label: "Auto-match radius policy",
        defaultValue:
          "AnyJob may match providers within the buyer's selected service area first, then expand by category availability, urgency, provider verification status, and distance when there are not enough qualified providers nearby.",
        type: "textarea",
        rows: 5,
      },
      {
        key: "marketplace_rules_dispute_escalation_window",
        label: "Dispute escalation policy",
        defaultValue:
          "A buyer or provider can raise a dispute after a booking issue is reported. Support reviews job messages, payment status, uploaded proof, and cancellation reason before releasing funds or taking account action.",
        type: "textarea",
        rows: 5,
      },
    ],
  },
  {
    title: "Trust and safety",
    description: "Controls for verification, safety checks, and account integrity.",
    items: [
      {
        key: "trust_and_safety_kyc_required_before_quoting",
        label: "Provider KYC before quoting policy",
        defaultValue:
          "Providers must complete identity/KYC checks and accept service terms before submitting quotes or shift applications. Admin can suspend quote access when verification is missing, expired, rejected, or under review.",
        type: "textarea",
        rows: 5,
      },
      {
        key: "trust_and_safety_buyer_kyc_required_before_quote_acceptance",
        label: "Buyer KYC before quote acceptance policy",
        defaultValue:
          "Buyers can post jobs before completing KYC, but they must complete required verification before accepting a quote, releasing provider contact details, or moving a job into paid acceptance.",
        type: "textarea",
        rows: 5,
      },
      {
        key: "trust_and_safety_insurance_document_expiry",
        label: "Insurance document expiry policy",
        defaultValue:
          "Providers are responsible for keeping insurance documents current where applicable. AnyJob may warn, restrict, or block providers whose insurance proof is expired, missing, unverifiable, or not suitable for the selected service type.",
        type: "textarea",
        rows: 5,
      },
      {
        key: "trust_and_safety_duplicate_account_detection",
        label: "Duplicate account detection policy",
        defaultValue:
          "AnyJob may flag duplicate accounts using matching contact details, device or usage patterns, payment signals, documents, or suspicious behavior. Admin review is required before permanent restriction unless fraud risk is immediate.",
        type: "textarea",
        rows: 5,
      },
    ],
  },
  {
    title: "Notifications",
    description: "Reminder and alert behavior across buyers, providers, and admins.",
    items: [
      {
        key: "notifications_client_booking_reminders",
        label: "Client booking reminder policy",
        defaultValue:
          "Buyers receive reminders for pending KYC, open quote decisions, booking token payment, upcoming bookings, provider messages, and jobs still waiting for acceptance.",
        type: "textarea",
        rows: 4,
      },
      {
        key: "notifications_provider_job_alerts",
        label: "Provider job alert policy",
        defaultValue:
          "Providers receive job alerts based on category, location, availability, verification status, and shift/freelance eligibility. Repeated reminders stop once the job is accepted, in progress, completed, cancelled, or expired.",
        type: "textarea",
        rows: 4,
      },
      {
        key: "notifications_admin_risk_digest",
        label: "Admin risk digest policy",
        defaultValue:
          "Admins receive risk digests for overdue KYC, flagged businesses, stale live jobs, disputed payments, suspicious duplicate accounts, and provider compliance issues.",
        type: "textarea",
        rows: 4,
      },
      {
        key: "notifications_support_sla_breach_alerts",
        label: "Support SLA breach alert policy",
        defaultValue:
          "Support receives escalation alerts when a ticket, dispute, KYC review, business approval, or urgent marketplace request remains unresolved beyond the configured SLA window.",
        type: "textarea",
        rows: 4,
      },
    ],
  },
];

export const controlSummary = [
  { label: "Live database reads", value: "Enabled server-side with Supabase service role", icon: Activity },
  { label: "Visible admin routes", value: "15 route-backed pages", icon: LayoutDashboard },
  { label: "Write controls", value: "Audited APIs enabled for moderation, exports, settings, reports, and jobs", icon: Settings },
  { label: "Auth protection", value: "Dedicated admin login with server role checks", icon: ShieldCheck },
];
