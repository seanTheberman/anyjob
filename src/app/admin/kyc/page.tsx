import { BadgeCheck, FileWarning } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { KycWorklist } from "../_components/AdminSelectableTables";
import { adminKycReviews } from "../_components/admin-data";

export default function AdminKycPage() {
  return (
    <AdminShell
      title="KYC verification"
      description="Review provider identity checks, insurance documents, expired files, rejected submissions, and payout eligibility."
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
      <KycWorklist reviews={adminKycReviews} />
    </AdminShell>
  );
}
