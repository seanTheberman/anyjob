import { Save, ShieldCheck } from "lucide-react";
import { AdminActionButton } from "../_components/AdminActionButton";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { settingsGroups } from "../_components/admin-data";

export default function AdminSettingsPage() {
  return (
    <AdminShell
      title="Settings"
      description="Configure marketplace rules, trust requirements, notification policy, payments, categories, and operational thresholds."
      actions={
        <>
          <AdminButtonLink href="/admin/history">
            <ShieldCheck className="h-4 w-4" />
            Audit changes
          </AdminButtonLink>
          <span className="inline-flex h-9 items-center gap-1.5">
            <Save className="h-4 w-4" />
            <AdminActionButton label="Save settings" context="marketplace configuration" variant="primary" />
          </span>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-3">
        {settingsGroups.map((group) => (
          <section key={group.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">{group.title}</h2>
            <div className="mt-4 space-y-4">
              {group.items.map((item) => (
                <label key={item} className="block">
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                  <div className="mt-2 flex gap-2">
                    <input className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" defaultValue="Default policy" />
                    <AdminActionButton label="Edit" context={item} />
                  </div>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
