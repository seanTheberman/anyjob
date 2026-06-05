import { Suspense } from "react";
import { AdminJobsWorklist } from "../_components/AdminJobsWorklist";
import { getAdminJobs } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

async function JobsContent() {
  const jobs = await getAdminJobs();

  return <AdminJobsWorklist jobs={jobs} />;
}

export default function AdminJobsPage() {

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading jobs...</div>}>
        <JobsContent />
      </Suspense>
    </main>
  );
}
