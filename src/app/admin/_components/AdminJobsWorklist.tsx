"use client";

import { Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BriefcaseBusiness, ChevronDown, CheckCircle2, Clock3, Download, Eye, FileQuestion, FileText, MapPin, MessageCircle, RefreshCw, Search, SlidersHorizontal, TimerReset, Trash2, XCircle } from "lucide-react";

import type { AdminLiveJob } from "./admin-data";
import { getJobStatusLabel } from "@/lib/job-status";

export type JobTab = AdminLiveJob["tabStatus"] | "all";

const tabs: Array<{ key: JobTab; label: string; icon: typeof BriefcaseBusiness; tone: string }> = [
  { key: "pending_review", label: "Pending review", icon: FileQuestion, tone: "text-yellow-700" },
  { key: "live", label: "Live jobs", icon: BriefcaseBusiness, tone: "text-green-700" },
  { key: "expired", label: "Expired (7d idle)", icon: Clock3, tone: "text-slate-600" },
  { key: "awaiting_buyer", label: "No response from buyer", icon: TimerReset, tone: "text-amber-700" },
  { key: "no_quotes", label: "No quotes from assessors", icon: XCircle, tone: "text-red-700" },
  { key: "completed", label: "Completed", icon: FileText, tone: "text-emerald-700" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, tone: "text-red-700" },
  { key: "all", label: "All jobs", icon: FileText, tone: "text-blue-700" },
];

const sourceFilters = [
  { key: "all", label: "All sources" },
  { key: "service_inquiry", label: "Customer requests" },
  { key: "business_work_post", label: "Business posts" },
] as const;

const quoteFilters = [
  { key: "all", label: "Any quote status" },
  { key: "with_quotes", label: "Has quotes" },
  { key: "no_quotes", label: "No quotes" },
] as const;

const ageFilters = [
  { key: "all", label: "Any age" },
  { key: "fresh_24", label: "New in 24h" },
  { key: "idle_7", label: "Idle 7d+" },
] as const;

const irelandRegions = [
  { key: "region:connacht", label: "Connacht", counties: ["Galway", "Leitrim", "Mayo", "Roscommon", "Sligo"] },
  {
    key: "region:leinster",
    label: "Leinster",
    counties: ["Carlow", "Dublin", "Kildare", "Kilkenny", "Laois", "Longford", "Louth", "Meath", "Offaly", "Westmeath", "Wexford", "Wicklow"],
  },
  { key: "region:munster", label: "Munster", counties: ["Clare", "Cork", "Kerry", "Limerick", "Tipperary", "Waterford"] },
  { key: "region:ulster", label: "Ulster", counties: ["Antrim", "Armagh", "Cavan", "Derry", "Donegal", "Down", "Fermanagh", "Monaghan", "Tyrone"] },
] as const;

const irelandCounties = Array.from(new Set(irelandRegions.flatMap((region) => region.counties))).sort();
const irelandCountyNames = new Set(irelandCounties.map((county) => county.toLowerCase()));
const irelandRegionKeys = new Set<string>(irelandRegions.map((region) => region.key));

function normalizeIrelandAreaFilter(value?: string) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized === "all") return "all";
  if (irelandRegionKeys.has(normalized)) return normalized;
  if (normalized.startsWith("county:")) {
    const county = normalized.replace("county:", "");
    return irelandCountyNames.has(county.toLowerCase()) ? `county:${county}` : "all";
  }
  return irelandCountyNames.has(normalized.toLowerCase()) ? `county:${normalized}` : "all";
}

function matchesIrelandArea(job: AdminLiveJob, areaFilter: string) {
  if (areaFilter === "all") return true;
  const locationParts = [job.county, job.town].map((part) => String(part || "").trim().toLowerCase()).filter(Boolean);

  if (areaFilter.startsWith("county:")) {
    const county = areaFilter.replace("county:", "").toLowerCase();
    return locationParts.includes(county);
  }

  const region = irelandRegions.find((item) => item.key === areaFilter);
  if (!region) return true;
  const regionCounties = new Set(region.counties.map((county) => county.toLowerCase()));
  return locationParts.some((part) => regionCounties.has(part));
}

const irelandLocationWords = new Set([
  ...irelandCountyNames,
  ...irelandRegions.map((region) => region.label.toLowerCase()),
  "ireland",
]);
const eircodePattern = /\b[A-Z]\d{2}\s?[A-Z0-9]{4}\b/i;

function hasIrelandLocationSignal(value: string) {
  const normalized = value.toLowerCase();
  return eircodePattern.test(value) || Array.from(irelandLocationWords).some((word) => normalized.includes(word));
}

function safeIrelandLocationPart(value?: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed.toLowerCase() === "unknown") return "";
  return hasIrelandLocationSignal(trimmed) ? trimmed : "";
}

function safeIrelandJobLocation(job: AdminLiveJob) {
  const parts = Array.from(new Set([
    safeIrelandLocationPart(job.town),
    safeIrelandLocationPart(job.county),
  ].filter(Boolean)));
  return parts.join(", ") || "Ireland launch area";
}

function safeIrelandJobFullLocation(job: AdminLiveJob) {
  const location = safeIrelandJobLocation(job);
  const address = String(job.address || "").trim();
  const safeAddress = address && (location !== "Ireland launch area" || hasIrelandLocationSignal(address)) ? address : "";
  return Array.from(new Set([safeAddress, location].filter(Boolean))).join(", ") || "Ireland launch area";
}

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
    job.description,
    job.purpose,
    job.status,
    job.shortId,
  ].some((value) => value.toLowerCase().includes(normalized));
}

function statusClass(job: AdminLiveJob) {
  const normalized = String(job.status || "").toLowerCase();
  if (["approved", "submitted", "matched", "bid_accepted"].includes(normalized)) return "bg-green-50 text-green-700";
  if (["completed", "converted"].includes(normalized)) return "bg-emerald-50 text-emerald-700";
  if (["expired", "cancelled", "rejected"].includes(normalized)) return "bg-slate-100 text-slate-700";
  if (["more_info_needed", "needs_more_info"].includes(normalized)) return "bg-amber-50 text-amber-700";
  if (["pending_for_review", "pending", "draft"].includes(normalized)) return "bg-yellow-100 text-yellow-800";
  return "bg-slate-100 text-slate-700";
}

function tabLabel(job: AdminLiveJob) {
  if (job.tabStatus === "pending_review") return "Review";
  if (job.tabStatus === "live") return "Live";
  if (job.tabStatus === "expired") return "Expired";
  if (job.tabStatus === "completed") return "Completed";
  if (job.tabStatus === "cancelled") return "Cancelled";
  if (job.tabStatus === "awaiting_buyer") return "Waiting";
  return "No quotes";
}

function tabBadgeClass(tab: JobTab) {
  if (tab === "pending_review") return "bg-yellow-500";
  if (tab === "live") return "bg-green-500";
  if (tab === "expired") return "bg-slate-500";
  if (tab === "awaiting_buyer") return "bg-amber-500";
  if (tab === "completed") return "bg-emerald-500";
  if (tab === "no_quotes" || tab === "cancelled") return "bg-red-500";
  return "bg-blue-500";
}

function tabStatusForRawStatus(status?: string): AdminLiveJob["tabStatus"] {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed" || normalized === "converted") return "completed";
  if (normalized === "cancelled" || normalized === "rejected") return "cancelled";
  if (normalized === "expired") return "expired";
  if (normalized === "needs_more_info" || normalized === "more_info_needed") return "awaiting_buyer";
  if (normalized === "pending_for_review" || normalized === "pending" || normalized === "draft") return "pending_review";
  return "live";
}

function canApproveJob(job: AdminLiveJob) {
  return ["pending_for_review", "pending", "draft", "more_info_needed", "needs_more_info", "rejected", "expired"].includes(String(job.status || "").toLowerCase());
}

function AdminJobFormActionButton({
  action,
  job,
  redirectTab,
  disabled,
  title,
  className,
  children,
}: {
  action: "refresh" | "approve" | "mark_live" | "start" | "complete" | "reject" | "cancel" | "expire";
  job: AdminLiveJob;
  redirectTab?: JobTab;
  disabled?: boolean;
  title: string;
  className: string;
  children: ReactNode;
}) {
  const targetTab = redirectTab || (action === "expire" ? "expired" : "all");
  const redirectTo = `/admin/jobs?tab=${encodeURIComponent(targetTab)}&q=${encodeURIComponent(job.shortId)}`;

  return (
    <form method="post" action="/api/admin/jobs/actions" className="contents">
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="jobId" value={job.id} />
      <input type="hidden" name="source" value={job.source} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button type="submit" title={title} disabled={disabled} className={className}>
        {children}
      </button>
    </form>
  );
}

export function AdminJobsWorklist({
  jobs,
  initialTab = "pending_review",
  initialCounty = "all",
  initialQuery = "",
}: {
  jobs: AdminLiveJob[];
  initialTab?: JobTab;
  initialCounty?: string;
  initialQuery?: string;
}) {
  const [rows, setRows] = useState(jobs);
  const [activeTab, setActiveTab] = useState<JobTab>(initialTab);
  const [query, setQuery] = useState(initialQuery);
  const [areaFilter, setAreaFilter] = useState(normalizeIrelandAreaFilter(initialCounty));
  const [sourceFilter, setSourceFilter] = useState<(typeof sourceFilters)[number]["key"]>("all");
  const [quoteFilter, setQuoteFilter] = useState<(typeof quoteFilters)[number]["key"]>("all");
  const [ageFilter, setAgeFilter] = useState<(typeof ageFilters)[number]["key"]>("all");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingJob, setPendingJob] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [chatJobId, setChatJobId] = useState<string | null>(null);

  const summary = useMemo(() => {
    const live = rows.filter((job) => job.tabStatus === "live").length;
    const pendingReview = rows.filter((job) => job.tabStatus === "pending_review").length;
    const expired = rows.filter((job) => job.tabStatus === "expired").length;
    const awaitingBuyer = rows.filter((job) => job.tabStatus === "awaiting_buyer").length;
    const noQuotes = rows.filter((job) => job.tabStatus === "no_quotes").length;
    const completed = rows.filter((job) => job.tabStatus === "completed").length;
    const cancelled = rows.filter((job) => job.tabStatus === "cancelled").length;
    const totalQuotes = rows.reduce((sum, job) => sum + job.quotes, 0);

    return { total: rows.length, live, pendingReview, expired, awaitingBuyer, noQuotes, completed, cancelled, totalQuotes };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((job) => {
      const tabMatch = activeTab === "all" || job.tabStatus === activeTab;
      const areaMatch = matchesIrelandArea(job, areaFilter);
      const sourceMatch = sourceFilter === "all" || job.source === sourceFilter;
      const quoteMatch =
        quoteFilter === "all" ||
        (quoteFilter === "with_quotes" && job.quotes > 0) ||
        (quoteFilter === "no_quotes" && job.quotes === 0);
      const ageMatch =
        ageFilter === "all" ||
        (ageFilter === "idle_7" && job.idleDays >= 7) ||
        (ageFilter === "fresh_24" && job.idleDays === 0);
      return tabMatch && areaMatch && sourceMatch && quoteMatch && ageMatch && includesQuery(job, query);
    });
  }, [activeTab, ageFilter, areaFilter, quoteFilter, rows, query, sourceFilter]);

  const tabCounts: Record<JobTab, number> = {
    pending_review: summary.pendingReview,
    live: summary.live,
    expired: summary.expired,
    awaiting_buyer: summary.awaitingBuyer,
    no_quotes: summary.noQuotes,
    completed: summary.completed,
    cancelled: summary.cancelled,
    all: summary.total,
  };
  const activeTabConfig = tabs.find((tab) => tab.key === activeTab) || tabs[0];
  const ActiveTabIcon = activeTabConfig.icon;
  const activeAdvancedFilterCount = [
    areaFilter !== "all",
    sourceFilter !== "all",
    quoteFilter !== "all",
    ageFilter !== "all",
  ].filter(Boolean).length;
  const chatJob = rows.find((job) => job.id === chatJobId) || null;

  async function runJobAction(action: "refresh" | "approve" | "request_info" | "mark_live" | "start" | "complete" | "reject" | "cancel" | "expire", job: AdminLiveJob) {
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
      body: JSON.stringify({ action, jobId: job.id, source: job.source, message: requestMessage }),
    });
    const payload = await response.json().catch(() => ({}));
    setPendingJob(null);
    if (!response.ok) {
      setMessage(payload.error || "Job update failed");
      return;
    }
    if (payload.status) {
      const nextTabStatus = tabStatusForRawStatus(payload.status);
      setRows((current) =>
        current.map((item) =>
          item.id === job.id
            ? {
                ...item,
                status: payload.status,
                tabStatus: nextTabStatus,
                lastActivity: action === "refresh" ? "Now" : item.lastActivity,
                idleDays: action === "refresh" ? 0 : item.idleDays,
              }
            : item
        )
      );
      if (nextTabStatus === "expired") {
        setActiveTab("expired");
      }
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

        <div className="mt-5 grid gap-3 md:grid-cols-6">
          {[
            ["Total jobs", summary.total, "bg-slate-50 text-slate-950"],
            ["Pending review", summary.pendingReview, "bg-yellow-50 text-yellow-700"],
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

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_240px_220px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by address, town, county, customer, email..."
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-base outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100"
            />
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setStatusMenuOpen((open) => !open);
                setFiltersOpen(false);
              }}
              className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-bold text-slate-800 hover:bg-slate-50 focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100"
            >
              <span className="flex min-w-0 items-center gap-2">
                <ActiveTabIcon className={`h-4 w-4 shrink-0 ${activeTabConfig.tone}`} />
                <span className="truncate">{activeTabConfig.label}</span>
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black text-white ${tabBadgeClass(activeTab)}`}>{tabCounts[activeTab]}</span>
            </button>
            {statusMenuOpen ? (
              <div className="absolute right-0 top-12 z-40 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.key);
                        setStatusMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold ${active ? "bg-green-50 text-slate-950 ring-1 ring-green-200" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? tab.tone : "text-slate-400"}`} />
                      <span className="min-w-0 flex-1">{tab.label}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black text-white ${tabBadgeClass(tab.key)}`}>{tabCounts[tab.key]}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setFiltersOpen((open) => !open);
                setStatusMenuOpen(false);
              }}
              className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-bold text-slate-800 hover:bg-slate-50 focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100"
            >
              <span className="flex min-w-0 items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="truncate">{activeAdvancedFilterCount ? `${activeAdvancedFilterCount} filter${activeAdvancedFilterCount === 1 ? "" : "s"}` : "Filters"}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
            {filtersOpen ? (
              <div className="absolute right-0 top-12 z-40 w-[min(420px,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/15">
                <div>
                  <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="admin-job-area-filter">Country / area</label>
                  <div className="relative mt-2">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      id="admin-job-area-filter"
                      value={areaFilter}
                      onChange={(event) => setAreaFilter(event.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100"
                    >
                      <option value="all">All Ireland</option>
                      <optgroup label="Regions">
                        {irelandRegions.map((region) => (
                          <option key={region.key} value={region.key}>{region.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Counties">
                        {irelandCounties.map((county) => (
                          <option key={county} value={`county:${county}`}>{county}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Source</p>
                  <div className="mt-2 grid gap-2">
                    {sourceFilters.map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setSourceFilter(filter.key)}
                        className={`rounded-lg border px-3 py-2 text-left text-sm font-bold ${sourceFilter === filter.key ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Quote coverage</p>
                    <div className="mt-2 grid gap-2">
                      {quoteFilters.map((filter) => (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() => setQuoteFilter(filter.key)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm font-bold ${quoteFilter === filter.key ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Age</p>
                    <div className="mt-2 grid gap-2">
                      {ageFilters.map((filter) => (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() => setAgeFilter(filter.key)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm font-bold ${ageFilter === filter.key ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAreaFilter("all");
                      setSourceFilter("all");
                      setQuoteFilter("all");
                      setAgeFilter("all");
                    }}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Clear filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="h-9 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              setQuery("");
              setAreaFilter("all");
              setSourceFilter("all");
              setQuoteFilter("all");
              setAgeFilter("all");
              setActiveTab("pending_review");
              setStatusMenuOpen(false);
              setFiltersOpen(false);
            }}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <div className="overflow-visible">
          <table className="w-full table-fixed divide-y divide-slate-200">
          <colgroup>
            <col className="w-[120px]" />
            <col className="w-[140px]" />
            <col />
            <col className="w-[260px]" />
            <col className="w-[150px]" />
            <col className="w-[130px]" />
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              {["Date", "Status", "Job", "Customer / location", "Activity", "Actions"].map((column) => (
                <th key={column} className="px-4 py-3 text-left text-sm font-black text-slate-700">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((job) => {
              const safeLocation = safeIrelandJobLocation(job);
              const safeFullLocation = safeIrelandJobFullLocation(job);

              return (
              <Fragment key={job.id}>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-4">
                  <p className="text-sm font-bold text-slate-800">{job.postedLabel}</p>
                  <p className="text-xs font-black text-amber-600">{job.idleDays}d idle</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase ${statusClass(job)}`}>
                    {getJobStatusLabel(job.status)}
                  </span>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{tabLabel(job)}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="truncate text-sm font-black capitalize text-slate-950" title={job.type}>{job.type}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600" title={job.description}>{job.description || "No job description recorded."}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{job.sourceLabel}</span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-700">{job.shortId}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="truncate text-sm font-black text-slate-950" title={job.customer}>{job.customer}</p>
                  <p className="truncate text-sm text-slate-500" title={job.email}>{job.email || job.phone || "No contact saved"}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500" title={safeLocation}>
                    {safeLocation}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-base font-black text-slate-950">{job.quotes}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{job.source === "business_work_post" ? "applications" : "quotes"}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{job.lastActivity}</p>
                </td>
                <td className="relative px-4 py-4">
                  <button
                    type="button"
                    aria-expanded={openActionMenuId === job.id}
                    onClick={() => setOpenActionMenuId((current) => current === job.id ? null : job.id)}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    Actions
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {openActionMenuId === job.id ? (
                    <div className="absolute right-4 top-14 z-30 w-56 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
                    <button
                      type="button"
                      aria-expanded={expandedJobId === job.id}
                      onClick={() => {
                        setExpandedJobId((current) => current === job.id ? null : job.id);
                        setOpenActionMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-slate-800 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                      {expandedJobId === job.id ? "Hide" : "View"}
                    </button>
                    <button
                      type="button"
                      title="Refresh job"
                      disabled={pendingJob === `refresh:${job.id}`}
                      onClick={() => {
                        setOpenActionMenuId(null);
                        runJobAction("refresh", job);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                    {["approved", "submitted"].includes(String(job.status || "").toLowerCase()) ? (
                      <span className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Approved
                      </span>
                    ) : canApproveJob(job) ? (
                      <button
                        type="button"
                        title="Approve job and make it live for providers"
                        disabled={pendingJob === `approve:${job.id}`}
                        onClick={() => {
                          setOpenActionMenuId(null);
                          runJobAction("approve", job);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-green-700 hover:bg-green-50 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>
                    ) : null}
                    <button
                      type="button"
                      title="Ask buyer for more information"
                      disabled={pendingJob === `request_info:${job.id}`}
                      onClick={() => {
                        setOpenActionMenuId(null);
                        runJobAction("request_info", job);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                    >
                      <FileQuestion className="h-4 w-4" />
                      Request info
                    </button>
                    {job.status === "bid_accepted" || job.status === "confirmed" ? (
                      <button
                        type="button"
                        title="Mark in progress"
                        disabled={pendingJob === `start:${job.id}`}
                        onClick={() => {
                          setOpenActionMenuId(null);
                          runJobAction("start", job);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                      >
                        Start
                      </button>
                    ) : null}
                    {job.status === "in_progress" ? (
                      <button
                        type="button"
                        title="Mark completed"
                        disabled={pendingJob === `complete:${job.id}`}
                        onClick={() => {
                          setOpenActionMenuId(null);
                          runJobAction("complete", job);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        Done
                      </button>
                    ) : null}
                    <AdminJobFormActionButton
                      action="expire"
                      job={job}
                      title="Expire job"
                      disabled={pendingJob === `expire:${job.id}` || String(job.status || "").toLowerCase() === "expired"}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                      Expire
                    </AdminJobFormActionButton>
                    <button
                      type="button"
                      title="Cancel job"
                      disabled={pendingJob === `cancel:${job.id}` || ["cancelled", "rejected"].includes(String(job.status || "").toLowerCase())}
                      onClick={() => {
                        setOpenActionMenuId(null);
                        runJobAction("cancel", job);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                    </div>
                  ) : null}
                </td>
              </tr>
              {expandedJobId === job.id ? (
                <tr className="bg-slate-50">
                  <td colSpan={6} className="px-4 py-5">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">{job.sourceLabel}</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClass(job)}`}>{getJobStatusLabel(job.status)}</span>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700">{tabLabel(job)}</span>
                          </div>
                          <h3 className="mt-3 text-lg font-black text-slate-950">{job.type}</h3>
                          <p className="mt-2 max-w-5xl whitespace-pre-wrap text-sm leading-6 text-slate-700">{job.description || "No job description recorded."}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                          <p className="font-black text-slate-950">{job.quotes}</p>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {job.source === "business_work_post" ? "Applications" : "Quotes"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                                {job.source === "business_work_post" ? "Applications" : "Quotes and offers"}
                              </p>
                              <h4 className="mt-1 text-base font-black text-slate-950">
                                {job.quoteDetails.length} {job.source === "business_work_post" ? "application" : "quote"}{job.quoteDetails.length === 1 ? "" : "s"} received
                              </h4>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-600 ring-1 ring-slate-200">
                              Admin view
                            </span>
                          </div>

                          {job.quoteDetails.length ? (
                            <div className="mt-4 space-y-3">
                              {job.quoteDetails.map((quote) => (
                                <div key={quote.id} className="rounded-lg border border-slate-200 bg-white p-4">
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-black text-slate-950">{quote.providerName}</p>
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${quote.status === "accepted" ? "bg-green-50 text-green-700" : quote.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                          {quote.status}
                                        </span>
                                      </div>
                                      <p className="mt-1 break-words text-xs font-semibold text-slate-500">
                                        {[quote.providerEmail, quote.providerPhone, quote.providerId].filter(Boolean).join(" · ") || "Provider contact not saved"}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-right text-xs">
                                      <div>
                                        <p className="font-black text-slate-950">{quote.sellerQuote}</p>
                                        <p className="font-semibold uppercase text-slate-500">Provider</p>
                                      </div>
                                      <div>
                                        <p className="font-black text-slate-950">{quote.anyJobFee}</p>
                                        <p className="font-semibold uppercase text-slate-500">AnyJob</p>
                                      </div>
                                      <div>
                                        <p className="font-black text-slate-950">{quote.buyerTotal}</p>
                                        <p className="font-semibold uppercase text-slate-500">Buyer sees</p>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">{quote.message}</p>
                                  <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-500 md:grid-cols-4">
                                    <span>Duration: {quote.estimatedDuration}</span>
                                    <span>Available: {quote.availableDate}</span>
                                    <span>Quoted: {quote.createdLabel}</span>
                                    <span>Updated: {quote.updatedLabel}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-500">
                              No provider quote or shift application has been submitted yet.
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Accepted chat</p>
                          <h4 className="mt-1 text-base font-black text-slate-950">Buyer and provider messages</h4>
                          <button
                            type="button"
                            disabled={!job.chatMessages.length}
                            onClick={() => setChatJobId(job.id)}
                            className="mt-4 flex w-full items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:opacity-75"
                          >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                              <MessageCircle className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-black text-blue-950">
                                {job.chatMessages.length ? `${job.chatMessages.length} message${job.chatMessages.length === 1 ? "" : "s"} in accepted chat` : "No accepted chat yet"}
                              </span>
                              <span className="mt-1 line-clamp-2 block text-sm leading-5 text-slate-600">
                                {job.chatMessages.at(-1)?.content || "Chat appears here after a buyer accepts a quote and messages are sent."}
                              </span>
                              {job.chatMessages.length ? (
                                <span className="mt-2 block text-xs font-bold uppercase tracking-wide text-blue-700">Open chat popup</span>
                              ) : null}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {[
                          ["Customer / Business", job.customer],
                          ["Email", job.email || "Not provided"],
                          ["Phone", job.phone || "Not provided"],
                          ["Location", safeFullLocation],
                          ["Schedule", job.schedule],
                          ["Budget / Rate", job.budget],
                          ["Duration / Date", job.size],
                          ["People needed", job.beds],
                          ["Purpose / Work type", job.purpose],
                          ["Requirements", job.requirements],
                          ["Posted", job.datePosted ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(job.datePosted)) : "Unknown"],
                          ["Last activity", `${job.lastActivity} (${job.idleDays}d idle)`],
                          ["Job ID", job.id],
                          ["Short ID", job.shortId],
                          ["User / Owner ID", job.userId || "Not linked"],
                          ["Source table", job.source],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
                            <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-900">{value || "Not set"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
              </Fragment>
              );
            })}
          </tbody>
        </table>
        </div>

        <div className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500">
          {filtered.length} jobs shown
        </div>
      </section>
      {chatJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">Admin chat transcript</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">{chatJob.type}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{chatJob.customer} · {chatJob.chatMessages.length} message{chatJob.chatMessages.length === 1 ? "" : "s"}</p>
              </div>
              <button
                type="button"
                onClick={() => setChatJobId(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close chat popup"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5">
              {chatJob.chatMessages.map((message) => {
                const isBuyer = message.senderRole.toLowerCase() === "buyer";
                return (
                  <div key={message.id} className={`flex ${isBuyer ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${isBuyer ? "rounded-tl-sm bg-white text-slate-800" : "rounded-tr-sm bg-blue-600 text-white"}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black">{message.senderName}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${isBuyer ? "bg-slate-100 text-slate-600" : "bg-white/20 text-white"}`}>
                          {message.senderRole}
                        </span>
                      </div>
                      <p className={`mt-1 text-[11px] font-semibold ${isBuyer ? "text-slate-500" : "text-blue-100"}`}>
                        {message.createdLabel} · {message.isRead ? "Read" : "Unread"}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-500">
              Read-only admin view. Admin can inspect the accepted buyer/provider conversation here.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
