import { Headphones, MessageSquare } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { supportTickets } from "../_components/admin-data";

export default function AdminSupportPage() {
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
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Assign selected</button>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Send macro</button>
      </Toolbar>
      <AdminTable columns={["Ticket", "Requester", "Topic", "Priority", "Status"]} rows={supportTickets} actionLabel="Reply" />
    </AdminShell>
  );
}
