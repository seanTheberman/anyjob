import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function total(entries: Array<{ amount?: number | string | null; status?: string | null }>, status: string) {
  return entries
    .filter((entry) => entry.status === status)
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient() as never as { from: (table: string) => any };
    const { data: entries, error: entriesError } = await admin
      .from("provider_wallet_entries")
      .select("*")
      .eq("provider_user_id", user.id)
      .order("created_at", { ascending: false });

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    const walletEntries = entries || [];
    return NextResponse.json({
      entries: walletEntries,
      totals: {
        pending: total(walletEntries, "pending"),
        available: total(walletEntries, "available"),
        paidOut: total(walletEntries, "paid_out"),
      },
    });
  } catch (error) {
    console.error("Provider wallet lookup failed:", error);
    return NextResponse.json({ error: "Failed to load wallet" }, { status: 500 });
  }
}
