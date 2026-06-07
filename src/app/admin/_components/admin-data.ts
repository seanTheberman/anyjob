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
  registrationNumber: string;
  industry: string;
  city: string;
  contact: string;
  document: string;
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
  docsSubmitted: boolean;
  priority: string;
  status: string;
  submitted: string;
  accountImpact: string;
};

export type AdminLiveJob = {
  id: string;
  userId: string;
  shortId: string;
  datePosted: string;
  postedLabel: string;
  idleDays: number;
  status: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  town: string;
  county: string;
  type: string;
  size: string;
  beds: string;
  purpose: string;
  quotes: number;
  lastActivity: string;
  lastActivityAt: string | null;
  tabStatus: "live" | "expired" | "awaiting_buyer" | "no_quotes" | "completed" | "cancelled" | "all";
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
  { label: "Visible admin routes", value: "15 route-backed pages", icon: LayoutDashboard },
  { label: "Write controls", value: "Audited APIs enabled for moderation, exports, settings, reports, and jobs", icon: Settings },
  { label: "Auth protection", value: "Dedicated admin login with server role checks", icon: ShieldCheck },
];
