import { Banknote, Download } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { payments } from "../_components/admin-data";

export default function AdminPaymentsPage() {
  return (
    <AdminShell
      title="Payments"
      description="Review booking tokens, refunds, provider payouts, subscriptions, failed charges, and settlement batches."
      actions={
        <>
          <AdminButtonLink href="/admin/reports">
            <Download className="h-4 w-4" />
            Export ledger
          </AdminButtonLink>
          <AdminButtonLink href="/admin/settings">
            <Banknote className="h-4 w-4" />
            Payout settings
          </AdminButtonLink>
        </>
      }
    >
      <Toolbar>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Release payout</button>
        <button className="h-9 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50">Issue refund</button>
      </Toolbar>
      <AdminTable columns={["Reference", "Type", "Amount", "Status"]} rows={payments} actionLabel="Open" />
    </AdminShell>
  );
}
