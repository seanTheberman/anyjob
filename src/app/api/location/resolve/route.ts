import { NextRequest, NextResponse } from "next/server";

import {
  MarketLocationError,
  persistUserMarketLocation,
  resolveMarketLocation,
  signMarketLocation,
} from "@/lib/location/market-location";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const location = await resolveMarketLocation(request, input);
    const token = signMarketLocation(location);
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await persistUserMarketLocation(user.id, location);

    const response = NextResponse.json({ location, token });
    response.cookies.set("anyjob_market_location", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    if (error instanceof MarketLocationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Market location resolution failed:", error);
    return NextResponse.json({ error: "Location could not be verified." }, { status: 500 });
  }
}
