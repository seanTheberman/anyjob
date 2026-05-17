import { BadgeCheck, Download } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { ProvidersWorklist } from "../_components/AdminSelectableTables";
import { getAdminProviders } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
  const providers = await getAdminProviders();

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
          <AdminButtonLink href="/admin/kyc">
            <BadgeCheck className="h-4 w-4" />
            KYC queue
          </AdminButtonLink>
        </>
      }
    >
      <ProvidersWorklist providers={providers} />
    </AdminShell>
  );
}
