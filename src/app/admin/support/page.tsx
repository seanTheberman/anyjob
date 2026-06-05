import { Headphones, MessageSquare } from "lucide-react";
import { AdminActionButton } from "../_components/AdminActionButton";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { getAdminSupport } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const supportTickets = await getAdminSupport();

  return (
    <AdminShell
      title="Support"
      description="Triage client and provider tickets, refund requests, document problems, booking changes, and SLA breaches."
      actions={
        <>
          <AdminButtonLink href="/admin/reports">
            <Headphones className="h-4 w-4" />
            Support report
          </AdminButtonLink>
          <AdminButtonLink href="/admin/settings">
            <MessageSquare className="h-4 w-4" />
            Macros
          </AdminButtonLink>
        </>
      }
    >
      <Toolbar>
        <AdminActionButton label="Assign selected" context="visible support tickets" />
        <AdminActionButton label="Send macro" context="visible support tickets" />
      </Toolbar>
      {supportTickets.length ? (
        <AdminTable columns={["Ticket", "Requester", "Topic", "Priority", "Status"]} rows={supportTickets} actionLabel="Reply" />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No live notification or conversation support items found.
        </div>
      )}
    </AdminShell>
  );
}
