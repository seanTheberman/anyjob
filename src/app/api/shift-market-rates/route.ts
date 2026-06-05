import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get("niche");

    let query = supabase
      .from("shift_market_rates")
      .select("*")
      .eq("is_active", true)
      .order("role_title", { ascending: true });

    if (niche) {
      query = query.eq("niche", niche);
    }

    const { data: rates, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rates: rates || [] });
  } catch (error) {
    console.error("Market rate lookup failed:", error);
    return NextResponse.json({ error: "Failed to load market rates" }, { status: 500 });
  }
}
