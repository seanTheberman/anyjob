import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, ArrowRight, Download, Plus } from "lucide-react";
import { AdminShell } from "./_components/AdminShell";
import { AdminButtonLink, AdminTable, StatCard, StatusBadge } from "./_components/AdminPrimitives";
import { controlSummary } from "./_components/admin-data";
import { getAdminOverview } from "./_lib/admin-live-data";

export const dynamic = "force-dynamic";

async function OverviewContent() {
  const overview = await getAdminOverview();

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Trust and safety queue</h2>
            <Link href="/admin/reports" className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
              View reports <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {overview.riskQueue.length ? (
            <AdminTable columns={["Priority", "Issue", "Subject", "Status"]} rows={overview.riskQueue} actionLabel="Review" />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              No live trust or safety items need review.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-slate-950">Current admin control</h2>
          </div>
          <div className="mt-4 space-y-3">
            {controlSummary.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <Icon className="mt-0.5 h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-600">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Live activity</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {overview.activity.length ? overview.activity.map(([time, title, detail], index) => (
            <div key={`${time}-${title}-${index}`} className="grid gap-2 py-3 md:grid-cols-[80px_1fr_auto] md:items-center">
              <span className="text-sm font-medium text-slate-500">{time}</span>
              <div>
                <p className="text-sm font-medium text-slate-950">{title}</p>
                <p className="text-sm text-slate-600">{detail}</p>
              </div>
              <StatusBadge value="Logged" />
            </div>
          )) : (
            <p className="text-sm text-slate-600">No live booking, message, or notification activity found yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

function OverviewFallback() {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["Demand", "Supply", "Revenue", "Trust"].map((label) => (
          <div key={label} className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="mt-5 h-8 w-16 rounded bg-slate-100" />
            <div className="mt-4 h-3 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm" />
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm" />
      </section>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <AdminShell
      title="Marketplace overview"
      description="Monitor demand, supply, revenue, disputes, support load, and trust queues from one operations console."
      actions={
        <>
          <AdminButtonLink href="/api/admin/export?kind=profiles">
            <Download className="h-4 w-4" />
            Export report
          </AdminButtonLink>
          <AdminButtonLink href="/admin/settings">
            <Plus className="h-4 w-4" />
            Configure rules
          </AdminButtonLink>
        </>
      }
    >
      <Suspense fallback={<OverviewFallback />}>
        <OverviewContent />
      </Suspense>
    </AdminShell>
  );
}
