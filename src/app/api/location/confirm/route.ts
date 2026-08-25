import { NextRequest, NextResponse } from "next/server";

import {
  MarketLocationError,
  persistUserMarketLocation,
  verifyMarketLocationToken,
} from "@/lib/location/market-location";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { token?: string };
    const token = body.token || request.cookies.get("anyjob_market_location")?.value;
    const location = verifyMarketLocationToken(request, token);
    await persistUserMarketLocation(user.id, location);
    return NextResponse.json({ ok: true, location });
  } catch (error) {
    if (error instanceof MarketLocationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Location could not be confirmed." }, { status: 500 });
  }
}
