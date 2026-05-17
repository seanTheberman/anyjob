import { Download, SlidersHorizontal } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { getAdminJobs } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const jobs = await getAdminJobs();

  return (
    <AdminShell
      title="Jobs"
      description="Track open requests, provider matches, bids, completions, disputes, and manual intervention queues."
      actions={
        <>
          <AdminButtonLink href="/admin/reports">
            <Download className="h-4 w-4" />
            Export jobs
          </AdminButtonLink>
          <AdminButtonLink href="/admin/settings">
            <SlidersHorizontal className="h-4 w-4" />
            Matching rules
          </AdminButtonLink>
        </>
      }
    >
      <Toolbar>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Assign provider</button>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Escalate dispute</button>
      </Toolbar>
      {jobs.length ? (
        <AdminTable columns={["Job ID", "Service", "Client", "Provider", "Status"]} rows={jobs} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No live service inquiries or bookings found.
        </div>
      )}
    </AdminShell>
  );
}
