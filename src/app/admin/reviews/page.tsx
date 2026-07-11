import { Star } from "lucide-react";

import { AdminShell } from "../_components/AdminShell";
import { AdminReviewsManager } from "../_components/AdminReviewsManager";

export const dynamic = "force-dynamic";

export default function AdminReviewsPage() {
  return (
    <AdminShell
      title="Reviews"
      description="Inspect marketplace ratings from buyers, providers, contractors, and businesses. Remove deceptive or policy-violating reviews with an audit reason."
      actions={
        <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
          <Star className="h-4 w-4 text-yellow-500" />
          Review control
        </div>
      }
    >
      <AdminReviewsManager />
    </AdminShell>
  );
}
