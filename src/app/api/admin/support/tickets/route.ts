import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { adminForbidden, getAdminApiUser, logAdminAction } from "@/lib/auth/admin-api";
import {
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
  mapSupportTicketRow,
  sanitizeSupportOption,
} from "@/lib/support/tickets";

type AdminClient = { from(table: string): any };
type AnyRecord = Record<string, unknown>;

const ticketSelect = `
  *,
  support_ticket_messages (
    id,
    ticket_id,
    sender_role,
    body,
    internal_note,
    created_at
  )
`;

function cleanString(value: unknown, max = 3000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await getAdminApiUser();
    if (!adminUser) return adminForbidden();

    const body = await request.json();
    const ticketId = cleanString(body.ticketId, 80);
    const response = cleanString(body.response, 5000);
    const internalNote = body.internalNote === true;
    const assignToMe = body.assignToMe === true;
    const hasPriority = typeof body.priority === "string";
    const hasStatus = typeof body.status === "string";
    const priority = sanitizeSupportOption(body.priority, SUPPORT_PRIORITIES, "normal");
    const status = sanitizeSupportOption(body.status, SUPPORT_STATUSES, "open");

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket id is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const update: Record<string, unknown> = { updated_at: now };
    if (hasPriority) update.priority = priority;
    if (hasStatus) {
      update.status = status;
      update.resolved_at = status === "resolved" || status === "closed" ? now : null;
    }
    if (assignToMe) update.assigned_admin_id = adminUser.id;
    if (response) update.last_admin_response_at = now;

    const admin = createAdminSupabaseClient() as never as AdminClient;
    if (Object.keys(update).length > 1) {
      const { error: updateError } = await admin.from("support_tickets").update(update).eq("id", ticketId);
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (response) {
      const { error: messageError } = await admin.from("support_ticket_messages").insert({
        ticket_id: ticketId,
        sender_user_id: adminUser.id,
        sender_role: "admin",
        body: response,
        internal_note: internalNote,
      });
      if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });
    }

    const { data: ticket, error: ticketError } = await admin.from("support_tickets").select(ticketSelect).eq("id", ticketId).single();
    if (ticketError) return NextResponse.json({ error: ticketError.message }, { status: 500 });

    await logAdminAction({
      actorId: adminUser.id,
      action: "support.ticket_update",
      targetType: "support_ticket",
      targetId: ticketId,
      metadata: {
        status: hasStatus ? status : undefined,
        priority: hasPriority ? priority : undefined,
        replied: Boolean(response),
        internalNote,
        assignToMe,
      },
    });

    return NextResponse.json({ ticket: mapSupportTicketRow(ticket as AnyRecord) });
  } catch (error) {
    console.error("Admin support ticket update failed:", error);
    return NextResponse.json({ error: "Failed to update support ticket" }, { status: 500 });
  }
}
