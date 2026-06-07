import { CheckCircle, Clock3, XCircle } from "lucide-react";

export type ServiceInquiryStatus =
  | "submitted"
  | "pending"
  | "confirmed"
  | "bid_accepted"
  | "in_progress"
  | "completed"
  | "converted"
  | "cancelled"
  | "expired"
  | string;

export const jobStatusColors: Record<string, string> = {
  submitted: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  bid_accepted: "bg-purple-100 text-purple-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  converted: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-slate-100 text-slate-700",
  needs_more_info: "bg-amber-100 text-amber-800",
};

export const jobStatusLabels: Record<string, string> = {
  submitted: "Live",
  pending: "Pending",
  confirmed: "Confirmed",
  bid_accepted: "Bid Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  converted: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
  needs_more_info: "Needs More Info",
};

export const jobStatusIcons = {
  submitted: CheckCircle,
  pending: Clock3,
  confirmed: CheckCircle,
  bid_accepted: CheckCircle,
  in_progress: Clock3,
  completed: CheckCircle,
  converted: CheckCircle,
  cancelled: XCircle,
  expired: XCircle,
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
  return ["submitted", "pending", "open", "live"].includes(String(status || "").toLowerCase());
}
