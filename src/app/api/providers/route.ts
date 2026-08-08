import { NextResponse } from "next/server";
import { getMarketplaceProviders } from "@/lib/real-providers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const allProviders = await getMarketplaceProviders();
  const providers = category ? allProviders.filter((provider) => provider.categorySlug === category) : allProviders;

  return NextResponse.json({ providers });
}
