import { BadgeCheck, Download } from "lucide-react";
import { Suspense } from "react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { ProvidersWorklist } from "../_components/AdminSelectableTables";
import { type AdminSearchParams, firstParam, paramIn } from "../_lib/admin-query";
import { getAdminProviders } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

const providerKycStatuses = ["all", "Approved", "Suspended", "Needs review", "Missing document", "Rejected"] as const;

async function ProvidersContent({ initialKyc, initialService, initialQuery }: { initialKyc: string; initialService: string; initialQuery: string }) {
  const providers = await getAdminProviders();

  return <ProvidersWorklist providers={providers} initialKyc={initialKyc} initialService={initialService} initialQuery={initialQuery} />;
}

function ProvidersFallback() {
  return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading providers...</div>;
}

export default async function AdminProvidersPage({ searchParams }: { searchParams?: AdminSearchParams }) {
  const params = (await searchParams) || {};
  const initialKyc = paramIn(firstParam(params, "kyc"), providerKycStatuses, "all");
  const initialService = firstParam(params, "service");
  const initialQuery = firstParam(params, "q", "");

  return (
    <AdminShell
      title="Providers"
      description="Manage seller verification, categories, coverage areas, ratings, service listings, suspensions, and document checks."
      actions={
        <>
          <AdminButtonLink href="/api/admin/export?kind=providers">
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
        <ProvidersContent initialKyc={initialKyc} initialService={initialService} initialQuery={initialQuery} />
      </Suspense>
    </AdminShell>
  );
}
