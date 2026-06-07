"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, CheckCircle2, Clock3, Download, Eye, FileQuestion, FileText, MapPin, RefreshCw, Search, SlidersHorizontal, TimerReset, Trash2, XCircle } from "lucide-react";

import type { AdminLiveJob } from "./admin-data";
import { getJobStatusLabel } from "@/lib/job-status";

type JobTab = AdminLiveJob["tabStatus"] | "all";

const tabs: Array<{ key: JobTab; label: string; icon: typeof BriefcaseBusiness; tone: string }> = [
  { key: "live", label: "Live jobs", icon: BriefcaseBusiness, tone: "text-green-700" },
  { key: "expired", label: "Expired (7d idle)", icon: Clock3, tone: "text-slate-600" },
  { key: "awaiting_buyer", label: "No response from buyer", icon: TimerReset, tone: "text-amber-700" },
  { key: "no_quotes", label: "No quotes from assessors", icon: XCircle, tone: "text-red-700" },
  { key: "completed", label: "Completed", icon: FileText, tone: "text-emerald-700" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, tone: "text-red-700" },
  { key: "all", label: "All jobs", icon: FileText, tone: "text-blue-700" },
];

function includesQuery(job: AdminLiveJob, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    job.customer,
    job.email,
    job.phone,
    job.address,
    job.town,
    job.county,
    job.type,
    job.purpose,
    job.status,
    job.shortId,
  ].some((value) => value.toLowerCase().includes(normalized));
}

function statusClass(job: AdminLiveJob) {
  if (job.tabStatus === "expired") return "bg-slate-100 text-slate-700";
  if (job.tabStatus === "completed") return "bg-emerald-50 text-emerald-700";
  if (job.tabStatus === "cancelled") return "bg-red-100 text-red-700";
  if (job.tabStatus === "no_quotes") return "bg-red-50 text-red-700";
  if (job.tabStatus === "awaiting_buyer") return "bg-amber-50 text-amber-700";
  return "bg-green-50 text-green-700";
}

function tabLabel(job: AdminLiveJob) {
  if (job.tabStatus === "live") return "Live";
  if (job.tabStatus === "expired") return "Expired";
  if (job.tabStatus === "completed") return "Completed";
  if (job.tabStatus === "cancelled") return "Cancelled";
  if (job.tabStatus === "awaiting_buyer") return "Waiting";
  return "No quotes";
}

function tabStatusForRawStatus(status?: string): AdminLiveJob["tabStatus"] {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed" || normalized === "converted") return "completed";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "expired") return "expired";
  if (normalized === "needs_more_info") return "awaiting_buyer";
  return "live";
}

export function AdminJobsWorklist({ jobs }: { jobs: AdminLiveJob[] }) {
  const [rows, setRows] = useState(jobs);
  const [activeTab, setActiveTab] = useState<JobTab>("live");
  const [query, setQuery] = useState("");
  const [county, setCounty] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingJob, setPendingJob] = useState<string | null>(null);

  const counties = useMemo(() => Array.from(new Set(rows.map((job) => job.county).filter(Boolean))).sort(), [rows]);
  const summary = useMemo(() => {
    const live = rows.filter((job) => job.tabStatus === "live").length;
    const expired = rows.filter((job) => job.tabStatus === "expired").length;
    const awaitingBuyer = rows.filter((job) => job.tabStatus === "awaiting_buyer").length;
    const noQuotes = rows.filter((job) => job.tabStatus === "no_quotes").length;
    const completed = rows.filter((job) => job.tabStatus === "completed").length;
    const cancelled = rows.filter((job) => job.tabStatus === "cancelled").length;
    const totalQuotes = rows.reduce((sum, job) => sum + job.quotes, 0);

    return { total: rows.length, live, expired, awaitingBuyer, noQuotes, completed, cancelled, totalQuotes };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((job) => {
      const tabMatch = activeTab === "all" || job.tabStatus === activeTab;
      const countyMatch = county === "all" || job.county === county;
      return tabMatch && countyMatch && includesQuery(job, query);
    });
  }, [activeTab, county, rows, query]);

  const tabCounts: Record<JobTab, number> = {
    live: summary.live,
    expired: summary.expired,
    awaiting_buyer: summary.awaitingBuyer,
    no_quotes: summary.noQuotes,
    completed: summary.completed,
    cancelled: summary.cancelled,
    all: summary.total,
  };

  async function runJobAction(action: "refresh" | "approve" | "request_info" | "mark_live" | "start" | "complete" | "cancel" | "expire", job: AdminLiveJob) {
    const requestMessage = action === "request_info"
      ? window.prompt(
          "What information should the buyer add?",
          "Please add more details, photos, timing, budget, or access instructions so providers can quote accurately."
        )
      : null;

    if (action === "request_info" && requestMessage === null) {
      return;
    }

    setPendingJob(`${action}:${job.id}`);
    setMessage(null);
    const response = await fetch("/api/admin/jobs/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, jobId: job.id, message: requestMessage }),
    });
    const payload = await response.json().catch(() => ({}));
    setPendingJob(null);
    if (!response.ok) {
      setMessage(payload.error || "Job update failed");
      return;
    }
    if (payload.status) {
      setRows((current) =>
        current.map((item) =>
          item.id === job.id
            ? { ...item, status: payload.status, tabStatus: tabStatusForRawStatus(payload.status), lastActivity: "Now", idleDays: 0 }
            : item
        )
      );
    } else {
      setRows((current) => current.map((item) => item.id === job.id ? { ...item, lastActivity: "Now", idleDays: 0 } : item));
    }
    setMessage(payload.message || "Job updated.");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Operations console</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Jobs</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Watch live requests, quote coverage, stale buyer responses, and jobs that need manual intervention.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/api/admin/export?kind=jobs" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800">
              <Download className="h-4 w-4" />
              Export
            </a>
            <a href="/admin/settings" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800">
              <SlidersHorizontal className="h-4 w-4" />
              Rules
            </a>
            <a href="/admin/jobs" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {[
            ["Total jobs", summary.total, "bg-slate-50 text-slate-950"],
            ["Live", summary.live, "bg-green-50 text-green-700"],
            ["Awaiting buyer", summary.awaitingBuyer, "bg-amber-50 text-amber-700"],
            ["No quotes", summary.noQuotes, "bg-red-50 text-red-700"],
            ["Total quotes", summary.totalQuotes, "bg-blue-50 text-blue-700"],
          ].map(([label, value, tone]) => (
            <div key={label} className={`rounded-lg border border-slate-200 p-4 ${tone}`}>
              <p className="text-2xl font-bold leading-none">{value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
            </div>
          ))}
        </div>
        {message ? <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{message}</div> : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <nav className="grid border-b border-slate-200 bg-white xl:grid-cols-7">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex min-h-14 items-center gap-2.5 border-b-2 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide transition ${active ? "border-green-600 bg-green-50 text-slate-950" : "border-transparent text-slate-500 hover:bg-slate-50"}`}
              >
                <Icon className={`h-4 w-4 ${active ? tab.tone : "text-slate-500"}`} />
                <span className="min-w-0 truncate">{tab.label}</span>
                <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-bold text-white ${tab.key === "live" ? "bg-green-500" : tab.key === "expired" ? "bg-slate-500" : tab.key === "awaiting_buyer" ? "bg-amber-500" : tab.key === "completed" ? "bg-emerald-500" : tab.key === "no_quotes" || tab.key === "cancelled" ? "bg-red-500" : "bg-blue-500"}`}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="grid gap-3 border-b border-slate-200 bg-white p-4 lg:grid-cols-[1fr_220px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by address, town, county, customer, email..."
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-base outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100"
            />
          </label>
          <label className="relative block">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <select
              value={county}
              onChange={(event) => setCounty(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-base font-semibold text-slate-700 outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100"
            >
              <option value="all">All counties</option>
              {counties.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCounty("all");
              setActiveTab("live");
            }}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] table-fixed divide-y divide-slate-200">
          <colgroup>
            <col className="w-[120px]" />
            <col className="w-[110px]" />
            <col className="w-[220px]" />
            <col className="w-[130px]" />
            <col className="w-[130px]" />
            <col className="w-[140px]" />
            <col className="w-[100px]" />
            <col className="w-[80px]" />
            <col className="w-[120px]" />
            <col className="w-[90px]" />
            <col className="w-[120px]" />
            <col className="w-[330px]" />
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              {["Date", "Status", "Customer", "Town", "County", "Type", "Sq. Mt.", "Beds", "Purpose", "Quotes", "Last", "Actions"].map((column) => (
                <th key={column} className="px-4 py-3 text-left text-sm font-black text-slate-700">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50">
                <td className="px-4 py-4">
                  <p className="text-sm font-bold text-slate-800">{job.postedLabel}</p>
                  <p className="text-xs font-black text-amber-600">{job.idleDays}d idle</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase ${statusClass(job)}`}>
                    {tabLabel(job)}
                  </span>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{getJobStatusLabel(job.status)}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="truncate text-sm font-black text-slate-950" title={job.customer}>{job.customer}</p>
                  <p className="truncate text-sm text-slate-500" title={job.email}>{job.email || job.phone || job.shortId}</p>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{job.town}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{job.county}</td>
                <td className="px-4 py-4 capitalize text-sm font-semibold text-slate-700">{job.type}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{job.size}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{job.beds}</td>
                <td className="px-4 py-4 capitalize text-sm font-semibold text-slate-700">{job.purpose}</td>
                <td className="px-4 py-4 text-base font-black text-slate-950">{job.quotes}</td>
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-slate-700">{job.lastActivity}</p>
                  <p className="text-xs font-bold text-slate-500">{job.idleDays}d idle</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <a href={`/dashboard/requests/${job.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-green-700 px-4 text-sm font-black text-white hover:bg-green-800">
                      <Eye className="h-4 w-4" />
                      View
                    </a>
                    <button
                      type="button"
                      title="Refresh job"
                      disabled={pendingJob === `refresh:${job.id}`}
                      onClick={() => runJobAction("refresh", job)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-60"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    {job.status === "submitted" ? (
                      <span className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 text-xs font-black text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Approved
                      </span>
                    ) : (
                      <button
                        type="button"
                        title="Approve job and make it live for providers"
                        disabled={pendingJob === `approve:${job.id}`}
                        onClick={() => runJobAction("approve", job)}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-green-200 px-3 text-xs font-black text-green-700 hover:bg-green-50 disabled:opacity-60"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      title="Ask buyer for more information"
                      disabled={pendingJob === `request_info:${job.id}`}
                      onClick={() => runJobAction("request_info", job)}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-amber-200 px-3 text-xs font-black text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                    >
                      <FileQuestion className="h-4 w-4" />
                      Request info
                    </button>
                    {job.status === "bid_accepted" || job.status === "confirmed" ? (
                      <button
                        type="button"
                        title="Mark in progress"
                        disabled={pendingJob === `start:${job.id}`}
                        onClick={() => runJobAction("start", job)}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-blue-200 px-3 text-xs font-black text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                      >
                        Start
                      </button>
                    ) : null}
                    {job.status === "in_progress" ? (
                      <button
                        type="button"
                        title="Mark completed"
                        disabled={pendingJob === `complete:${job.id}`}
                        onClick={() => runJobAction("complete", job)}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-200 px-3 text-xs font-black text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        Done
                      </button>
                    ) : null}
                    <button
                      type="button"
                      title="Expire job"
                      disabled={pendingJob === `expire:${job.id}` || job.tabStatus === "expired"}
                      onClick={() => runJobAction("expire", job)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Cancel job"
                      disabled={pendingJob === `cancel:${job.id}` || job.tabStatus === "cancelled"}
                      onClick={() => runJobAction("cancel", job)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 px-3 text-xs font-black text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500">
          {filtered.length} jobs shown
        </div>
      </section>
    </div>
  );
}
