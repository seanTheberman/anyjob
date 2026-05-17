import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: profileId } = await params;
  
  // Use service role key to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Try to get from buyers table first
    const { data: buyer } = await supabase
      .from("buyers")
      .select("*")
      .eq("id", profileId)
      .single();

    if (buyer) {
      return NextResponse.json(buyer);
    }

    // Try sellers table
    const { data: seller } = await supabase
      .from("sellers")
      .select("*")
      .eq("id", profileId)
      .single();

    if (seller) {
      return NextResponse.json(seller);
    }

    // Try eloo_profiles
    const { data: profile } = await supabase
      .from("eloo_profiles")
      .select("id, first_name, last_name")
      .eq("id", profileId)
      .single();

    if (profile) {
      return NextResponse.json(profile);
    }

    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
