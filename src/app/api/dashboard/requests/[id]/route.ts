import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LooseRow = Record<string, unknown>;
type QueryError = { message: string };
type SingleQueryResponse<T> = { data: T | null; error: QueryError | null };
type ListQueryResponse<T> = { data: T[] | null; error: QueryError | null };
type SelectQuery<T extends LooseRow> = {
  eq(column: string, value: string): SelectQuery<T>;
  order(column: string, options?: { ascending?: boolean }): Promise<ListQueryResponse<T>>;
  maybeSingle(): Promise<SingleQueryResponse<T>>;
};
type AdminQueryClient = {
  from(table: string): {
    select(columns: string): SelectQuery<LooseRow>;
  };
};

async function getUserRole(admin: AdminQueryClient, userId: string) {
  const [elooProfile, userProfile] = await Promise.all([
    admin.from("eloo_profiles").select("role").eq("id", userId).maybeSingle(),
    admin.from("user_profiles").select("role").eq("id", userId).maybeSingle(),
  ]);

  return String(elooProfile.data?.role || userProfile.data?.role || "").toLowerCase();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const admin = createAdminSupabaseClient() as unknown as AdminQueryClient;

    const { data: inquiry, error: inquiryError } = await admin
      .from("service_inquiries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (inquiryError) {
      return NextResponse.json({ error: inquiryError.message }, { status: 500 });
    }

    if (!inquiry) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const role = await getUserRole(admin, user.id);
    const ownsRequest = String((inquiry as LooseRow).user_id || "") === user.id;
    if (!ownsRequest && role !== "admin") {
      return NextResponse.json({ error: "You do not have permission to view this request" }, { status: 403 });
    }

    const { data: workImages, error: imageError } = await admin
      .from("user_images")
      .select("id,image_url,public_id,image_type,title,description")
      .eq("inquiry_id", id)
      .eq("image_type", "work_image")
      .order("created_at", { ascending: true });

    if (imageError) {
      return NextResponse.json({ error: imageError.message }, { status: 500 });
    }

    return NextResponse.json({
      inquiry,
      workImages: workImages || [],
    });
  } catch (error) {
    console.error("Request detail lookup failed:", error);
    return NextResponse.json({ error: "Failed to load request details" }, { status: 500 });
  }
}
