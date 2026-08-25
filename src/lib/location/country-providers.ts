import "server-only";

import { headers } from "next/headers";

import { getMarketplaceProviders } from "@/lib/real-providers";
import { countryCodeFromName, marketLocationFromHeaders } from "@/lib/location/market-location";

export async function getCountryProviderCards(categorySlug: string) {
  const requestHeaders = await headers();
  const marketCountry = marketLocationFromHeaders(requestHeaders).countryCode || "IE";
  return (await getMarketplaceProviders()).filter(
    (provider) =>
      provider.categorySlug === categorySlug &&
      countryCodeFromName(provider.country) === marketCountry,
  );
}
