import { Suspense } from "react";
import { Headphones, MessageSquare } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { AdminSupportTickets } from "../_components/AdminSupportTickets";
import { getAdminSupport } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

async function SupportContent() {
  const supportTickets = await getAdminSupport();

  return <AdminSupportTickets tickets={supportTickets} />;
}

function SupportFallback() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <AdminShell
      title="Support"
      description="Triage client and provider tickets, refund requests, document problems, booking changes, and SLA breaches."
      actions={
        <>
          <AdminButtonLink href="/api/admin/export?kind=history">
            <Headphones className="h-4 w-4" />
            Support report
          </AdminButtonLink>
          <AdminButtonLink href="/admin/settings">
            <MessageSquare className="h-4 w-4" />
            Macros
          </AdminButtonLink>
        </>
      }
    >
      <Suspense fallback={<SupportFallback />}>
        <SupportContent />
      </Suspense>
    </AdminShell>
  );
}
