import { NextResponse } from "next/server";

import { getAdminJobs, getAdminPayments, getAdminSupport, getKycReviews } from "@/app/admin/_lib/admin-live-data";
import { adminForbidden, getAdminApiUser } from "@/lib/auth/admin-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminDb = { from: (table: string) => any };
type ChatRole = "user" | "assistant";
type ModelRole = "system" | "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };
type ModelMessage = { role: ModelRole; content: string };
type ToolRow = Record<string, unknown>;
type AdminJob = Awaited<ReturnType<typeof getAdminJobs>>[number];
type PendingAction = {
  operation: "update_record" | "insert_record";
  table: string;
  id?: string;
  values: Record<string, unknown>;
  reason?: string;
};

type TableConfig = {
  label: string;
  description: string;
  idColumn: string;
  read: string[];
  write: string[];
  search: string[];
  allowedValues?: Record<string, string[]>;
};

const marketplaceContext = `
Current AnyJob admin context:
- Answer like a practical admin helper. Use simple marketplace wording and avoid technical storage language unless the admin explicitly asks for it.
- Launch geography is Ireland. Treat non-Ireland places in old QA data as test leftovers.
- Buyer jobs are service requests/custom jobs. Valid buyer job statuses are pending, submitted, matched, approved, rejected, more_info_needed, pending_for_review, bid_accepted, converted, and expired.
- Jobs should expire after 7 days if no quote is accepted. Admins can manually expire buyer jobs and business work posts.
- Business accounts have two different roles: hiring businesses post jobs/shifts, while agency/contractor businesses provide services. Keep those separate when filtering or explaining.
- Hiring businesses must be reviewed by admin before posting work. Approved means posting is unlocked; suspended means posting is blocked.
- Providers can be freelance workers, shift workers, or agencies/contractors. Shift workers may see work shifts and day-to-day jobs; freelance-only providers do not see shift posts.
- Providers must accept terms before quoting. Buyers need KYC before they can receive/accept quotes, and KYC reminders are sent by email.
- Admin badges support uploaded badge icons, editable badge rules, manual awards, random awards, buyer trust badges, and provider achievement badges.
- Admin settings manage CMS policies, warning messages, marketplace rules, tenant URLs, email settings, and pricing plans.
- Pricing rules live under pricing_provider_plan_rules and include provider plans, business plans, and buyer plans. The free plan has no discount.
- Test payments are shown as a dummy ledger from paid bookings, accepted bid booking tokens, shift escrow payments, provider plan subscriptions, and buyer plan subscriptions. Empty payments usually means no accepted/paid test flow has produced a ledger item yet.
- Shift/business payments use shift applications and shift escrow payments. Accepted shift applications can create escrow records.
- Support tickets are priority sorted. Older unresolved/high-priority tickets should surface first.
- Tenant email settings drive SMTP and app URLs; password reset links use the configured tenant app URL.
`.trim();

const tableConfigs = {
  eloo_profiles: {
    label: "Profiles",
    description: "Unified public account profiles for buyers, providers, and admins.",
    idColumn: "id",
    read: [
      "id",
      "email",
      "first_name",
      "last_name",
      "phone",
      "bio",
      "city",
      "postal_code",
      "role",
      "is_verified",
      "provider_work_mode",
      "can_work_freelance",
      "can_work_shifts",
      "has_business_profile",
      "business_registration_status",
      "created_at",
      "updated_at",
    ],
    write: [
      "first_name",
      "last_name",
      "phone",
      "bio",
      "city",
      "postal_code",
      "role",
      "is_verified",
      "provider_work_mode",
      "can_work_freelance",
      "can_work_shifts",
      "has_business_profile",
      "business_registration_status",
    ],
    search: ["email", "first_name", "last_name", "city", "role"],
  },
  sellers: {
    label: "Providers",
    description: "Provider onboarding, KYC, service category, rating, and account status. Use status pending for providers still waiting for admin/KYC review.",
    idColumn: "id",
    read: [
      "id",
      "email",
      "first_name",
      "last_name",
      "phone",
      "city",
      "postal_code",
      "service_category",
      "description",
      "hourly_rate",
      "status",
      "provider_work_mode",
      "can_work_freelance",
      "can_work_shifts",
      "insurance_status",
      "background_check_status",
      "rating",
      "total_jobs",
      "rejection_reason",
      "approved_at",
      "created_at",
      "updated_at",
    ],
    write: [
      "first_name",
      "last_name",
      "phone",
      "city",
      "postal_code",
      "service_category",
      "description",
      "hourly_rate",
      "status",
      "provider_work_mode",
      "can_work_freelance",
      "can_work_shifts",
      "insurance_status",
      "background_check_status",
      "rejection_reason",
      "email_verified",
      "phone_verified",
    ],
    search: ["email", "first_name", "last_name", "city", "service_category", "status"],
    allowedValues: {
      status: ["pending", "approved", "rejected", "suspended"],
    },
  },
  buyers: {
    label: "Buyers",
    description: "Buyer accounts, KYC status, contact details, and verification flags.",
    idColumn: "id",
    read: [
      "id",
      "email",
      "first_name",
      "last_name",
      "phone",
      "city",
      "postal_code",
      "email_verified",
      "phone_verified",
      "kyc_status",
      "kyc_submitted_at",
      "kyc_verified_at",
      "created_at",
      "updated_at",
    ],
    write: ["first_name", "last_name", "phone", "city", "postal_code", "email_verified", "phone_verified", "kyc_status", "kyc_review_note"],
    search: ["email", "first_name", "last_name", "city", "kyc_status"],
    allowedValues: {
      kyc_status: ["not_started", "submitted", "approved", "rejected"],
    },
  },
  service_inquiries: {
    label: "Buyer Jobs",
    description: "Buyer-posted service requests, emergency requests, and custom jobs. Admins can approve, reject, request more info, or expire these jobs.",
    idColumn: "id",
    read: [
      "id",
      "user_id",
      "email",
      "phone",
      "first_name",
      "last_name",
      "category_slug",
      "subcategory_slug",
      "service_type",
      "job_description",
      "job_urgency",
      "city",
      "postal_code",
      "coarse_location_label",
      "budget_range_min",
      "budget_range_max",
      "preferred_date",
      "status",
      "submitted_at",
      "created_at",
    ],
    write: [
      "category_slug",
      "subcategory_slug",
      "service_type",
      "job_description",
      "job_urgency",
      "coarse_location_label",
      "budget_range_min",
      "budget_range_max",
      "preferred_date",
      "status",
    ],
    search: ["email", "first_name", "last_name", "category_slug", "subcategory_slug", "service_type", "job_description", "city", "status"],
    allowedValues: {
      status: ["pending", "submitted", "matched", "approved", "rejected", "more_info_needed", "pending_for_review", "bid_accepted", "converted", "expired"],
    },
  },
  bids: {
    label: "Quotes",
    description: "Provider quotes on buyer service requests. Accepted bids are treated as paid booking-token entries in the test payment ledger.",
    idColumn: "id",
    read: ["id", "inquiry_id", "provider_id", "amount", "message", "status", "accepted_at", "created_at", "updated_at"],
    write: ["amount", "message", "status"],
    search: ["message", "status"],
    allowedValues: {
      status: ["pending", "accepted", "rejected", "withdrawn"],
    },
  },
  business_profiles: {
    label: "Businesses",
    description: "Business registrations and approval state. business_type separates hiring businesses from agency/contractor service providers.",
    idColumn: "id",
    read: [
      "id",
      "owner_user_id",
      "business_name",
      "legal_name",
      "registration_number",
      "business_type",
      "industry",
      "contact_name",
      "contact_email",
      "contact_phone",
      "city",
      "status",
      "typical_work_types",
      "typical_roles_needed",
      "document_source",
      "reviewed_at",
      "rejection_reason",
      "created_at",
      "updated_at",
    ],
    write: ["business_name", "legal_name", "business_type", "industry", "status", "typical_work_types", "typical_roles_needed", "reviewed_at", "rejection_reason"],
    search: ["business_name", "legal_name", "registration_number", "industry", "contact_email", "city", "status"],
    allowedValues: {
      status: ["pending", "approved", "rejected", "suspended"],
    },
  },
  business_work_posts: {
    label: "Business Work Posts",
    description: "Business shift, day-wage, and freelance work posts. These are available only after the business profile is approved.",
    idColumn: "id",
    read: [
      "id",
      "business_id",
      "owner_user_id",
      "work_type",
      "industry",
      "niche",
      "role_title",
      "description",
      "city",
      "postal_code",
      "starts_at",
      "ends_at",
      "headcount",
      "business_preferred_hourly_rate",
      "business_preferred_day_rate",
      "status",
      "created_at",
      "updated_at",
    ],
    write: [
      "work_type",
      "industry",
      "niche",
      "role_title",
      "description",
      "starts_at",
      "ends_at",
      "headcount",
      "business_preferred_hourly_rate",
      "business_preferred_day_rate",
      "status",
    ],
    search: ["industry", "niche", "role_title", "description", "city", "status", "work_type"],
    allowedValues: {
      status: ["submitted", "approved", "rejected", "more_info_needed", "pending_for_review", "filled", "cancelled", "completed", "expired"],
      work_type: ["freelance_service", "part_time_day_wage", "long_duration_shift"],
    },
  },
  shift_applications: {
    label: "Shift Applications",
    description: "Provider applications to business work posts. Accepted applications can create shift escrow payment records.",
    idColumn: "id",
    read: [
      "id",
      "business_work_post_id",
      "business_id",
      "owner_user_id",
      "provider_user_id",
      "status",
      "proposed_hourly_rate",
      "proposed_day_rate",
      "message",
      "applied_at",
      "accepted_at",
      "completed_at",
      "created_at",
      "updated_at",
    ],
    write: ["status", "proposed_hourly_rate", "proposed_day_rate", "message", "accepted_at", "completed_at"],
    search: ["status", "message"],
    allowedValues: {
      status: ["applied", "accepted", "rejected", "withdrawn", "completed", "cancelled"],
    },
  },
  shift_escrow_payments: {
    label: "Shift Escrow Payments",
    description: "Business shift payment records for accepted shift applications. In test mode these are payment ledger entries for shift work.",
    idColumn: "id",
    read: [
      "id",
      "business_work_post_id",
      "shift_application_id",
      "business_id",
      "owner_user_id",
      "provider_user_id",
      "agreed_amount",
      "platform_fee",
      "total_charged",
      "currency",
      "status",
      "payment_reference",
      "paid_at",
      "released_at",
      "created_at",
      "updated_at",
    ],
    write: ["status", "payment_reference", "paid_at", "released_at"],
    search: ["status", "payment_reference", "currency"],
    allowedValues: {
      status: ["requires_payment", "held", "released", "refunded", "cancelled"],
    },
  },
  provider_wallet_entries: {
    label: "Provider Wallet Entries",
    description: "Provider wallet ledger entries created from completed shift or marketplace payment flows.",
    idColumn: "id",
    read: ["id", "provider_user_id", "source_type", "source_id", "amount", "currency", "status", "description", "available_at", "paid_out_at", "created_at", "updated_at"],
    write: ["status", "description", "available_at", "paid_out_at"],
    search: ["source_type", "status", "description"],
    allowedValues: {
      status: ["pending", "available", "paid_out", "cancelled"],
    },
  },
  shift_worker_profiles: {
    label: "Shift Workers",
    description: "Shift-worker pool profiles, skills, rates, availability, and status.",
    idColumn: "id",
    read: [
      "id",
      "user_id",
      "work_mode",
      "niches",
      "preferred_roles",
      "skills",
      "certifications",
      "travel_radius_km",
      "preferred_hourly_rate",
      "preferred_day_rate",
      "open_to_freelance_jobs",
      "open_to_urgent_shifts",
      "open_to_recurring_shifts",
      "reliability_score",
      "status",
      "created_at",
      "updated_at",
    ],
    write: [
      "work_mode",
      "niches",
      "preferred_roles",
      "skills",
      "certifications",
      "travel_radius_km",
      "preferred_hourly_rate",
      "preferred_day_rate",
      "open_to_freelance_jobs",
      "open_to_urgent_shifts",
      "open_to_recurring_shifts",
      "reliability_score",
      "status",
    ],
    search: ["work_mode", "status"],
  },
  eloo_provider_services: {
    label: "Provider Gigs",
    description: "Provider service gigs, package details, media metadata, and marketplace visibility.",
    idColumn: "id",
    read: ["id", "provider_id", "title", "description", "hourly_rate", "tags", "is_active", "min_hours", "max_radius_km", "gig_details", "created_at"],
    write: ["title", "description", "hourly_rate", "tags", "is_active", "min_hours", "max_radius_km", "gig_details"],
    search: ["title", "description"],
  },
  eloo_bookings: {
    label: "Bookings",
    description: "Confirmed service bookings and payment state.",
    idColumn: "id",
    read: [
      "id",
      "client_id",
      "provider_id",
      "service_id",
      "city",
      "scheduled_date",
      "scheduled_time_start",
      "scheduled_time_end",
      "estimated_hours",
      "total_price",
      "status",
      "is_paid",
      "created_at",
      "updated_at",
    ],
    write: ["scheduled_date", "scheduled_time_start", "scheduled_time_end", "estimated_hours", "total_price", "status", "is_paid"],
    search: ["city", "status"],
  },
  eloo_reviews: {
    label: "Reviews",
    description: "Marketplace review records.",
    idColumn: "id",
    read: ["id", "booking_id", "reviewer_id", "reviewee_id", "rating", "comment", "is_public", "created_at"],
    write: ["rating", "comment", "is_public"],
    search: ["comment"],
  },
  badge_definitions: {
    label: "Badges",
    description: "Badge definitions visible in admin and marketplace trust surfaces.",
    idColumn: "id",
    read: ["id", "slug", "name", "description", "icon", "audience", "award_type", "is_active", "is_public", "sort_order", "created_at", "updated_at"],
    write: ["slug", "name", "description", "icon", "audience", "award_type", "is_active", "is_public", "sort_order"],
    search: ["slug", "name", "description", "audience", "award_type"],
  },
  badge_rules: {
    label: "Badge Rules",
    description: "Rule thresholds for automatic badge awards.",
    idColumn: "id",
    read: ["id", "badge_id", "metric", "operator", "threshold", "created_at"],
    write: ["badge_id", "metric", "operator", "threshold"],
    search: ["metric", "operator"],
  },
  user_badges: {
    label: "User Badges",
    description: "Badges awarded to buyers and providers.",
    idColumn: "id",
    read: ["id", "user_id", "badge_id", "target_role", "award_type", "awarded_at", "awarded_reason", "source", "expires_at"],
    write: ["user_id", "badge_id", "target_role", "award_type", "awarded_reason", "source", "expires_at"],
    search: ["target_role", "award_type", "awarded_reason", "source"],
  },
  provider_plan_subscriptions: {
    label: "Provider Plans",
    description: "Provider subscription state for free and paid provider application plans.",
    idColumn: "user_id",
    read: ["user_id", "plan_id", "status", "current_period_start", "current_period_end", "started_at", "updated_at"],
    write: ["plan_id", "status", "current_period_start", "current_period_end", "updated_at"],
    search: ["plan_id", "status"],
    allowedValues: {
      status: ["active", "trialing", "past_due", "cancelled", "expired", "paused"],
    },
  },
  buyer_plan_subscriptions: {
    label: "Buyer Plans",
    description: "Buyer subscription state for free and paid buyer/client plans.",
    idColumn: "user_id",
    read: ["user_id", "plan_id", "status", "current_period_start", "current_period_end", "started_at", "updated_at"],
    write: ["plan_id", "status", "current_period_start", "current_period_end", "updated_at"],
    search: ["plan_id", "status"],
    allowedValues: {
      status: ["active", "trialing", "past_due", "cancelled", "expired", "paused"],
    },
  },
  admin_settings: {
    label: "Admin Settings",
    description: "CMS-managed settings, policy blocks, warning messages, marketplace rules, tenant URL rules, and pricing plan JSON including provider, business, and buyer plans.",
    idColumn: "key",
    read: ["key", "value", "group_title", "updated_at"],
    write: ["key", "value", "group_title"],
    search: ["key", "value", "group_title"],
  },
  tenants: {
    label: "Tenants",
    description: "Tenant app URL, domains, and active flags.",
    idColumn: "id",
    read: ["id", "slug", "name", "primary_domain", "app_url", "is_active", "created_at", "updated_at"],
    write: ["slug", "name", "primary_domain", "app_url", "is_active"],
    search: ["slug", "name", "primary_domain", "app_url"],
  },
  tenant_email_configs: {
    label: "Tenant Email Settings",
    description: "Tenant SMTP routing settings. SMTP passwords are intentionally not exposed in chat.",
    idColumn: "id",
    read: [
      "id",
      "tenant_id",
      "from_email",
      "from_name",
      "reply_to_email",
      "smtp_host",
      "smtp_port",
      "smtp_secure",
      "smtp_username",
      "is_active",
      "created_at",
      "updated_at",
    ],
    write: ["from_email", "from_name", "reply_to_email", "smtp_host", "smtp_port", "smtp_secure", "smtp_username", "is_active"],
    search: ["from_email", "from_name", "reply_to_email", "smtp_host", "smtp_username"],
  },
  email_outbox: {
    label: "Email Outbox",
    description: "Email notification queue and delivery status. Bodies are not exposed in chat.",
    idColumn: "id",
    read: ["id", "tenant_id", "event_key", "recipient_user_id", "recipient_email", "subject", "status", "attempts", "last_error", "send_after", "sent_at", "source_table", "source_id", "created_at", "updated_at"],
    write: ["status", "send_after", "last_error"],
    search: ["event_key", "recipient_email", "subject", "status", "last_error", "source_table"],
  },
  support_tickets: {
    label: "Support Tickets",
    description: "User, buyer, provider, contractor, and business support tickets. Admin should prioritize unresolved older and urgent tickets.",
    idColumn: "id",
    read: [
      "id",
      "ticket_number",
      "user_id",
      "requester_email",
      "requester_name",
      "requester_type",
      "title",
      "description",
      "category",
      "priority",
      "status",
      "source_path",
      "related_job_id",
      "assigned_admin_id",
      "last_user_response_at",
      "last_admin_response_at",
      "resolved_at",
      "created_at",
      "updated_at",
    ],
    write: ["priority", "status", "assigned_admin_id", "last_admin_response_at", "resolved_at"],
    search: ["requester_email", "requester_name", "requester_type", "title", "description", "category", "priority", "status", "related_job_id"],
    allowedValues: {
      requester_type: ["user", "business", "provider", "contractor"],
      priority: ["low", "normal", "high", "urgent"],
      status: ["open", "in_progress", "waiting_user", "resolved", "closed"],
    },
  },
  support_ticket_messages: {
    label: "Support Ticket Messages",
    description: "Messages on support tickets, including admin replies and internal notes.",
    idColumn: "id",
    read: ["id", "ticket_id", "sender_user_id", "sender_role", "body", "internal_note", "created_at"],
    write: ["ticket_id", "sender_user_id", "sender_role", "body", "internal_note"],
    search: ["sender_role", "body"],
    allowedValues: {
      sender_role: ["user", "admin", "system"],
    },
  },
} satisfies Record<string, TableConfig>;

type TableName = keyof typeof tableConfigs;

const sensitiveKeyPattern = /(password|secret|token|api[_-]?key|service[_-]?role|stripe_payment_intent|smtp_password|hash)/i;

function getTableConfig(table: unknown): [TableName, TableConfig] {
  if (typeof table !== "string" || !(table in tableConfigs)) {
    throw new Error("That table is not available to the admin assistant.");
  }
  const tableName = table as TableName;
  return [tableName, tableConfigs[tableName]];
}

function clampLimit(limit: unknown) {
  const numeric = Number(limit || 10);
  if (!Number.isFinite(numeric)) return 10;
  return Math.max(1, Math.min(Math.floor(numeric), 25));
}

function cleanMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message): message is ChatMessage => {
      if (!message || typeof message !== "object") return false;
      const maybe = message as { role?: unknown; content?: unknown };
      return (maybe.role === "user" || maybe.role === "assistant") && typeof maybe.content === "string";
    })
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 4000),
    }));
}

function allowedColumns(requested: unknown, fallback: string[], allowed: string[]) {
  const fallbackColumns = fallback.filter((column) => allowed.includes(column));
  if (!Array.isArray(requested)) return fallbackColumns;
  const columns = requested.filter((column): column is string => typeof column === "string" && allowed.includes(column));
  return columns.length ? columns.slice(0, 12) : fallbackColumns;
}

function normalizeFilterValue(table: TableName, column: string, value: unknown) {
  if (typeof value !== "string") return value;

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, Record<string, string>> = {
    "sellers.status": {
      active: "approved",
      approved_provider: "approved",
      blocked: "suspended",
      banned: "suspended",
      kyc_pending: "pending",
      needs_kyc: "pending",
      needs_review: "pending",
      pending_kyc: "pending",
      pending_review: "pending",
      submitted: "pending",
      under_review: "pending",
      verified: "approved",
    },
    "business_profiles.status": {
      active: "approved",
      blocked: "suspended",
      banned: "suspended",
      needs_review: "pending",
      pending_review: "pending",
      verified: "approved",
    },
    "service_inquiries.status": {
      active: "submitted",
      accepted: "bid_accepted",
      live: "submitted",
      open: "submitted",
      paid: "bid_accepted",
      pending_review: "pending_for_review",
      review: "pending_for_review",
      closed: "converted",
    },
    "business_work_posts.status": {
      active: "submitted",
      live: "submitted",
      open: "submitted",
      pending: "pending_for_review",
      review: "pending_for_review",
    },
  };

  const key = `${table}.${column}`;
  const alias = aliases[key]?.[normalized];
  if (alias) return alias;

  const allowedValues = (tableConfigs[table] as TableConfig).allowedValues?.[column];
  if (allowedValues?.includes(normalized)) return normalized;

  return value;
}

function sanitizeFilters(table: TableName, filters: unknown, allowed: string[]) {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) return {};
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters as Record<string, unknown>)) {
    if (!allowed.includes(key)) continue;
    if (value == null) {
      cleaned[key] = value;
      continue;
    }
    if (!["string", "number", "boolean"].includes(typeof value)) continue;
    cleaned[key] = normalizeFilterValue(table, key, value);
  }
  return cleaned;
}

function sanitizeValues(table: string, values: unknown, allowed: string[]) {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    throw new Error("Write actions must include a values object.");
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
    if (!allowed.includes(key)) continue;
    if (sensitiveKeyPattern.test(key)) continue;
    cleaned[key] = normalizeValue(value);
  }

  if (!Object.keys(cleaned).length) {
    throw new Error(`No editable fields were provided for ${table}.`);
  }

  return cleaned;
}

function normalizeValue(value: unknown): unknown {
  if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalizeValue(item)]));
  }
  return String(value);
}

function redact(value: unknown, key = ""): unknown {
  if (sensitiveKeyPattern.test(key)) return "[redacted]";
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [entryKey, redact(entryValue, entryKey)]));
}

function tableCatalog() {
  return Object.entries(tableConfigs)
    .map(([table, config]) => {
      const typedConfig = config as TableConfig;
      const allowedValues = typedConfig.allowedValues
        ? `allowed values: ${Object.entries(typedConfig.allowedValues)
            .map(([column, values]) => `${column} = ${values.join(" | ")}`)
            .join("; ")}`
        : "";
      return [
        `${table}: ${typedConfig.label}. ${typedConfig.description}`,
        `read columns: ${typedConfig.read.join(", ")}`,
        `editable columns: ${typedConfig.write.length ? typedConfig.write.join(", ") : "none"}`,
        allowedValues,
        `record id column: ${typedConfig.idColumn}`,
      ].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

function actionPlanningPrompt() {
  return `You are the AnyJob admin assistant. You help admins inspect marketplace data and prepare safe data changes.

${marketplaceContext}

You must return one JSON object only, no markdown.

Allowed response shapes:
{"type":"answer","message":"short helpful answer"}
{"type":"read","tool":"search_records","table":"table_name","query":"optional search text","filters":{"column":"value"},"columns":["optional","read","columns"],"limit":10}
{"type":"read","tool":"get_record","table":"table_name","id":"record id","columns":["optional","read","columns"]}
{"type":"read","tool":"count_records","table":"table_name","filters":{"column":"value"}}
{"type":"write","operation":"update_record","table":"table_name","id":"record id","values":{"editable_column":"new value"},"reason":"why this change is needed"}
{"type":"write","operation":"insert_record","table":"table_name","values":{"editable_column":"value"},"reason":"why this insert is needed"}

Rules:
- Use only the tables and columns listed below.
- Speak to a non-technical admin. Do not mention databases, SQL, rows, enums, JSON, or Supabase in user-facing messages.
- Never invent status values. For providers, use only pending, approved, rejected, or suspended. There is no pending_kyc provider status.
- "Live jobs" means currently open work from buyer requests and business work posts. "Quotes" can mean bids on buyer jobs. "Applications" means shift applications on business work posts.
- For payment questions, check bookings, accepted bids, shift escrow payments, provider plan subscriptions, and buyer plan subscriptions.
- For plan questions, inspect admin_settings key pricing_provider_plan_rules first. It includes provider, business, and buyer plan rules.
- For business questions, separate hiring businesses from agencies/contractors using business_type.
- For KYC review, providers with status pending and uploaded documents are waiting for admin action.
- For updates, always include the exact record id. If you do not have it, do a read first.
- Do not delete records, run raw SQL, expose secrets, or edit password/token/secret fields.
- Do not ask for confirmation inside your message. Write actions are confirmed by the UI after you return a pending action.
- Prefer reading current data before proposing a write if the request is ambiguous.

Tables:
${tableCatalog()}`;
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return JSON.parse(trimmed);
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("The model did not return a JSON action.");
  return JSON.parse(match[0]);
}

async function callChatModel(messages: ModelMessage[], options?: { json?: boolean; maxTokens?: number }) {
  const groqKey = process.env.GROQ_API_KEY;
  const hfKey = process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  const maxTokens = options?.maxTokens || 900;

  async function requestModel(input: {
    provider: "groq" | "huggingface";
    apiKey: string;
    url: string;
    model: string;
    includeJsonFormat: boolean;
  }) {
    const body: Record<string, unknown> = {
      model: input.model,
      messages,
      temperature: 0.2,
      max_tokens: maxTokens,
    };
    if (options?.json && input.includeJsonFormat) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(input.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`${input.provider} model request failed (${response.status}): ${detail.slice(0, 240)}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error(`${input.provider} returned an empty response.`);
    }
    return content.trim();
  }

  if (groqKey) {
    try {
      return await requestModel({
        provider: "groq",
        apiKey: groqKey,
        url: "https://api.groq.com/openai/v1/chat/completions",
        model: process.env.GROQ_ADMIN_ASSISTANT_MODEL || "llama-3.3-70b-versatile",
        includeJsonFormat: true,
      });
    } catch (error) {
      if (!hfKey) throw error;
      console.warn("Groq admin assistant fallback:", error);
    }
  }

  if (hfKey) {
    return requestModel({
      provider: "huggingface",
      apiKey: hfKey,
      url: "https://router.huggingface.co/v1/chat/completions",
      model: process.env.HUGGING_FACE_ADMIN_ASSISTANT_MODEL || "openai/gpt-oss-120b:cerebras",
      includeJsonFormat: false,
    });
  }

  throw new Error("Missing GROQ_API_KEY or HUGGING_FACE_API_KEY.");
}

function applyFilters(query: any, filters: Record<string, unknown>) {
  let next = query;
  for (const [column, value] of Object.entries(filters)) {
    next = value == null ? next.is(column, null) : next.eq(column, value);
  }
  return next;
}

function applySearch(query: any, config: TableConfig, searchText: unknown) {
  if (typeof searchText !== "string" || !searchText.trim() || !config.search.length) return query;
  const safe = searchText.trim().replace(/[%,()]/g, " ").replace(/\s+/g, " ").slice(0, 120);
  if (!safe) return query;
  return query.or(config.search.map((column) => `${column}.ilike.%${safe}%`).join(","));
}

function normalizeIntentText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

function isActiveAdminJob(job: AdminJob) {
  return ["live", "no_quotes", "awaiting_buyer"].includes(job.tabStatus);
}

function isLiveTabJob(job: AdminJob) {
  return job.tabStatus === "live";
}

function isToday(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function friendlyJobStatus(job: AdminJob) {
  if (job.tabStatus === "no_quotes") return "Needs quotes";
  if (job.tabStatus === "awaiting_buyer") return "Waiting on buyer";
  if (job.tabStatus === "pending_review") return "Needs admin review";
  return String(job.status || job.tabStatus).replaceAll("_", " ");
}

function adminJobRows(jobs: AdminJob[]) {
  return jobs.slice(0, 8).map((job) => ({
    Job: job.type || job.shortId,
    Customer: job.customer || "Unknown",
    Source: job.sourceLabel,
    Status: friendlyJobStatus(job),
    Quotes: job.quotes,
    Posted: job.postedLabel,
  }));
}

function kycRows(reviews: Awaited<ReturnType<typeof getKycReviews>>) {
  return reviews.slice(0, 8).map((review) => ({
    Provider: review.provider,
    Status: review.status,
    Documents: review.submittedDocuments.length ? review.submittedDocuments.join(", ") : "None uploaded",
    Missing: review.missingDocuments.length ? review.missingDocuments.join(", ") : "Nothing missing",
    Impact: review.accountImpact,
  }));
}

async function answerKycQuestion(text: string) {
  const reviews = await getKycReviews();
  const readyForReview = reviews.filter((review) => review.status === "Needs review" || review.docsSubmitted);
  const withAnyDocuments = reviews.filter((review) => review.submittedDocuments.length > 0);
  const missingDocuments = reviews.filter((review) => review.status === "Missing document" || review.missingDocuments.length > 0);
  const asksUploaded = includesAny(text, ["uploaded", "upload", "added", "submitted", "documents by now", "docs by now"]);

  if (asksUploaded) {
    if (!withAnyDocuments.length) {
      return {
        message: "No providers have uploaded KYC documents yet.",
        rows: [],
        count: 0,
      };
    }

    return {
      message: `Yes. ${plural(withAnyDocuments.length, "provider")} uploaded at least one KYC document. ${readyForReview.length ? `${plural(readyForReview.length, "provider")} can be reviewed now.` : "None are fully ready for approval yet."}`,
      rows: kycRows(withAnyDocuments),
      count: withAnyDocuments.length,
    };
  }

  if (readyForReview.length) {
    return {
      message: `${plural(readyForReview.length, "provider")} can be reviewed for KYC now. ${missingDocuments.length ? `${plural(missingDocuments.length, "provider")} still need missing documents.` : ""}`.trim(),
      rows: kycRows(readyForReview),
      count: readyForReview.length,
    };
  }

  if (missingDocuments.length) {
    return {
      message: `No providers are fully ready for KYC approval right now. ${plural(missingDocuments.length, "provider")} still need to upload missing documents.`,
      rows: kycRows(missingDocuments),
      count: 0,
    };
  }

  return {
    message: "No providers need KYC review right now.",
    rows: [],
    count: 0,
  };
}

async function answerLiveJobsQuestion(text: string) {
  const jobs = await getAdminJobs();
  const liveJobs = jobs.filter(isLiveTabJob);
  const activeJobs = jobs.filter(isActiveAdminJob);
  const noQuoteJobs = activeJobs.filter((job) => job.quotes === 0);
  const quotedLiveJobs = liveJobs.filter((job) => job.quotes > 0);
  const asksNoQuotes = includesAny(text, ["no quote", "no quotes", "without quote", "without quotes", "no bid", "no bids", "without bid", "without bids"]);
  const asksOpenOrActive = includesAny(text, ["open", "active"]);

  if (asksNoQuotes) {
    if (!noQuoteJobs.length) {
      return {
        message: "All live jobs have at least one quote right now.",
        rows: [],
        count: 0,
      };
    }

    return {
      message: `${plural(noQuoteJobs.length, "live job")} still need quotes.`,
      rows: adminJobRows(noQuoteJobs),
      count: noQuoteJobs.length,
    };
  }

  if (asksOpenOrActive && !text.includes("live")) {
    if (!activeJobs.length) {
      return {
        message: "There are no active jobs right now.",
        rows: [],
        count: 0,
      };
    }

    return {
      message: `There are ${plural(activeJobs.length, "active job")} right now. ${plural(activeJobs.filter((job) => job.quotes > 0).length, "job")} have quotes, and ${plural(noQuoteJobs.length, "job")} still need quotes.`,
      rows: adminJobRows(activeJobs),
      count: activeJobs.length,
    };
  }

  if (!liveJobs.length) {
    return {
      message: "There are no jobs in the Live tab right now.",
      rows: [],
      count: 0,
    };
  }

  return {
    message: `There are ${plural(liveJobs.length, "job")} in the Live tab. ${plural(quotedLiveJobs.length, "job")} there have quotes. Including no-quote and waiting-on-buyer work, ${plural(activeJobs.length, "job")} are active overall.`,
    rows: adminJobRows(liveJobs),
    count: liveJobs.length,
  };
}

async function answerQuoteQuestion() {
  const jobs = await getAdminJobs();
  const liveJobs = jobs.filter(isLiveTabJob);
  const activeJobs = jobs.filter(isActiveAdminJob);
  const quotedJobs = liveJobs.filter((job) => job.quotes > 0);
  const noQuoteJobs = activeJobs.filter((job) => job.quotes === 0);
  const totalQuotes = quotedJobs.reduce((sum, job) => sum + job.quotes, 0);

  if (!liveJobs.length) {
    return {
      message: "There are no jobs in the Live tab to check for quotes right now.",
      rows: [],
      count: 0,
    };
  }

  if (!totalQuotes) {
    return {
      message: `No. None of the ${plural(liveJobs.length, "job")} in the Live tab have received quotes yet.`,
      rows: adminJobRows(liveJobs),
      count: 0,
    };
  }

  return {
    message: `Yes. ${plural(quotedJobs.length, "job")} in the Live tab have received ${plural(totalQuotes, "quote")}. ${noQuoteJobs.length ? `${plural(noQuoteJobs.length, "other open job")} still have no quotes.` : "Every open job has at least one quote."}`,
    rows: adminJobRows(quotedJobs),
    count: totalQuotes,
  };
}

async function answerJobsTodayQuestion() {
  const jobs = await getAdminJobs();
  const todayJobs = jobs.filter((job) => isToday(job.datePosted));
  const buyerJobs = todayJobs.filter((job) => job.source === "service_inquiry");
  const businessJobs = todayJobs.filter((job) => job.source === "business_work_post");

  if (!todayJobs.length) {
    return {
      message: "No jobs came in today.",
      rows: [],
      count: 0,
    };
  }

  return {
    message: `${plural(todayJobs.length, "job")} came in today: ${plural(buyerJobs.length, "customer request")} and ${plural(businessJobs.length, "business post")}.`,
    rows: adminJobRows(todayJobs),
    count: todayJobs.length,
  };
}

async function answerPaymentsQuestion(text: string) {
  const payments = await getAdminPayments();
  const failedOnly = includesAny(text, ["failed", "failure", "declined", "problem"]);
  const planOnly = includesAny(text, ["plan", "subscription", "subscriptions"]);
  const shiftOnly = includesAny(text, ["shift", "escrow"]);
  const tokenOnly = includesAny(text, ["token", "bid", "quote"]);
  const normalizedRows = payments.map((payment) => ({
    reference: String(payment[0] || ""),
    type: String(payment[1] || ""),
    amount: String(payment[2] || ""),
    status: String(payment[3] || ""),
  }));
  const filtered = normalizedRows.filter((payment) => {
    const type = payment.type.toLowerCase();
    const status = payment.status.toLowerCase();
    if (failedOnly) return includesAny(status, ["failed", "declined", "past_due"]);
    if (planOnly) return type.includes("plan") || type.includes("subscription");
    if (shiftOnly) return type.includes("shift") || type.includes("escrow");
    if (tokenOnly) return type.includes("token");
    return true;
  });

  if (!filtered.length) {
    if (failedOnly) return { message: "No failed or problem payments are showing right now.", rows: [], count: 0 };
    if (planOnly) return { message: "No buyer or provider plan payments are showing yet.", rows: [], count: 0 };
    if (shiftOnly) return { message: "No shift escrow payments are showing yet.", rows: [], count: 0 };
    if (tokenOnly) return { message: "No accepted-bid booking token payments are showing yet.", rows: [], count: 0 };
    return { message: "No test payment ledger entries are showing yet.", rows: [], count: 0 };
  }

  const totalLabel = failedOnly ? "problem payment" : planOnly ? "plan payment" : shiftOnly ? "shift escrow payment" : tokenOnly ? "booking token payment" : "payment entry";
  return {
    message: `${plural(filtered.length, totalLabel)} found. The payment tab is currently a test ledger, so accepted bids, paid bookings, shift escrow, and plan subscriptions can appear here.`,
    rows: filtered.slice(0, 10),
    count: filtered.length,
  };
}

async function answerSupportQuestion(text: string) {
  const tickets = await getAdminSupport();
  const openTickets = tickets.filter((ticket) => !["resolved", "closed"].includes(ticket.status));
  const urgentTickets = openTickets.filter((ticket) => ticket.priority === "urgent" || ticket.priority === "high");
  const target =
    text.includes("urgent") || text.includes("high priority")
      ? urgentTickets
      : text.includes("resolved") || text.includes("closed")
        ? tickets.filter((ticket) => ["resolved", "closed"].includes(ticket.status))
        : openTickets;

  if (!target.length) {
    if (text.includes("urgent") || text.includes("high priority")) return { message: "No urgent or high-priority support tickets are open right now.", rows: [], count: 0 };
    if (text.includes("resolved") || text.includes("closed")) return { message: "No resolved support tickets are showing right now.", rows: [], count: 0 };
    return { message: "No open support tickets are waiting right now.", rows: [], count: 0 };
  }

  return {
    message: `${plural(target.length, "support ticket")} found. The highest-priority tickets are shown first.`,
    rows: target.slice(0, 10).map((ticket) => ({
      ticket: `AJ-${String(ticket.ticketNumber).padStart(5, "0")}`,
      requester: ticket.requesterEmail,
      type: ticket.requesterType,
      title: ticket.title,
      priority: ticket.priority,
      status: ticket.status,
      waiting: ticket.waitingLabel,
    })),
    count: target.length,
  };
}

function basicPromptAnswer() {
  return {
    message: [
      "Try asking:",
      "Who needs KYC review?",
      "Did any providers upload KYC documents?",
      "How many live jobs are there?",
      "Which live jobs have no quotes?",
      "How many jobs came in today?",
      "Show open support tickets.",
      "Show payment entries.",
      "Show buyer plan subscriptions.",
      "Show failed emails.",
    ].join("\n"),
  };
}

async function runDirectAdminIntent(latestUserMessage: string, messages: ChatMessage[]) {
  const text = normalizeIntentText(latestUserMessage);
  const recentContext = normalizeIntentText(messages.slice(-6).map((message) => message.content).join(" "));
  const mentionsJobs = includesAny(text, ["job", "jobs", "work", "request", "requests", "post", "posts"]);
  const mentionsQuotes = includesAny(text, ["quote", "quotes", "bid", "bids", "offer", "offers", "application", "applications"]);
  const mentionsKyc = text.includes("kyc") || (includesAny(text, ["document", "documents", "docs", "upload", "uploaded"]) && includesAny(text, ["provider", "providers"]));
  const mentionsPayments = includesAny(text, ["payment", "payments", "paid", "ledger", "stripe", "refund", "charge", "escrow", "subscription", "subscriptions"]);
  const mentionsSupport = includesAny(text, ["support", "ticket", "tickets", "help request", "issue", "issues"]);
  const asksTodayJobs = mentionsJobs && text.includes("today") && includesAny(text, ["how many", "came in", "received", "new", "posted"]);
  const asksLiveJobs =
    mentionsJobs && includesAny(text, ["live", "open", "active", "no quote", "no quotes", "without quote", "without quotes", "no bid", "no bids"]);
  const asksQuoteFollowUp = mentionsQuotes && (text.includes("did they") || text.includes("do they") || recentContext.includes("live job") || recentContext.includes("open job"));

  if (includesAny(text, ["basic prompts", "example prompts", "what can i ask", "what should i ask"])) return basicPromptAnswer();
  if (mentionsKyc) return answerKycQuestion(text);
  if (asksTodayJobs) return answerJobsTodayQuestion();
  if (asksLiveJobs) return answerLiveJobsQuestion(text);
  if (asksQuoteFollowUp || (mentionsQuotes && mentionsJobs)) return answerQuoteQuestion();
  if (mentionsPayments) return answerPaymentsQuestion(text);
  if (mentionsSupport) return answerSupportQuestion(text);

  return null;
}

async function runReadTool(plan: Record<string, unknown>) {
  const [tableName, config] = getTableConfig(plan.table);
  const admin = createAdminSupabaseClient() as never as AdminDb;
  const filters = sanitizeFilters(tableName, plan.filters, config.read);

  if (plan.tool === "count_records") {
    let query = admin.from(tableName).select("*", { count: "exact", head: true });
    query = applyFilters(query, filters);
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return { rows: [], count: count || 0, columns: [] };
  }

  const columns = allowedColumns(plan.columns, config.read.slice(0, 10), config.read);

  if (plan.tool === "get_record") {
    if (typeof plan.id !== "string" || !plan.id.trim()) throw new Error("A record id is required.");
    const { data, error } = await admin.from(tableName).select(columns.join(",")).eq(config.idColumn, plan.id).maybeSingle();
    if (error) throw new Error(error.message);
    return { rows: data ? [redact(data) as ToolRow] : [], count: data ? 1 : 0, columns };
  }

  let query = admin.from(tableName).select(columns.join(","));
  query = applyFilters(query, filters);
  query = applySearch(query, config, plan.query);
  const { data, error } = await query.limit(clampLimit(plan.limit));
  if (error) throw new Error(error.message);
  const rows = ((data || []) as ToolRow[]).map((row) => redact(row) as ToolRow);
  return { rows, count: rows.length, columns };
}

async function summarizeRead(userRequest: string, result: { rows: ToolRow[]; count: number; columns: string[] }) {
  if (result.count === 0) {
    return "I did not find anything matching that.";
  }

  const content = await callChatModel(
    [
      {
        role: "system",
        content:
          `You are the AnyJob admin assistant. Summarize the result for a non-technical admin in plain operational language. Be concise, name key records and statuses, and do not invent data. Never mention databases, queries, rows, SQL, JSON, enums, tables, or Supabase.\n\n${marketplaceContext}`,
      },
      {
        role: "user",
        content: JSON.stringify({
          request: userRequest,
          count: result.count,
          columns: result.columns,
          rows: result.rows.slice(0, 10),
        }),
      },
    ],
    { maxTokens: 500 }
  );
  return content;
}

function friendlyAssistantError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/invalid input value for enum/i.test(message)) {
    return "I used the wrong status wording for that check. Try asking it in plain language again, like “Who needs KYC review?” or “How many live jobs are there?”";
  }
  if (/table is not available|not available to the admin assistant/i.test(message)) {
    return "I could not match that to an admin area yet. Try asking about users, providers, KYC, jobs, quotes, businesses, badges, settings, or emails.";
  }
  if (/missing groq|model request failed|empty response|json action/i.test(message)) {
    return "The assistant brain could not answer that cleanly. The built-in shortcuts still work for KYC, live jobs, quotes, jobs today, and failed emails.";
  }
  return "I could not complete that check. Try a simpler admin question, or ask for example prompts.";
}

function buildPendingAction(plan: Record<string, unknown>): PendingAction {
  const [tableName, config] = getTableConfig(plan.table);
  const operation = plan.operation === "insert_record" ? "insert_record" : plan.operation === "update_record" ? "update_record" : null;
  if (!operation) throw new Error("Unsupported write operation.");
  if (operation === "update_record" && (typeof plan.id !== "string" || !plan.id.trim())) {
    throw new Error("Update actions require a record id.");
  }

  return {
    operation,
    table: tableName,
    id: typeof plan.id === "string" ? plan.id : undefined,
    values: sanitizeValues(tableName, plan.values, config.write),
    reason: typeof plan.reason === "string" ? plan.reason.slice(0, 500) : "Admin assistant proposed this change.",
  };
}

async function runConfirmedAction(action: PendingAction, actorId: string) {
  const [tableName, config] = getTableConfig(action.table);
  const values = sanitizeValues(tableName, action.values, config.write);
  const admin = createAdminSupabaseClient() as never as AdminDb;
  const selectColumns = config.read.slice(0, 12).join(",");

  if (action.operation === "update_record") {
    if (!action.id) throw new Error("Missing record id.");
    const { data, error } = await admin.from(tableName).update(values).eq(config.idColumn, action.id).select(selectColumns).maybeSingle();
    if (error) throw new Error(error.message);
    await safeLogAdminAction(admin, actorId, action, data || values);
    return { rows: data ? [redact(data) as ToolRow] : [], count: data ? 1 : 0 };
  }

  const { data, error } = await admin.from(tableName).insert(values).select(selectColumns).maybeSingle();
  if (error) throw new Error(error.message);
  await safeLogAdminAction(admin, actorId, action, data || values);
  return { rows: data ? [redact(data) as ToolRow] : [], count: data ? 1 : 0 };
}

async function safeLogAdminAction(admin: AdminDb, actorId: string, action: PendingAction, result: unknown) {
  try {
    await admin.from("admin_action_logs").insert({
      actor_id: actorId,
      action: `assistant_${action.operation}`,
      target_type: action.table,
      target_id: action.id || null,
      metadata: {
        reason: action.reason || null,
        values: redact(action.values),
        result: redact(result),
      },
    });
  } catch (error) {
    console.warn("Admin assistant audit log skipped:", error);
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getAdminApiUser();
    if (!adminUser) return adminForbidden();

    const body = await request.json();
    const confirmedAction = body?.confirmAction as PendingAction | undefined;

    if (confirmedAction) {
      const result = await runConfirmedAction(confirmedAction, adminUser.id);
      return NextResponse.json({
        message: `Done. I ${confirmedAction.operation === "update_record" ? "updated" : "created"} ${result.count} record${result.count === 1 ? "" : "s"}.`,
        rows: result.rows,
      });
    }

    const messages = cleanMessages(body?.messages);
    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";
    if (!latestUserMessage.trim()) {
      return NextResponse.json({ error: "Send a question or instruction for the admin assistant." }, { status: 400 });
    }

    const directAnswer = await runDirectAdminIntent(latestUserMessage, messages);
    if (directAnswer) {
      return NextResponse.json(directAnswer);
    }

    const planContent = await callChatModel(
      [
        { role: "system", content: actionPlanningPrompt() },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
      ],
      { json: true, maxTokens: 900 }
    );
    const plan = extractJsonObject(planContent);

    if (plan.type === "read") {
      const result = await runReadTool(plan);
      const message = await summarizeRead(latestUserMessage, result);
      return NextResponse.json({
        message,
        rows: result.rows,
        count: result.count,
      });
    }

    if (plan.type === "write") {
      const pendingAction = buildPendingAction(plan);
      return NextResponse.json({
        message: plan.message || "I found a safe admin change to prepare. Review it before I apply it.",
        pendingAction,
      });
    }

    return NextResponse.json({
      message: typeof plan.message === "string" ? plan.message : "I can help with AnyJob admin data, users, jobs, businesses, badges, settings, and notifications.",
    });
  } catch (error) {
    console.error("Admin assistant failed:", error);
    return NextResponse.json(
      { error: friendlyAssistantError(error) },
      { status: 500 }
    );
  }
}
