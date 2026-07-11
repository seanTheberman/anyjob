import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

type FastAuthUser = {
  id: string;
  email: string | null;
  user: User | null;
};

function stringClaim(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function getFastAuthUser(supabase: Pick<SupabaseClient, "auth">): Promise<FastAuthUser | null> {
  const sessionResult = await supabase.auth.getSession().catch(() => null);
  const session = sessionResult?.data?.session;

  if (!session?.access_token) return null;

  const claimsResult = await supabase.auth.getClaims().catch(() => null);
  const claims = claimsResult?.data?.claims as Record<string, unknown> | undefined;
  const id = stringClaim(claims?.sub);

  if (id) {
    return {
      id,
      email: stringClaim(claims?.email) || session.user.email || null,
      user: session.user,
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email || null,
    user,
  };
}
