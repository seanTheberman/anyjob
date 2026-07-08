import "server-only";

type InvokeOptions = {
  functionName: string;
  payload: Record<string, unknown>;
  useServiceRole?: boolean;
};

export async function invokeEmailFunction({ functionName, payload, useServiceRole = true }: InvokeOptions) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = useServiceRole ? serviceRoleKey : anonKey;

  if (!supabaseUrl || !apiKey) {
    return { ok: false, error: "Missing Supabase function environment variables" };
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, status: response.status, error: body?.error || "Function call failed" };
    }

    return { ok: true, body };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Function call failed",
    };
  }
}

export async function notifyJobEvent(payload: Record<string, unknown>) {
  const result = await invokeEmailFunction({
    functionName: "job-notifications",
    payload: {
      tenantSlug: "default",
      ...payload,
    },
    useServiceRole: true,
  });

  if (!result.ok) {
    console.error("AnyJob email notification failed:", result);
  }

  return result;
}
