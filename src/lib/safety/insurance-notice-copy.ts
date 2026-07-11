export const INSURANCE_NOTICE_SETTING_KEYS = {
  enabled: "provider_insurance_warning_enabled",
  title: "provider_insurance_warning_title",
  message: "provider_insurance_warning_message",
} as const;

export const PLATFORM_WARNING_MESSAGES_KEY = "platform_warning_messages";
export const PROVIDER_INSURANCE_WARNING_ID = "provider_insurance";

export type InsuranceNoticeCopy = {
  enabled: boolean;
  title: string;
  message: string;
};

export type PlatformWarningSurface = "provider_workspace" | "buyer_dashboard" | "public_marketplace";
export type PlatformWarningSeverity = "info" | "warning" | "critical";

export type PlatformWarningMessage = {
  id: string;
  enabled: boolean;
  surface: PlatformWarningSurface;
  severity: PlatformWarningSeverity;
  title: string;
  message: string;
};

export const DEFAULT_INSURANCE_NOTICE: InsuranceNoticeCopy = {
  enabled: true,
  title: "Provider insurance warning",
  message:
    "AnyJob does not provide individual insurance. Providers must arrange their own insurance for emergencies, accidents, or liability. AnyJob may restrict or block work when a provider lacks required insurance.",
};

export const DEFAULT_PLATFORM_WARNING_MESSAGES: PlatformWarningMessage[] = [
  {
    id: PROVIDER_INSURANCE_WARNING_ID,
    enabled: DEFAULT_INSURANCE_NOTICE.enabled,
    surface: "provider_workspace",
    severity: "warning",
    title: DEFAULT_INSURANCE_NOTICE.title,
    message: DEFAULT_INSURANCE_NOTICE.message,
  },
  {
    id: "buyer_kyc_pending",
    enabled: true,
    surface: "buyer_dashboard",
    severity: "warning",
    title: "KYC pending",
    message:
      "Complete buyer KYC before accepting quotes. AnyJob will email reminders after a job is posted until verification is complete.",
  },
];

function isWarningSurface(value: unknown): value is PlatformWarningSurface {
  return value === "provider_workspace" || value === "buyer_dashboard" || value === "public_marketplace";
}

function isWarningSeverity(value: unknown): value is PlatformWarningSeverity {
  return value === "info" || value === "warning" || value === "critical";
}

function sanitizeWarningMessage(value: unknown, index: number): PlatformWarningMessage | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const title = String(record.title || "").trim();
  const message = String(record.message || "").trim();
  if (!title && !message) return null;

  const id = String(record.id || `warning_${index + 1}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || `warning_${index + 1}`;

  return {
    id,
    enabled: record.enabled !== false && String(record.enabled).toLowerCase() !== "false",
    surface: isWarningSurface(record.surface) ? record.surface : "provider_workspace",
    severity: isWarningSeverity(record.severity) ? record.severity : "warning",
    title: title || "Warning",
    message: message || "Add warning message copy.",
  };
}

export function parsePlatformWarningMessages(value: string | null | undefined): PlatformWarningMessage[] {
  if (!value) return DEFAULT_PLATFORM_WARNING_MESSAGES;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return DEFAULT_PLATFORM_WARNING_MESSAGES;
    const warnings = parsed
      .map((item, index) => sanitizeWarningMessage(item, index))
      .filter((item): item is PlatformWarningMessage => Boolean(item));

    return warnings.length ? warnings : DEFAULT_PLATFORM_WARNING_MESSAGES;
  } catch {
    return DEFAULT_PLATFORM_WARNING_MESSAGES;
  }
}

export function parseInsuranceNoticeCopy(values: Map<string, string | null | undefined>): InsuranceNoticeCopy {
  const storedWarnings = values.get(PLATFORM_WARNING_MESSAGES_KEY);
  const warningMessages = storedWarnings ? parsePlatformWarningMessages(storedWarnings) : [];
  const insuranceWarning = warningMessages.find((warning) => warning.id === PROVIDER_INSURANCE_WARNING_ID);
  if (insuranceWarning) {
    return {
      enabled: insuranceWarning.enabled,
      title: insuranceWarning.title || DEFAULT_INSURANCE_NOTICE.title,
      message: insuranceWarning.message || DEFAULT_INSURANCE_NOTICE.message,
    };
  }

  const enabledValue = String(values.get(INSURANCE_NOTICE_SETTING_KEYS.enabled) ?? "true").toLowerCase();
  const title = String(values.get(INSURANCE_NOTICE_SETTING_KEYS.title) || DEFAULT_INSURANCE_NOTICE.title).trim();
  const message = String(values.get(INSURANCE_NOTICE_SETTING_KEYS.message) || DEFAULT_INSURANCE_NOTICE.message).trim();

  return {
    enabled: !["false", "0", "off", "no"].includes(enabledValue),
    title: title || DEFAULT_INSURANCE_NOTICE.title,
    message: message || DEFAULT_INSURANCE_NOTICE.message,
  };
}
