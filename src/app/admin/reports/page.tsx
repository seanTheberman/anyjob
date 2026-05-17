import { FileDown, Plus } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { getAdminReports } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await getAdminReports();

  return (
    <AdminShell
      title="Reports"
      description="Schedule and export marketplace, payout, trust, support, and category supply reports for operations review."
      actions={
        <>
          <AdminButtonLink href="/admin/reports">
            <FileDown className="h-4 w-4" />
            Download latest
          </AdminButtonLink>
          <AdminButtonLink href="/admin/settings">
            <Plus className="h-4 w-4" />
            New report
          </AdminButtonLink>
        </>
      }
    >
      <Toolbar>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Schedule</button>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Email recipients</button>
      </Toolbar>
      <AdminTable columns={["Report", "Format", "Cadence", "Status"]} rows={reports} actionLabel="Manage" />
    </AdminShell>
  );
}
