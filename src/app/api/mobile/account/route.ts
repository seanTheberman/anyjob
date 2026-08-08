import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
async function currentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminSupabaseClient() as never as {
    from(table: string): any;
  };
  const [profile, buyer, seller, business] = await Promise.all([
    admin.from("eloo_profiles").select("*").eq("id", user.id).maybeSingle(),
    admin.from("buyers").select("*").eq("id", user.id).maybeSingle(),
    admin.from("sellers").select("*").eq("id", user.id).maybeSingle(),
    admin
      .from("business_profiles")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile: profile.data,
    buyer: buyer.data,
    seller: seller.data,
    business: business.data,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const firstName = text(body.firstName);
  const lastName = text(body.lastName);
  const email = text(body.email) || user.email || "";
  const phone = text(body.phone);
  const city = text(body.city);
  const postalCode = text(body.postalCode);
  const address = text(body.address);
  const profileImageUrl = text(body.profileImageUrl);
  if (!firstName || !lastName)
    return NextResponse.json(
      { error: "First and last name are required." },
      { status: 400 },
    );
  const admin = createAdminSupabaseClient() as never as {
    from(table: string): any;
  };
  const now = new Date().toISOString();
  const results = await Promise.all([
    admin
      .from("eloo_profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        city,
        postal_code: postalCode,
        avatar_url: profileImageUrl || null,
        updated_at: now,
      })
      .eq("id", user.id),
    admin
      .from("buyers")
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        city,
        postal_code: postalCode,
        address,
        profile_image_url: profileImageUrl || null,
        updated_at: now,
      })
      .eq("id", user.id),
  ]);
  const error = results.find((result) => result.error)?.error;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
