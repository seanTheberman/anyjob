import { BadgeCheck, FileWarning } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { kycReviews } from "../_components/admin-data";

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
      <Toolbar>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Approve selected</button>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Request documents</button>
        <button className="h-9 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50">Reject selected</button>
      </Toolbar>
      <AdminTable columns={["Provider", "Issue", "Document", "Priority", "Status"]} rows={kycReviews} actionLabel="Review" />
    </AdminShell>
  );
}
