import "server-only";

export async function syncReviewRatings(input: { userId?: string | null; reviewId?: string | null; all?: boolean }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, skipped: true, error: "Missing Supabase function environment" };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/sync-review-ratings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        user_id: input.userId || undefined,
        review_id: input.reviewId || undefined,
        all: input.all,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, skipped: false, error: payload.error || "Review rating sync failed" };
    }

    return { ok: true, skipped: false, payload };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      error: error instanceof Error ? error.message : "Review rating sync failed",
    };
  }
}
