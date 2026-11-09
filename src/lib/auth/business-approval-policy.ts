type BusinessApproval = {
  id: unknown;
  owner_user_id: unknown;
  status: unknown;
  reviewed_by: unknown;
};

/** Validate only trusted, server-managed Auth app_metadata (never user_metadata). */
export function permitsOwnerDocumentWaiver(
  appMetadata: Record<string, unknown> | null | undefined,
  userId: string,
  business: BusinessApproval,
  now = Date.now(),
): boolean {
  const raw = appMetadata?.business_document_waiver;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const grant = raw as Record<string, unknown>;
  if (
    grant.status !== "active" ||
    grant.capability !== "business_post_without_documents" ||
    grant.userId !== userId ||
    grant.businessId !== business.id ||
    business.owner_user_id !== userId ||
    business.status !== "approved" ||
    typeof business.reviewed_by !== "string" ||
    !business.reviewed_by ||
    grant.grantedBy !== business.reviewed_by ||
    typeof grant.auditId !== "string" || !grant.auditId ||
    typeof grant.reason !== "string" || !grant.reason.trim()
  ) return false;
  const grantedAt = typeof grant.grantedAt === "string" ? Date.parse(grant.grantedAt) : NaN;
  if (!Number.isFinite(grantedAt) || grantedAt > now + 60_000) return false;
  if (grant.expiresAt != null) {
    const expiresAt = typeof grant.expiresAt === "string" ? Date.parse(grant.expiresAt) : NaN;
    if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;
  }
  return true;
}
