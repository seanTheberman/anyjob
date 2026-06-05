import { BadgeCheck, Download } from "lucide-react";
import { Suspense } from "react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { ProvidersWorklist } from "../_components/AdminSelectableTables";
import { getAdminProviders } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

async function ProvidersContent() {
  const providers = await getAdminProviders();

  return <ProvidersWorklist providers={providers} />;
}

function ProvidersFallback() {
  return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading providers...</div>;
}

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
          <AdminButtonLink href="/admin/kyc">
            <BadgeCheck className="h-4 w-4" />
            KYC queue
          </AdminButtonLink>
        </>
      }
    >
      <Suspense fallback={<ProvidersFallback />}>
        <ProvidersContent />
      </Suspense>
    </AdminShell>
  );
}
