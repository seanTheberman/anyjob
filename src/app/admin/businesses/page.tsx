import { Suspense } from "react";
import { Building2, Download } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { BusinessesWorklist } from "../_components/AdminSelectableTables";
import { getAdminBusinesses } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

async function BusinessesContent() {
  const businesses = await getAdminBusinesses();

  return <BusinessesWorklist businesses={businesses} />;
}

export default function AdminBusinessesPage() {
  return (
    <AdminShell
      title="Businesses"
      description="Review business registration numbers and documents before unlocking business job and shift posting."
      actions={
        <>
          <AdminButtonLink href="/api/admin/export?kind=businesses">
            <Download className="h-4 w-4" />
            Export businesses
          </AdminButtonLink>
          <AdminButtonLink href="/register-business">
            <Building2 className="h-4 w-4" />
            Register test business
          </AdminButtonLink>
        </>
      }
    >
      <Suspense fallback={<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading businesses...</div>}>
        <BusinessesContent />
      </Suspense>
    </AdminShell>
  );
}
