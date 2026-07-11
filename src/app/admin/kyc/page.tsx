import { Suspense } from "react";
import { BadgeCheck, FileWarning } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { KycWorklist } from "../_components/AdminSelectableTables";
import { type AdminSearchParams, firstParam, paramIn } from "../_lib/admin-query";
import { getKycReviews } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

const kycStatuses = ["all", "Needs review", "Missing document", "Rejected", "Approved"] as const;
const kycPriorities = ["all", "High", "Medium", "Low"] as const;

async function KycContent({ initialStatus, initialPriority, initialQuery }: { initialStatus: string; initialPriority: string; initialQuery: string }) {
  const reviews = await getKycReviews();

  return <KycWorklist reviews={reviews} initialStatus={initialStatus} initialPriority={initialPriority} initialQuery={initialQuery} />;
}

export default async function AdminKycPage({ searchParams }: { searchParams?: AdminSearchParams }) {
  const params = (await searchParams) || {};
  const initialStatus = paramIn(firstParam(params, "status"), kycStatuses, "all");
  const initialPriority = paramIn(firstParam(params, "priority"), kycPriorities, "all");
  const initialQuery = firstParam(params, "q", "");

  return (
    <AdminShell
      title="KYC verification"
      description="Review provider identity checks, selfie video, insurance documents, rejected submissions, and account limitations."
      actions={
        <>
          <AdminButtonLink href="/admin/providers">
            <BadgeCheck className="h-4 w-4" />
            Provider list
          </AdminButtonLink>
          <AdminButtonLink href="/admin/settings">
            <FileWarning className="h-4 w-4" />
            KYC policy
          </AdminButtonLink>
        </>
      }
    >
      <Suspense fallback={<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading KYC queue...</div>}>
        <KycContent initialStatus={initialStatus} initialPriority={initialPriority} initialQuery={initialQuery} />
      </Suspense>
    </AdminShell>
  );
}
