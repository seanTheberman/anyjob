import { NextResponse } from "next/server";

import { notifyJobEvent } from "@/lib/notifications/email-functions";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const allowedActions = ["approve", "request_docs", "reject", "suspend"] as const;
type KycAction = (typeof allowedActions)[number];
type AdminClient = { from: (table: string) => any };
type KycProviderRow = {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  id_document_url?: string | null;
  selfie_video_url?: string | null;
  insurance_document_url?: string | null;
  insurance_status?: string | null;
};

function isKycAction(value: unknown): value is KycAction {
  return typeof value === "string" && allowedActions.includes(value as KycAction);
}

function providerDisplayName(provider: KycProviderRow) {
  return [provider.first_name, provider.last_name].filter(Boolean).join(" ").trim() || provider.full_name || "Provider";
}

function missingKycDocuments(provider: KycProviderRow, idDocumentCount = 0) {
  const hasId = idDocumentCount >= 2;
  const hasSelfie = Boolean(provider.selfie_video_url);
  const hasInsurance = Boolean(provider.insurance_document_url || provider.insurance_status === "approved");

  return [
    !hasId ? "front and back ID documents" : null,
    !hasSelfie ? "selfie video" : null,
    !hasInsurance ? "insurance proof or insurance status" : null,
  ].filter(Boolean);
}

async function sendKycDocumentRequestEmails(adminDb: AdminClient, providerIds: string[], reason: string) {
  const [sellerResult, profileResult, userProfileResult, idDocumentResult] = await Promise.all([
    adminDb
      .from("sellers")
      .select("id,email,first_name,last_name,id_document_url,selfie_video_url,insurance_document_url,insurance_status")
      .in("id", providerIds),
    adminDb
      .from("eloo_profiles")
      .select("id,email,first_name,last_name")
      .in("id", providerIds),
    adminDb
      .from("user_profiles")
      .select("id,email,full_name")
      .in("id", providerIds),
    adminDb
      .from("user_images")
      .select("user_id")
      .eq("image_type", "id_document")
      .in("user_id", providerIds),
  ]);

  if (idDocumentResult.error) {
    return { attempted: providerIds.length, sent: 0, failed: providerIds.length, error: idDocumentResult.error.message };
  }

  const lookupErrors = [
    sellerResult.error?.message,
    profileResult.error?.message,
    userProfileResult.error?.message,
  ].filter(Boolean);
  if (sellerResult.error && profileResult.error && userProfileResult.error) {
    return { attempted: providerIds.length, sent: 0, failed: providerIds.length, error: lookupErrors.join("; ") };
  }

  const idDocumentCounts = new Map<string, number>();
  for (const row of ((idDocumentResult.data || []) as Array<{ user_id?: string | null }>)) {
    const userId = row.user_id;
    if (!userId) continue;
    idDocumentCounts.set(userId, (idDocumentCounts.get(userId) || 0) + 1);
  }

  const providersById = new Map<string, KycProviderRow>();
  for (const providerId of providerIds) {
    providersById.set(providerId, { id: providerId });
  }
  for (const profile of ((userProfileResult.data || []) as KycProviderRow[])) {
    providersById.set(profile.id, { ...(providersById.get(profile.id) || { id: profile.id }), ...profile });
  }
  for (const profile of ((profileResult.data || []) as KycProviderRow[])) {
    providersById.set(profile.id, { ...(providersById.get(profile.id) || { id: profile.id }), ...profile });
  }
  for (const seller of ((sellerResult.data || []) as KycProviderRow[])) {
    providersById.set(seller.id, { ...(providersById.get(seller.id) || { id: seller.id }), ...seller });
  }

  const requestedAt = new Date().toISOString();
  const results = await Promise.all(
    providerIds.map(async (providerId) => {
      const provider = providersById.get(providerId) || { id: providerId };
      const result = await notifyJobEvent({
        action: "provider_kyc_docs_requested",
        tenantSlug: "default",
        providerUserId: provider.id,
        providerEmail: provider.email || undefined,
        providerName: providerDisplayName(provider),
        missingKyc: missingKycDocuments(provider, idDocumentCounts.get(provider.id) || 0),
        requestReason: reason,
        requestedAt,
      });
      return { providerId, result };
    })
  );

  const failures = results.filter(({ result }) => !result.ok || result.body?.error || result.body?.skipped);
  return {
    attempted: providerIds.length,
    sent: results.filter(({ result }) => result.ok && result.body?.sent === true).length,
    failed: failures.length,
    errors: [...lookupErrors, ...failures.map(({ providerId, result }) => `${providerId}: ${result.error || result.body?.error || result.body?.reason || "email not sent"}`)].slice(0, 5),
  };
}

async function getAdminRequestUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const adminDb = supabase as never as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: { role?: string } | null; error: unknown }>;
        };
      };
    };
  };

  const [elooProfile, userProfile] = await Promise.all([
    adminDb.from("eloo_profiles").select("role").eq("id", user.id).single(),
    adminDb.from("user_profiles").select("role").eq("id", user.id).single(),
  ]);

  return elooProfile.data?.role === "admin" || userProfile.data?.role === "admin" ? user.id : null;
}

export async function POST(request: Request) {
  try {
    const adminUserId = await getAdminRequestUserId();
    if (!adminUserId) {
      return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
    }

    const body = await request.json();
    const providerIds: string[] = Array.isArray(body.providerIds)
      ? body.providerIds.filter((id: unknown) => typeof id === "string" && id.length > 0)
      : [];
    const action = body.action;

    if (!providerIds.length) {
      return NextResponse.json({ error: "No providers selected" }, { status: 400 });
    }

    if (!isKycAction(action)) {
      return NextResponse.json({ error: "Invalid KYC action" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const adminDb = supabase as never as AdminClient;

    if (action === "approve" || action === "reject") {
      const [submittedResult, idDocumentResult] = await Promise.all([
        adminDb
          .from("sellers")
          .select("id,id_document_url,selfie_video_url,insurance_document_url,insurance_status")
          .in("id", providerIds),
        adminDb
          .from("user_images")
          .select("user_id")
          .eq("image_type", "id_document")
          .in("user_id", providerIds),
      ]);

      if (submittedResult.error) {
        return NextResponse.json({ error: submittedResult.error.message }, { status: 500 });
      }

      if (idDocumentResult.error) {
        return NextResponse.json({ error: idDocumentResult.error.message }, { status: 500 });
      }

      const idDocumentCounts = new Map<string, number>();
      for (const row of ((idDocumentResult.data || []) as Array<{ user_id?: string | null }>)) {
        const userId = row.user_id;
        if (!userId) continue;
        idDocumentCounts.set(userId, (idDocumentCounts.get(userId) || 0) + 1);
      }

      const submittedProviderIds = new Set(
        ((submittedResult.data || []) as KycProviderRow[])
          .filter((row) => Boolean((idDocumentCounts.get(row.id) || 0) >= 2 && row.selfie_video_url && (row.insurance_document_url || row.insurance_status)))
          .map((row) => row.id)
      );
      const withoutDocs = providerIds.filter((id) => !submittedProviderIds.has(id));

      if (withoutDocs.length) {
        return NextResponse.json(
          { error: "Approve/reject requires front and back ID documents, selfie video, and insurance proof/status", providerIdsWithoutDocs: withoutDocs },
          { status: 400 }
        );
      }
    }

    const sellerUpdate =
      action === "approve"
        ? { status: "approved", approved_at: now, rejection_reason: null, insurance_status: "approved", background_check_status: "approved", email_verified: true, phone_verified: true, updated_at: now }
        : action === "suspend"
          ? { status: "suspended", approved_at: null, rejection_reason: body.reason || "Suspended by admin", background_check_status: "suspended", updated_at: now }
        : action === "reject"
          ? { status: "rejected", approved_at: null, rejection_reason: body.reason || "Rejected by admin", background_check_status: "rejected", updated_at: now }
          : { status: "pending", rejection_reason: body.reason || "Additional KYC documents requested", updated_at: now };

    const profileUpdate =
      action === "approve"
        ? { is_verified: true, kyc_status: "approved", updated_at: now }
        : { is_verified: false, kyc_status: action === "reject" ? "rejected" : action === "suspend" ? "suspended" : "submitted", updated_at: now };

    const flagStatus = action === "suspend" ? "blocked" : action === "approve" ? "active" : null;
    const authProviderIds = flagStatus
      ? (await Promise.all(
          providerIds.map(async (providerId) => {
            const { data } = await supabase.auth.admin.getUserById(providerId);
            return data.user ? providerId : null;
          })
        )).filter((providerId): providerId is string => Boolean(providerId))
      : [];
    const flagRows = flagStatus
      ? authProviderIds.map((providerId) => ({
          user_id: providerId,
          status: flagStatus,
          risk_override: flagStatus === "blocked" ? "High" : null,
          note: `${action} provider by admin`,
          updated_by: adminUserId,
          updated_at: now,
        }))
      : [];

    const [sellerResult, profileResult, flagResult, userProfileActiveResult, elooProfileActiveResult] = await Promise.all([
      adminDb.from("sellers").update(sellerUpdate).in("id", providerIds),
      adminDb.from("eloo_profiles").update(profileUpdate).in("id", providerIds),
      flagRows.length
        ? adminDb.from("admin_user_flags").upsert(flagRows, { onConflict: "user_id" })
        : Promise.resolve({ error: null }),
      flagStatus
        ? adminDb.from("user_profiles").update({ is_active: flagStatus === "active", updated_at: now }).in("id", providerIds)
        : Promise.resolve({ error: null }),
      flagStatus
        ? adminDb.from("eloo_profiles").update({ is_active: flagStatus === "active", updated_at: now }).in("id", providerIds)
        : Promise.resolve({ error: null }),
    ]);

    const activeStateErrors = [userProfileActiveResult.error?.message, elooProfileActiveResult.error?.message].filter(
      (message) => message && !/column .*is_active|schema cache/i.test(message)
    );
    if (flagResult.error) {
      return NextResponse.json({ error: flagResult.error.message }, { status: 500 });
    }
    if (sellerResult.error && profileResult.error) {
      return NextResponse.json(
        {
          error: "Failed to update provider KYC status",
          details: [sellerResult.error.message, profileResult.error.message],
        },
        { status: 500 }
      );
    }
    if (activeStateErrors.length) {
      return NextResponse.json({ error: activeStateErrors[0] }, { status: 500 });
    }

    const emailResult =
      action === "request_docs"
        ? await sendKycDocumentRequestEmails(
            adminDb,
            providerIds,
            typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "Additional KYC documents requested"
          )
        : null;

    return NextResponse.json({
      ok: true,
      action,
      providerIds,
      emailResult,
      warnings: [
        sellerResult.error?.message,
        profileResult.error?.message,
        userProfileActiveResult.error?.message,
        elooProfileActiveResult.error?.message,
      ].filter(Boolean),
    });
  } catch (error) {
    console.error("Admin KYC update failed:", error);
    return NextResponse.json({ error: "Failed to update KYC status" }, { status: 500 });
  }
}
