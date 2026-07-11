import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LooseAdminClient = {
  from(table: string): any;
  auth: {
    admin: {
      updateUserById(id: string, attributes: { password?: string }): Promise<{ error: { message: string } | null }>;
    };
  };
};

async function currentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) return null;
  return user;
}

function publicSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    account: {
      id: user.id,
      email: user.email,
      emailConfirmed: Boolean(user.email_confirmed_at),
      lastSignInAt: user.last_sign_in_at || null,
      createdAt: user.created_at || null,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current password and new password are required." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters long." }, { status: 400 });
  }

  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "Choose a new password that is different from the current password." }, { status: 400 });
  }

  const verifier = publicSupabaseClient();
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (verifyError) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const admin = createAdminSupabaseClient() as never as LooseAdminClient;
  const { error: authUpdateError } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (authUpdateError) {
    return NextResponse.json({ error: authUpdateError.message || "Password could not be updated." }, { status: 500 });
  }

  const { data: tenant } = await admin.from("tenants").select("id").eq("slug", "default").maybeSingle();
  if (tenant?.id) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const { error: customAuthError } = await admin
      .from("custom_auth_users")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenant.id)
      .eq("email", user.email!.toLowerCase());

    if (customAuthError) {
      console.error("Custom auth password mirror update failed:", customAuthError);
    }
  }

  return NextResponse.json({ ok: true, message: "Password updated." });
}
