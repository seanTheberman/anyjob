import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ProviderProfileRequest = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ProviderProfileRequest;
  const firstName = (body.firstName || user.user_metadata?.first_name || "Provider").trim();
  const lastName = (body.lastName || user.user_metadata?.last_name || "User").trim();
  const email = (body.email || user.email || "").toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Provider email is required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const adminDb = admin as never as {
    from: (table: string) => {
      upsert: (
        values: Record<string, unknown>,
        options?: { onConflict?: string }
      ) => Promise<{ error: { message: string } | null }>;
    };
  };

  const [profileResult, sellerResult] = await Promise.all([
    adminDb.from("eloo_profiles").upsert(
      {
        id: user.id,
        role: "provider",
        first_name: firstName,
        last_name: lastName,
        email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    ),
    adminDb.from("sellers").upsert(
      {
        id: user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: "Pending",
        address: "Pending",
        city: "Pending",
        postal_code: "00000",
        birth_date: "1970-01-01",
        service_category: "Not set",
        description: null,
        terms_accepted: false,
        status: "pending",
        email_verified: Boolean(user.email_confirmed_at),
        phone_verified: false,
        background_check_status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    ),
  ]);

  if (profileResult.error || sellerResult.error) {
    return NextResponse.json(
      {
        error: "Failed to create provider profile",
        details: [profileResult.error?.message, sellerResult.error?.message].filter(Boolean),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
