import { Suspense } from "react";
import { BadgeCheck, FileWarning } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { KycWorklist } from "../_components/AdminSelectableTables";
import { getKycReviews } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

async function KycContent() {
  const reviews = await getKycReviews();

  return <KycWorklist reviews={reviews} />;
}

export default function AdminKycPage() {
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
        <KycContent />
      </Suspense>
    </AdminShell>
  );
}
