import Link from "next/link";
import { AlertTriangle, ArrowRight, Download, Plus } from "lucide-react";
import { AdminShell } from "./_components/AdminShell";
import { AdminButtonLink, AdminTable, StatCard, StatusBadge } from "./_components/AdminPrimitives";
import { activity, controlSummary, metrics, riskQueue } from "./_components/admin-data";

export default function AdminDashboard() {
  return (
    <AdminShell
      title="Marketplace overview"
      description="Monitor demand, supply, revenue, disputes, support load, and trust queues from one operations console."
      actions={
        <>
          <AdminButtonLink href="/admin/reports">
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
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
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
          <AdminTable columns={["Priority", "Issue", "Subject", "Status"]} rows={riskQueue} actionLabel="Review" />
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
          {activity.map(([time, title, detail]) => (
            <div key={`${time}-${title}`} className="grid gap-2 py-3 md:grid-cols-[80px_1fr_auto] md:items-center">
              <span className="text-sm font-medium text-slate-500">{time}</span>
              <div>
                <p className="text-sm font-medium text-slate-950">{title}</p>
                <p className="text-sm text-slate-600">{detail}</p>
              </div>
              <StatusBadge value="Logged" />
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
