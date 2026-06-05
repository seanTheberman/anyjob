import { Download, TrendingUp } from "lucide-react";
import { Suspense } from "react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, StatCard } from "../_components/AdminPrimitives";
import { getAdminAnalytics } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

async function AnalyticsContent() {
  const analytics = await getAdminAnalytics();

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analytics.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>
      <section className="mt-6">
        <AdminTable columns={["Metric", "Current", "Trend", "Health"]} rows={analytics.rows} actionLabel="Inspect" />
      </section>
    </>
  );
}

export default function AdminAnalyticsPage() {

  return (
    <AdminShell
      title="Analytics"
      description="Track marketplace health: funnel conversion, supply coverage, booking completion, response times, and dispute trends."
      actions={
        <>
          <AdminButtonLink href="/admin/reports">
            <Download className="h-4 w-4" />
            Export analytics
          </AdminButtonLink>
          <AdminButtonLink href="/admin/settings">
            <TrendingUp className="h-4 w-4" />
            Set targets
          </AdminButtonLink>
        </>
      }
    >
      <Suspense fallback={<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading analytics...</div>}>
        <AnalyticsContent />
      </Suspense>
    </AdminShell>
  );
}
