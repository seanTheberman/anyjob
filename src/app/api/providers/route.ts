import { NextResponse } from "next/server";
import { getProviderCards } from "@/lib/real-providers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const providers = await getProviderCards(category);

  return NextResponse.json({ providers });
}
