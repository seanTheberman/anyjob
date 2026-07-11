export const PROVIDER_QUOTE_TERMS_VERSION = "provider_quote_terms_v1";
export const PROVIDER_QUOTE_TERMS_PATH = "/pricing#terms";

export function providerQuoteTermsUrl(appUrl?: string | null) {
  const fallbackPath = PROVIDER_QUOTE_TERMS_PATH;
  if (!appUrl) return fallbackPath;
  return `${appUrl.replace(/\/$/, "")}${fallbackPath}`;
}
