import { Building2, Download } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { BusinessesWorklist } from "../_components/AdminSelectableTables";
import { getAdminBusinesses } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

export default async function AdminBusinessesPage() {
  const businesses = await getAdminBusinesses();

  return (
    <AdminShell
      title="Businesses"
      description="Review business registration numbers and documents before unlocking business job and shift posting."
      actions={
        <>
          <AdminButtonLink href="/admin/reports">
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
      <BusinessesWorklist businesses={businesses} />
    </AdminShell>
  );
}
