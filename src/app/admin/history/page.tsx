import { History, Search } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { activity } from "../_components/admin-data";

const rows = activity.map(([time, event, detail]) => [time, event, detail, "Logged", "View"]);

export default function AdminHistoryPage() {
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
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Admin actions</button>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Account events</button>
      </Toolbar>
      <AdminTable columns={["Time", "Event", "Detail", "Status"]} rows={rows} actionLabel="Open" />
    </AdminShell>
  );
}
