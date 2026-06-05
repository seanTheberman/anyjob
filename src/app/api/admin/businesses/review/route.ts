import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const allowedActions = ["approve", "reject", "suspend", "request_docs"] as const;
type BusinessAction = (typeof allowedActions)[number];

function isBusinessAction(value: unknown): value is BusinessAction {
  return typeof value === "string" && allowedActions.includes(value as BusinessAction);
}

async function isAdminRequest() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return false;

  const client = supabase as never as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: { role?: string } | null; error: unknown }>;
        };
      };
    };
  };

  const [elooProfile, userProfile] = await Promise.all([
    client.from("eloo_profiles").select("role").eq("id", user.id).single(),
    client.from("user_profiles").select("role").eq("id", user.id).single(),
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
    const businessIds: string[] = Array.isArray(body.businessIds)
      ? body.businessIds.filter((id: unknown) => typeof id === "string" && id.length > 0)
      : [];
    const action = body.action;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!businessIds.length) {
      return NextResponse.json({ error: "No businesses selected" }, { status: 400 });
    }

    if (!isBusinessAction(action)) {
      return NextResponse.json({ error: "Invalid business action" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const adminDb = supabase as never as {
      from: (table: string) => {
        select: (columns: string) => {
          in: (column: string, values: string[]) => Promise<{
            data: Array<{ id: string; owner_user_id: string; registration_number?: string | null; document_url?: string | null }> | null;
            error: { message: string } | null;
          }>;
        };
        update: (values: Record<string, unknown>) => {
          in: (column: string, values: string[]) => Promise<{ error: { message: string } | null }>;
          eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };

    const { data: businesses, error: lookupError } = await adminDb
      .from("business_profiles")
      .select("id,owner_user_id,registration_number,document_url")
      .in("id", businessIds);

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    const foundBusinessIds = new Set((businesses || []).map((business) => business.id));
    const missing = businessIds.filter((id) => !foundBusinessIds.has(id));
    if (missing.length) {
      return NextResponse.json({ error: "Some businesses were not found", missing }, { status: 404 });
    }

    if (action === "approve") {
      const incomplete = (businesses || []).filter((business) => !business.registration_number || !business.document_url);
      if (incomplete.length) {
        return NextResponse.json(
          { error: "Approval requires business registration number and business document", businessIds: incomplete.map((business) => business.id) },
          { status: 400 }
        );
      }
    }

    const status =
      action === "approve"
        ? "approved"
        : action === "suspend"
          ? "suspended"
          : action === "reject"
            ? "rejected"
            : "pending";

    const businessUpdate = {
      status,
      reviewed_at: action === "request_docs" ? null : now,
      reviewed_by: null,
      rejection_reason: action === "approve" ? null : reason || (action === "request_docs" ? "Additional business documents requested" : "Rejected by admin"),
      updated_at: now,
    };

    const businessResult = await adminDb.from("business_profiles").update(businessUpdate).in("id", businessIds);
    if (businessResult.error) {
      return NextResponse.json({ error: businessResult.error.message }, { status: 500 });
    }

    const ownerIds = Array.from(new Set((businesses || []).map((business) => business.owner_user_id)));
    await Promise.all(
      ownerIds.map((ownerId) =>
        adminDb.from("eloo_profiles").update({
          has_business_profile: true,
          business_registration_status: status,
          updated_at: now,
        }).eq("id", ownerId)
      )
    );

    return NextResponse.json({ ok: true, action, businessIds, status });
  } catch (error) {
    console.error("Business review update failed:", error);
    return NextResponse.json({ error: "Failed to update business review status" }, { status: 500 });
  }
}
