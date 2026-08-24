const DEFAULT_SUPABASE_URL = "https://egtpwmzzjvyptmswddip.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndHB3bXp6anZ5cHRtc3dkZGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MzYzMjMsImV4cCI6MjA4OTExMjMyM30.wzDknOo_ebsIhB9gqRJevvNtlDbM0q-JUgatqUbLXhA";
const DEFAULT_WEB_API_URL = "https://anyjob-mu.vercel.app";

function validHttpUrl(value: string | undefined, fallback: string) {
  const candidate = value?.trim().replace(/\/$/, "");
  if (!candidate) return fallback;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? candidate
      : fallback;
  } catch {
    return fallback;
  }
}

export const SUPABASE_URL = validHttpUrl(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  DEFAULT_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;

export const API_URL = validHttpUrl(
  process.env.EXPO_PUBLIC_WEB_API_URL,
  DEFAULT_WEB_API_URL,
);
