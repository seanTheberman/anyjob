export const SUPPORT_REQUESTER_TYPES = ["user", "business", "provider", "contractor"] as const;
export const SUPPORT_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export const SUPPORT_STATUSES = ["open", "in_progress", "waiting_user", "resolved", "closed"] as const;

export const SUPPORT_CATEGORIES = [
  "account",
  "booking",
  "payment",
  "kyc",
  "business",
  "provider",
  "technical",
  "safety",
  "other",
] as const;

export type SupportRequesterType = (typeof SUPPORT_REQUESTER_TYPES)[number];
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export type SupportTicketMessage = {
  id: string;
  ticketId: string;
  senderRole: "user" | "admin" | "system";
  body: string;
  internalNote: boolean;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  ticketNumber: number;
  userId: string;
  requesterEmail: string;
  requesterName: string;
  requesterType: SupportRequesterType;
  title: string;
  description: string;
  category: SupportCategory | string;
  priority: SupportPriority;
  status: SupportStatus;
  sourcePath: string;
  relatedJobId: string;
  assignedAdminId: string;
  lastUserResponseAt: string;
  lastAdminResponseAt: string;
  resolvedAt: string;
  createdAt: string;
  updatedAt: string;
  priorityScore: number;
  ageLabel: string;
  waitingLabel: string;
  messages: SupportTicketMessage[];
};

export function supportLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatTicketNumber(ticketNumber: number | string | null | undefined) {
  const value = Number(ticketNumber || 0);
  if (!Number.isFinite(value) || value <= 0) return "TICKET";
  return `AJ-${String(value).padStart(5, "0")}`;
}

export function sanitizeSupportOption<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

export function supportAgeLabel(value?: string | null) {
  if (!value) return "Unknown";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "Just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function supportPriorityScore(input: {
  priority?: string | null;
  status?: string | null;
  createdAt?: string | null;
  lastAdminResponseAt?: string | null;
  lastUserResponseAt?: string | null;
}) {
  const priorityWeight: Record<string, number> = {
    urgent: 120,
    high: 85,
    normal: 50,
    low: 25,
  };
  const statusWeight: Record<string, number> = {
    open: 45,
    in_progress: 30,
    waiting_user: 8,
    resolved: -80,
    closed: -100,
  };
  const status = input.status || "open";
  const createdAt = input.createdAt ? new Date(input.createdAt).getTime() : Date.now();
  const lastHandledAt = input.lastAdminResponseAt ? new Date(input.lastAdminResponseAt).getTime() : createdAt;
  const lastUserAt = input.lastUserResponseAt ? new Date(input.lastUserResponseAt).getTime() : createdAt;
  const waitingSince = Math.max(lastUserAt, lastHandledAt);
  const ageHours = Math.max((Date.now() - createdAt) / 3600000, 0);
  const waitingHours = Math.max((Date.now() - waitingSince) / 3600000, 0);
  const ageEscalation = Math.floor(ageHours / 24) * 10;
  const waitingEscalation = ["open", "in_progress"].includes(status) ? Math.floor(waitingHours / 24) * 18 : 0;

  return (priorityWeight[input.priority || "normal"] || priorityWeight.normal) +
    (statusWeight[status] ?? 0) +
    ageEscalation +
    waitingEscalation;
}

export function mapSupportTicketRow(row: Record<string, unknown>): SupportTicket {
  const rawMessages = Array.isArray(row.support_ticket_messages) ? row.support_ticket_messages : [];
  const createdAt = String(row.created_at || "");
  const lastUserResponseAt = String(row.last_user_response_at || row.created_at || "");
  const lastAdminResponseAt = String(row.last_admin_response_at || "");
  const status = sanitizeSupportOption(row.status, SUPPORT_STATUSES, "open");
  const priority = sanitizeSupportOption(row.priority, SUPPORT_PRIORITIES, "normal");

  return {
    id: String(row.id || ""),
    ticketNumber: Number(row.ticket_number || 0),
    userId: String(row.user_id || ""),
    requesterEmail: String(row.requester_email || ""),
    requesterName: String(row.requester_name || "User"),
    requesterType: sanitizeSupportOption(row.requester_type, SUPPORT_REQUESTER_TYPES, "user"),
    title: String(row.title || "Support ticket"),
    description: String(row.description || ""),
    category: String(row.category || "other"),
    priority,
    status,
    sourcePath: String(row.source_path || ""),
    relatedJobId: String(row.related_job_id || ""),
    assignedAdminId: String(row.assigned_admin_id || ""),
    lastUserResponseAt,
    lastAdminResponseAt,
    resolvedAt: String(row.resolved_at || ""),
    createdAt,
    updatedAt: String(row.updated_at || createdAt),
    priorityScore: supportPriorityScore({
      priority,
      status,
      createdAt,
      lastAdminResponseAt,
      lastUserResponseAt,
    }),
    ageLabel: supportAgeLabel(createdAt),
    waitingLabel: supportAgeLabel(lastAdminResponseAt || lastUserResponseAt || createdAt),
    messages: rawMessages.map((message) => ({
      id: String((message as Record<string, unknown>).id || ""),
      ticketId: String((message as Record<string, unknown>).ticket_id || row.id || ""),
      senderRole: sanitizeSupportOption((message as Record<string, unknown>).sender_role, ["user", "admin", "system"] as const, "user"),
      body: String((message as Record<string, unknown>).body || ""),
      internalNote: Boolean((message as Record<string, unknown>).internal_note),
      createdAt: String((message as Record<string, unknown>).created_at || ""),
    })).sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()),
  };
}
