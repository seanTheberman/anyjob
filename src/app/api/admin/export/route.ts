import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";

const exportMap: Record<string, { table: string; columns: string }> = {
  profiles: { table: "eloo_profiles", columns: "id,email,role,first_name,last_name,city,created_at,updated_at" },
  users: { table: "eloo_profiles", columns: "id,email,role,first_name,last_name,city,created_at,updated_at" },
  sellers: { table: "sellers", columns: "id,email,first_name,last_name,service_category,status,city,rating,total_jobs,created_at,updated_at" },
  providers: { table: "sellers", columns: "id,email,first_name,last_name,service_category,status,city,rating,total_jobs,created_at,updated_at" },
  service_inquiries: { table: "service_inquiries", columns: "id,email,phone,first_name,last_name,category_slug,subcategory_slug,status,created_at" },
  jobs: { table: "service_inquiries", columns: "id,email,phone,first_name,last_name,category_slug,subcategory_slug,status,created_at" },
  bookings: { table: "eloo_bookings", columns: "id,client_id,provider_id,status,total_price,is_paid,created_at,updated_at" },
  businesses: { table: "business_profiles", columns: "id,business_name,registration_number,industry,contact_email,city,status,created_at,updated_at" },
  payments: { table: "eloo_bookings", columns: "id,client_id,provider_id,status,total_price,is_paid,created_at,updated_at" },
  reviews: { table: "eloo_reviews", columns: "id,booking_id,reviewer_id,reviewee_id,rating,is_public,created_at" },
  history: { table: "admin_action_logs", columns: "id,actor_id,action,target_type,target_id,metadata,created_at" },
  actions: { table: "admin_action_logs", columns: "id,actor_id,action,target_type,target_id,metadata,created_at" },
};

function csvEscape(value: unknown) {
  const text = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET(request: Request) {
  try {
    const admin = await getAdminApiUser();
    if (!admin) return adminForbidden();

    const url = new URL(request.url);
    const kind = (url.searchParams.get("kind") || "profiles").toLowerCase();
    const config = exportMap[kind] || exportMap.profiles;
    const supabase = createAdminSupabaseClient() as never as {
      from(table: string): {
        select(columns: string): {
          limit(count: number): Promise<{ data: Array<Record<string, unknown>> | null; error: { message: string } | null }>;
        };
      };
    };
    const { data, error } = await supabase.from(config.table).select(config.columns).limit(1000);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const columns = config.columns.split(",");
    const csv = [
      columns.join(","),
      ...(data || []).map((row) => columns.map((column) => csvEscape((row as Record<string, unknown>)[column])).join(",")),
    ].join("\n");

    await logAdminAction({
      actorId: admin.id,
      action: "export.download",
      targetType: config.table,
      targetId: kind,
      metadata: { rowCount: data?.length || 0 },
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"anyjob-${kind}-${new Date().toISOString().slice(0, 10)}.csv\"`,
      },
    });
  } catch (error) {
    console.error("Admin export failed:", error);
    return NextResponse.json({ error: "Failed to export admin data" }, { status: 500 });
  }
}
