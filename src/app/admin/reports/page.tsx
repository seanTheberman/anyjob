import { FileDown, Plus } from "lucide-react";
import { AdminActionButton } from "../_components/AdminActionButton";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { getAdminReports } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await getAdminReports();

  return (
    <AdminShell
      title="Reports"
      description="Schedule and export marketplace, trust, account limitation, support, and category supply reports for operations review."
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
        <AdminActionButton label="Schedule" context="report delivery" />
        <AdminActionButton label="Email recipients" context="report distribution" />
      </Toolbar>
      <AdminTable columns={["Report", "Format", "Cadence", "Status"]} rows={reports} actionLabel="Manage" />
    </AdminShell>
  );
}
