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

export const metrics = [
  { label: "Gross booking value", value: "£48,920", delta: "+18.4%", tone: "text-emerald-700", detail: "Across 1,428 service requests" },
  { label: "Active users", value: "12,486", delta: "+7.2%", tone: "text-emerald-700", detail: "Clients with activity in 30 days" },
  { label: "Verified providers", value: "642", delta: "+31", tone: "text-emerald-700", detail: "86 pending verification checks" },
  { label: "Open disputes", value: "14", delta: "-5", tone: "text-amber-700", detail: "3 require same-day escalation" },
];

export const riskQueue = [
  ["High", "Refund request", "Deep cleaning booking #AJ-4921", "Needs evidence review"],
  ["High", "KYC mismatch", "Provider Amelia Brown", "Document name differs"],
  ["Medium", "Late arrival", "Moving job #AJ-4888", "Client requested credit"],
  ["Low", "Duplicate account", "marcus.lee@example.com", "Same phone number"],
];

export const users = [
  ["Sarah Johnson", "Client", "sarah@example.com", "12 bookings", "Active", "View profile"],
  ["Marcus Lee", "Client", "marcus@example.com", "3 bookings", "Watchlisted", "Review risk"],
  ["Emma Wilson", "Client", "emma@example.com", "1 booking", "Pending email", "Resend invite"],
  ["Ravi Patel", "Client", "ravi@example.com", "29 bookings", "VIP", "Open history"],
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

export const adminUsers: AdminUser[] = [
  { id: "usr_1001", name: "Sarah Johnson", role: "Client", email: "sarah@example.com", city: "Edinburgh", bookings: 12, spend: "£842", status: "Active", risk: "Low", lastSeen: "12 min ago" },
  { id: "usr_1002", name: "Marcus Lee", role: "Client", email: "marcus@example.com", city: "Manchester", bookings: 3, spend: "£128", status: "Watchlisted", risk: "High", lastSeen: "1h ago" },
  { id: "usr_1003", name: "Emma Wilson", role: "Client", email: "emma@example.com", city: "London", bookings: 1, spend: "£29", status: "Pending email", risk: "Medium", lastSeen: "2d ago" },
  { id: "usr_1004", name: "Ravi Patel", role: "Client", email: "ravi@example.com", city: "Birmingham", bookings: 29, spend: "£2,410", status: "VIP", risk: "Low", lastSeen: "5 min ago" },
  { id: "usr_1005", name: "Lina Ahmed", role: "Client", email: "lina@example.com", city: "Leeds", bookings: 0, spend: "£0", status: "Blocked", risk: "High", lastSeen: "9d ago" },
];

export const providers = [
  ["John Doe", "Handyman", "Verified", "4.8", "124 jobs", "Adjust services"],
  ["Amelia Brown", "Cleaning", "KYC pending", "4.6", "42 jobs", "Review KYC"],
  ["Noah Smith", "Gardening", "Verified", "4.9", "87 jobs", "Suspend"],
  ["Maya Chen", "Tutoring", "Needs insurance", "4.7", "31 jobs", "Request docs"],
];

export type AdminProvider = {
  id: string;
  name: string;
  service: string;
  city: string;
  verification: string;
  kycStatus: string;
  documents: string;
  rating: string;
  jobs: number;
  payoutStatus: string;
};

export const adminProviders: AdminProvider[] = [
  { id: "pro_2001", name: "John Doe", service: "Handyman", city: "Edinburgh", verification: "Verified", kycStatus: "Approved", documents: "ID, insurance", rating: "4.8", jobs: 124, payoutStatus: "Enabled" },
  { id: "pro_2002", name: "Amelia Brown", service: "Cleaning", city: "London", verification: "KYC pending", kycStatus: "Needs review", documents: "ID mismatch", rating: "4.6", jobs: 42, payoutStatus: "Held" },
  { id: "pro_2003", name: "Noah Smith", service: "Gardening", city: "Manchester", verification: "Verified", kycStatus: "Approved", documents: "ID, insurance", rating: "4.9", jobs: 87, payoutStatus: "Enabled" },
  { id: "pro_2004", name: "Maya Chen", service: "Tutoring", city: "Bristol", verification: "Needs insurance", kycStatus: "Missing document", documents: "ID only", rating: "4.7", jobs: 31, payoutStatus: "Limited" },
  { id: "pro_2005", name: "Oliver Grant", service: "Moving", city: "Glasgow", verification: "Rejected", kycStatus: "Rejected", documents: "Expired ID", rating: "4.2", jobs: 9, payoutStatus: "Blocked" },
];

export const kycReviews = [
  ["Amelia Brown", "ID mismatch", "Passport", "High", "Needs review", "Open review"],
  ["Maya Chen", "Insurance missing", "Insurance certificate", "Medium", "Missing document", "Request document"],
  ["Oliver Grant", "Expired ID", "Driving licence", "High", "Rejected", "Appeal"],
  ["John Doe", "Annual re-check", "Insurance renewal", "Low", "Approved", "View file"],
];

export const jobs = [
  ["AJ-4921", "Deep cleaning", "Sarah Johnson", "Amelia Brown", "Dispute", "Open case"],
  ["AJ-4916", "Furniture assembly", "Marcus Lee", "John Doe", "Matched", "View bids"],
  ["AJ-4908", "Garden maintenance", "Ravi Patel", "Noah Smith", "Completed", "Invoice"],
  ["AJ-4899", "Math tutoring", "Emma Wilson", "Maya Chen", "Open", "Boost listing"],
];

export const activity = [
  ["10:42", "Provider KYC approved", "John Doe moved to verified"],
  ["10:18", "Refund opened", "Client requested £25 credit on AJ-4921"],
  ["09:57", "Trust rule triggered", "Duplicate phone number detected"],
  ["09:32", "Payout scheduled", "£1,840 batch queued for providers"],
  ["08:44", "Category setting changed", "Moving category boosted in Edinburgh"],
];

export const analytics = [
  ["Search to request", "18.7%", "+2.1%", "Strong"],
  ["Request to provider match", "64.3%", "-1.4%", "Needs review"],
  ["Match to completed job", "72.8%", "+5.6%", "Strong"],
  ["Provider response SLA", "21 min", "-4 min", "Improving"],
  ["Dispute rate", "1.8%", "-0.3%", "Healthy"],
];

export const reports = [
  ["Daily marketplace health", "CSV, PDF", "Every morning", "Enabled"],
  ["Provider payout summary", "CSV", "Mondays", "Enabled"],
  ["Trust and safety incidents", "PDF", "Weekly", "Draft"],
  ["Category supply gaps", "CSV", "Monthly", "Enabled"],
];

export const payments = [
  ["AJ-4921", "Booking token", "£9.90", "Held", "Resolve dispute"],
  ["AJ-4908", "Provider payout", "£116.00", "Scheduled", "View batch"],
  ["AJ-4892", "Refund", "£9.90", "Processed", "Receipt"],
  ["AJ-4871", "Subscription", "£79.00", "Paid", "Invoice"],
];

export const supportTickets = [
  ["SUP-2218", "Client", "Booking token refund", "Urgent", "Assigned"],
  ["SUP-2212", "Provider", "Document upload failed", "High", "Open"],
  ["SUP-2205", "Client", "Change booking time", "Normal", "Waiting"],
  ["SUP-2199", "Provider", "Payout bank account", "Normal", "Resolved"],
];

export const settingsGroups = [
  {
    title: "Marketplace rules",
    items: ["Booking token amount", "Provider response SLA", "Auto-match radius", "Dispute escalation window"],
  },
  {
    title: "Trust and safety",
    items: ["KYC required before bidding", "Insurance document expiry", "Duplicate account detection", "Manual approval threshold"],
  },
  {
    title: "Notifications",
    items: ["Client booking reminders", "Provider job alerts", "Admin risk digest", "Support SLA breach alerts"],
  },
];

export const controlSummary = [
  { label: "Real database admin APIs", value: "Not built yet", icon: Activity },
  { label: "Visible admin routes", value: "11 route-backed pages", icon: LayoutDashboard },
  { label: "Current controls", value: "UI-ready, not persisted", icon: Settings },
  { label: "Auth protection", value: "Opt-in via ROUTE_GUARDS_ENABLED", icon: ShieldCheck },
];
