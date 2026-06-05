import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const allowedActions = ["approve", "request_docs", "reject", "suspend"] as const;
type KycAction = (typeof allowedActions)[number];

function isKycAction(value: unknown): value is KycAction {
  return typeof value === "string" && allowedActions.includes(value as KycAction);
}

async function isAdminRequest() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return false;

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

  return elooProfile.data?.role === "admin" || userProfile.data?.role === "admin";
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminRequest();
    if (!isAdmin) {
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
    const adminDb = supabase as never as {
      from: (table: string) => {
        select: (columns: string) => {
          in: (column: string, values: string[]) => Promise<{
            data: Array<{ id: string; id_document_url?: string | null; selfie_video_url?: string | null; insurance_document_url?: string | null; insurance_status?: string | null }> | null;
            error: { message: string } | null;
          }>;
        };
        update: (values: Record<string, unknown>) => {
          in: (column: string, values: string[]) => Promise<{ error: { message: string } | null }>;
        };
      };
    };

    if (action === "approve" || action === "reject") {
      const { data: submittedRows, error: submittedError } = await adminDb
        .from("sellers")
        .select("id,id_document_url,selfie_video_url,insurance_document_url,insurance_status")
        .in("id", providerIds);

      if (submittedError) {
        return NextResponse.json({ error: submittedError.message }, { status: 500 });
      }

      const submittedProviderIds = new Set(
        (submittedRows || [])
          .filter((row) => Boolean(row.id_document_url && row.selfie_video_url && (row.insurance_document_url || row.insurance_status)))
          .map((row) => row.id)
      );
      const withoutDocs = providerIds.filter((id) => !submittedProviderIds.has(id));

      if (withoutDocs.length) {
        return NextResponse.json(
          { error: "Approve/reject requires submitted seller documents", providerIdsWithoutDocs: withoutDocs },
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

    const [sellerResult, profileResult] = await Promise.all([
      adminDb.from("sellers").update(sellerUpdate).in("id", providerIds),
      adminDb.from("eloo_profiles").update(profileUpdate).in("id", providerIds),
    ]);

    if (sellerResult.error && profileResult.error) {
      return NextResponse.json(
        {
          error: "Failed to update provider KYC status",
          details: [sellerResult.error.message, profileResult.error.message],
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      action,
      providerIds,
      warnings: [sellerResult.error?.message, profileResult.error?.message].filter(Boolean),
    });
  } catch (error) {
    console.error("Admin KYC update failed:", error);
    return NextResponse.json({ error: "Failed to update KYC status" }, { status: 500 });
  }
}
