import { Suspense } from "react";
import { Banknote, Download } from "lucide-react";
import { AdminActionButton } from "../_components/AdminActionButton";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { getAdminPayments } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

async function PaymentsContent() {
  const payments = await getAdminPayments();

  return payments.length ? (
    <AdminTable columns={["Reference", "Type", "Amount", "Status"]} rows={payments} actionLabel="Open" />
  ) : (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
      No test payment ledger entries found yet. Accepted bids, shift escrow payments, and plan subscriptions will appear here.
    </div>
  );
}

export default function AdminPaymentsPage() {
  return (
    <AdminShell
      title="Payments"
      description="Review booking tokens, refunds, subscriptions, failed charges, and direct-payment reconciliation."
      actions={
        <>
          <AdminButtonLink href="/api/admin/export?kind=payments">
            <Download className="h-4 w-4" />
            Export ledger
          </AdminButtonLink>
          <AdminButtonLink href="/admin/settings">
            <Banknote className="h-4 w-4" />
            Payment settings
          </AdminButtonLink>
        </>
      }
    >
      <Toolbar>
        <AdminActionButton label="Reconcile token" context="visible payments" />
        <AdminActionButton label="Issue refund" context="visible payments" />
      </Toolbar>
      <Suspense fallback={<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading payments...</div>}>
        <PaymentsContent />
      </Suspense>
    </AdminShell>
  );
}
