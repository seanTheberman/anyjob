import { History, Search } from "lucide-react";
import { AdminActionButton } from "../_components/AdminActionButton";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { getAdminHistory } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

export default async function AdminHistoryPage() {
  const rows = await getAdminHistory();

  return (
    <AdminShell
      title="History"
      description="Audit admin actions, user history, provider moderation, payment events, support events, and trust-rule triggers."
      actions={
        <>
          <AdminButtonLink href="/admin/reports">
            <History className="h-4 w-4" />
            Export audit log
          </AdminButtonLink>
          <AdminButtonLink href="/admin/users">
            <Search className="h-4 w-4" />
            Find account
          </AdminButtonLink>
        </>
      }
    >
      <Toolbar>
        <AdminActionButton label="Admin actions" context="history filter" />
        <AdminActionButton label="Account events" context="history filter" />
      </Toolbar>
      {rows.length ? (
        <AdminTable columns={["Time", "Event", "Detail", "Status"]} rows={rows} actionLabel="Open" />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No live audit-relevant booking, message, or notification events found.
        </div>
      )}
    </AdminShell>
  );
}
