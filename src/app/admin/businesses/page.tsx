import { Suspense } from "react";
import { Building2, Download } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { BusinessesWorklist } from "../_components/AdminSelectableTables";
import { type AdminSearchParams, firstParam, paramIn } from "../_lib/admin-query";
import { getAdminBusinesses } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

const businessStatuses = ["all", "pending", "approved", "rejected", "suspended"] as const;
const businessKinds = ["all", "hiring", "contractor"] as const;

async function BusinessesContent({ initialStatus, initialKind, initialQuery }: { initialStatus: string; initialKind: string; initialQuery: string }) {
  const businesses = await getAdminBusinesses();

  return <BusinessesWorklist businesses={businesses} initialStatus={initialStatus} initialKind={initialKind} initialQuery={initialQuery} />;
}

export default async function AdminBusinessesPage({ searchParams }: { searchParams?: AdminSearchParams }) {
  const params = (await searchParams) || {};
  const initialStatus = paramIn(firstParam(params, "status"), businessStatuses, "all");
  const initialKind = paramIn(firstParam(params, "kind"), businessKinds, "all");
  const initialQuery = firstParam(params, "q", "");

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
        <BusinessesContent initialStatus={initialStatus} initialKind={initialKind} initialQuery={initialQuery} />
      </Suspense>
    </AdminShell>
  );
}
