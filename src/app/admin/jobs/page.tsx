import { Suspense } from "react";
import { AdminJobsWorklist, type JobTab } from "../_components/AdminJobsWorklist";
import { type AdminSearchParams, firstParam, paramIn } from "../_lib/admin-query";
import { getAdminJobs } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

const jobTabs = ["pending_review", "live", "expired", "awaiting_buyer", "no_quotes", "completed", "cancelled", "all"] as const satisfies readonly JobTab[];

async function JobsContent({ initialTab, initialCounty, initialQuery }: { initialTab: JobTab; initialCounty: string; initialQuery: string }) {
  const jobs = await getAdminJobs();

  return <AdminJobsWorklist jobs={jobs} initialTab={initialTab} initialCounty={initialCounty} initialQuery={initialQuery} />;
}

export default async function AdminJobsPage({ searchParams }: { searchParams?: AdminSearchParams }) {
  const params = (await searchParams) || {};
  const initialTab = paramIn(firstParam(params, "tab"), jobTabs, "pending_review");
  const initialCounty = firstParam(params, "county");
  const initialQuery = firstParam(params, "q", "");

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading jobs...</div>}>
        <JobsContent initialTab={initialTab} initialCounty={initialCounty} initialQuery={initialQuery} />
      </Suspense>
    </main>
  );
}
