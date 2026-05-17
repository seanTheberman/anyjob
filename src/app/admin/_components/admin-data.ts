import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  Headphones,
  History,
  LayoutDashboard,
  ScanFace,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export const adminNavItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Providers", href: "/admin/providers", icon: ShieldCheck },
  { label: "KYC Review", href: "/admin/kyc", icon: ScanFace },
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
  rating: string;
  jobs: number;
  accountStatus: string;
};

export type KycReview = {
  id: string;
  providerId: string;
  provider: string;
  issue: string;
  document: string;
  docsSubmitted: boolean;
  priority: string;
  status: string;
  submitted: string;
  accountImpact: string;
};

export const settingsGroups = [
  {
    title: "Marketplace rules",
    items: ["Booking token amount", "Provider response SLA", "Auto-match radius", "Dispute escalation window"],
  },
  {
    title: "Trust and safety",
    items: ["KYC required before quoting", "Buyer KYC required before quote acceptance", "Insurance document expiry", "Duplicate account detection"],
  },
  {
    title: "Notifications",
    items: ["Client booking reminders", "Provider job alerts", "Admin risk digest", "Support SLA breach alerts"],
  },
];

export const controlSummary = [
  { label: "Live database reads", value: "Enabled server-side with Supabase service role", icon: Activity },
  { label: "Visible admin routes", value: "11 route-backed pages", icon: LayoutDashboard },
  { label: "Write controls", value: "UI-ready; mutations still need audited endpoints", icon: Settings },
  { label: "Auth protection", value: "Opt-in via ROUTE_GUARDS_ENABLED", icon: ShieldCheck },
];
