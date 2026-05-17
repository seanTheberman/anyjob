import { createClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category_slug");

    let query = supabase
      .from("service_questions")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (categorySlug) {
      query = query.eq("category_slug", categorySlug);
    }

    const { data: questions, error } = await query;

    if (error) throw error;

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
