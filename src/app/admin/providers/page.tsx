import { BadgeCheck, Download } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { providers } from "../_components/admin-data";

export default function AdminProvidersPage() {
  return (
    <AdminShell
      title="Providers"
      description="Manage seller verification, categories, coverage areas, ratings, service listings, suspensions, and document checks."
      actions={
        <>
          <AdminButtonLink href="/admin/reports">
            <Download className="h-4 w-4" />
            Export providers
          </AdminButtonLink>
          <AdminButtonLink href="/admin/settings">
            <BadgeCheck className="h-4 w-4" />
            KYC rules
          </AdminButtonLink>
        </>
      }
    >
      <Toolbar>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Approve selected</button>
        <button className="h-9 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50">Suspend</button>
      </Toolbar>
      <AdminTable columns={["Provider", "Primary service", "Verification", "Rating", "History"]} rows={providers} />
    </AdminShell>
  );
}
