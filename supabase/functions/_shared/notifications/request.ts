import { handleCors, jsonResponse } from "../cors.ts";
import { requireServiceRole } from "../supabase-admin.ts";
import { cleanText } from "../tokens.ts";
import { getTenantContext, type TenantContext } from "../tenant-email.ts";
import type { AnyRow } from "./core.ts";

type NotificationHandler = (input: {
  action: string;
  body: AnyRow;
  context: TenantContext;
}) => Promise<unknown>;

export function serveNotificationFunction(name: string, allowedActions: string[], handler: NotificationHandler) {
  Deno.serve(async (req) => {
    const cors = handleCors(req);
    if (cors) return cors;
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
    if (!requireServiceRole(req)) return jsonResponse({ error: "Unauthorized" }, 401);

    try {
      const body = await req.json().catch(() => ({}));
      const action = cleanText(body.action, allowedActions.length === 1 ? allowedActions[0] : "");
      const tenantSlug = cleanText(body.tenantSlug, "default");

      if (!allowedActions.includes(action)) {
        return jsonResponse({ error: `Unsupported action for ${name}`, allowedActions }, 400);
      }

      const context = await getTenantContext(tenantSlug);
      return jsonResponse(await handler({ action, body, context }));
    } catch (error) {
      console.error(`${name} failed`, error);
      return jsonResponse({ error: error instanceof Error ? error.message : "Notification processing failed" }, 500);
    }
  });
}
