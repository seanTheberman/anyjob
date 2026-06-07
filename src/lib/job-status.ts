import { CheckCircle, Clock3, XCircle } from "lucide-react";

export type ServiceInquiryStatus =
  | "submitted"
  | "pending_for_review"
  | "approved"
  | "rejected"
  | "more_info_needed"
  | "pending"
  | "confirmed"
  | "bid_accepted"
  | "in_progress"
  | "completed"
  | "converted"
  | "filled"
  | "cancelled"
  | "expired"
  | string;

export const jobStatusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  pending_for_review: "bg-yellow-100 text-yellow-800",
  draft: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  more_info_needed: "bg-amber-100 text-amber-800",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  bid_accepted: "bg-purple-100 text-purple-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  converted: "bg-gray-100 text-gray-800",
  filled: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-slate-100 text-slate-700",
  needs_more_info: "bg-amber-100 text-amber-800",
};

export const jobStatusLabels: Record<string, string> = {
  submitted: "Approved",
  pending_for_review: "Pending for Review",
  draft: "Pending for Review",
  approved: "Approved",
  rejected: "Rejected",
  more_info_needed: "More Info Needed",
  pending: "Pending for Review",
  confirmed: "Confirmed",
  bid_accepted: "Bid Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  converted: "Completed",
  filled: "Filled",
  cancelled: "Cancelled",
  expired: "Expired",
  needs_more_info: "Needs More Info",
};

export const jobStatusIcons = {
  submitted: CheckCircle,
  pending_for_review: Clock3,
  draft: Clock3,
  approved: CheckCircle,
  rejected: XCircle,
  more_info_needed: Clock3,
  pending: Clock3,
  confirmed: CheckCircle,
  bid_accepted: CheckCircle,
  in_progress: Clock3,
  completed: CheckCircle,
  converted: CheckCircle,
  filled: CheckCircle,
  cancelled: XCircle,
  expired: XCircle,
  needs_more_info: Clock3,
};

export function getJobStatusLabel(status?: string | null) {
  const key = String(status || "submitted").toLowerCase();
  return jobStatusLabels[key] || key.replaceAll("_", " ");
}

export function getJobStatusColor(status?: string | null) {
  const key = String(status || "submitted").toLowerCase();
  return jobStatusColors[key] || "bg-gray-100 text-gray-800";
}

export function isOpenForQuotesStatus(status?: string | null) {
  return ["approved", "submitted", "open", "live"].includes(String(status || "").toLowerCase());
}
