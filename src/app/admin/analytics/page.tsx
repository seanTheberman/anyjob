import { Download, TrendingUp } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, StatCard } from "../_components/AdminPrimitives";
import { analytics } from "../_components/admin-data";

const analyticsStats = [
  { label: "Conversion", value: "18.7%", delta: "+2.1%", detail: "Searches that become requests" },
  { label: "Average response", value: "21 min", delta: "-4 min", detail: "Provider first response SLA" },
  { label: "Completion rate", value: "72.8%", delta: "+5.6%", detail: "Matched jobs completed" },
  { label: "Repeat clients", value: "36.4%", delta: "+3.8%", detail: "Clients booking again in 60 days" },
];

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
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analyticsStats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>
      <section className="mt-6">
        <AdminTable columns={["Metric", "Current", "Trend", "Health"]} rows={analytics} actionLabel="Inspect" />
      </section>
    </AdminShell>
  );
}
