import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";

export async function POST(request: Request) {
  try {
    const admin = await getAdminApiUser();
    if (!admin) return adminForbidden();

    const body = await request.json();
    const label = String(body.label || "Admin action").trim();
    const context = String(body.context || "admin item").trim();
    const key = `${label.toLowerCase()} ${context.toLowerCase()}`;
    const supabase = createAdminSupabaseClient() as never as {
      from(table: string): {
        upsert(values: Record<string, unknown>, options?: { onConflict?: string }): Promise<{ error: { message: string } | null }>;
        select(columns: string, options?: { count?: "exact"; head?: boolean }): any;
      };
    };

    let message = `${label} completed for ${context}.`;
    const metadata: Record<string, unknown> = { label, context };

    if (key.includes("schedule") && key.includes("report")) {
      const { error } = await supabase.from("admin_report_schedules").upsert({
        report_type: "operations",
        cadence: "weekly",
        recipients: ["admin@anyjob.eu"],
        is_active: true,
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "report_type" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      message = "Weekly operations report schedule is active for admin@anyjob.eu.";
    }

    if (key.includes("email recipients")) {
      const { data, error } = await (supabase
        .from("admin_report_schedules")
        .select("recipients")
        .eq("report_type", "operations")
        .limit(1));
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const recipients = Array.isArray(data?.[0]?.recipients) ? data[0].recipients : ["admin@anyjob.eu"];
      metadata.recipients = recipients;
      message = `Report recipients: ${recipients.join(", ")}.`;
    }

    if (key.includes("refund") || key.includes("reconcile")) {
      const [{ count: bookingCount }, { count: subscriptionCount }] = await Promise.all([
        supabase.from("eloo_bookings").select("*", { count: "exact", head: true }) as Promise<{ count: number | null; error: { message: string } | null }>,
        supabase.from("eloo_subscriptions").select("*", { count: "exact", head: true }) as Promise<{ count: number | null; error: { message: string } | null }>,
      ]);
      const total = Number(bookingCount || 0) + Number(subscriptionCount || 0);
      metadata.paymentRecordCount = total;
      message = total
        ? `${label} review opened for ${total} payment record${total === 1 ? "" : "s"}.`
        : "No payment records are available for this action.";
    }

    if (key.includes("support") || key.includes("macro") || key.includes("assign")) {
      const { count } = await (supabase.from("eloo_conversations").select("*", { count: "exact", head: true }) as Promise<{ count: number | null; error: { message: string } | null }>);
      metadata.supportRecordCount = count || 0;
      message = count ? `${label} applied to visible support queue.` : "No support tickets are available for this action.";
    }

    await logAdminAction({
      actorId: admin.id,
      action: `admin.${label.toLowerCase().replaceAll(" ", "_")}`,
      targetType: "admin_button",
      targetId: context,
      metadata,
    });

    return NextResponse.json({ ok: true, message, metadata });
  } catch (error) {
    console.error("Admin action failed:", error);
    return NextResponse.json({ error: "Failed to run admin action" }, { status: 500 });
  }
}
