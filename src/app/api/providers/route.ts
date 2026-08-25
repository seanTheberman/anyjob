import { NextResponse } from "next/server";
import { getMarketplaceProviders } from "@/lib/real-providers";
import { countryCodeFromName, viewerCountryCode } from "@/lib/location/market-location";
import { getSellerServiceAreas, serviceAreaMatches, serviceAreasForDisplay, viewerServiceLocation } from "@/lib/location/service-areas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFastAuthUser } from "@/lib/auth/fast-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const auth = await createServerSupabaseClient();
  const viewer = await getFastAuthUser(auth);
  const marketCountry = await viewerCountryCode(request, viewer?.id);
  const viewerLocation = await viewerServiceLocation(request, viewer?.id);
  const allProviders = await getMarketplaceProviders();
  const visibleProviders = allProviders.filter((provider) =>
    countryCodeFromName(provider.country) === marketCountry &&
    (!category || provider.categorySlug === category)
  );
  const areas = await getSellerServiceAreas(visibleProviders.map((provider) => provider.id));
  const providers = visibleProviders.map((provider) => {
    const serviceAreas = areas.get(provider.id) || [];
    return {
      ...provider,
      serviceAreas: serviceAreasForDisplay(serviceAreas),
      worksInViewerArea: serviceAreaMatches(serviceAreas, viewerLocation),
      searchText: `${provider.searchText} ${serviceAreas.map((area) => area.label).join(" ")}`.toLowerCase(),
    };
  });

  return NextResponse.json({ providers });
}
