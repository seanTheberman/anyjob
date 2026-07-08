"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MapPin, Calendar, DollarSign, Clock, Search, Filter, Gavel, ImageIcon, Loader2, ShieldAlert, ArrowUpRight, CheckCircle2, Briefcase, Users, WalletCards } from "lucide-react";
import { BidForm } from "@/components/bids/BidForm";
import { calculateBookingTokenBreakdown, formatMoney } from "@/lib/booking-token";
import { useSellerVerification } from "@/hooks/useSellerVerification";
import { SHIFT_NICHES, getShiftNiche } from "@/lib/shift-work";

interface Job {
  id: string;
  category_slug: string;
  subcategory_slug: string;
  job_description: string;
  city: string;
  address: string;
  preferred_date: string;
  preferred_time_start: string;
  preferred_time_end: string;
  budget_range_min: number;
  budget_range_max: number;
  estimated_duration_hours: number;
  number_of_people_needed: number;
  status: string;
  submitted_at: string;
  bid_count: number;
  my_bid: { id: string; amount: number; status: string } | null;
  work_image_count: number;
  work_images?: Array<{ id: string; image_url: string }>;
  custom_tags?: string[] | null;
  distance_km?: number | null;
}

type WorkBoardMode = "day" | "shift";

type ShiftJob = {
  id: string;
  work_type: string;
  niche: string;
  role_title: string;
  description: string;
  city: string;
  starts_at?: string | null;
  ends_at?: string | null;
  headcount: number;
  business_preferred_hourly_rate?: number | null;
  business_preferred_day_rate?: number | null;
  business?: { business_name?: string; industry?: string } | null;
  myApplication?: {
    id: string;
    status: string;
    proposed_hourly_rate?: number | null;
    proposed_day_rate?: number | null;
    payment?: { status?: string; agreed_amount?: number; currency?: string } | null;
  } | null;
};

const categoryNames: Record<string, string> = {
  menage: "Cleaning",
  bricolage: "Handyman",
  jardinage: "Gardening",
  demenagement: "Moving",
  enfants: "Childcare",
  animaux: "Pet Care",
  informatique: "IT Support",
  "aide-domicile": "Home Help",
  "cours-particuliers": "Private Tutoring",
  hiver: "Winter Services",
  custom: "Custom job request",
};

const categoryColors: Record<string, string> = {
  menage: "bg-pink-100 text-pink-700",
  bricolage: "bg-amber-100 text-amber-700",
  jardinage: "bg-green-100 text-green-700",
  demenagement: "bg-purple-100 text-purple-700",
  enfants: "bg-orange-100 text-orange-700",
  animaux: "bg-teal-100 text-teal-700",
  informatique: "bg-indigo-100 text-indigo-700",
  "aide-domicile": "bg-red-100 text-red-700",
  "cours-particuliers": "bg-sky-100 text-sky-700",
  hiver: "bg-blue-100 text-blue-700",
  custom: "bg-red-100 text-red-700",
};

function hasMeaningfulText(value?: string | null) {
  return /[\p{L}\p{N}]/u.test(value || "");
}

function splitJobDescription(value?: string | null) {
  const text = value?.trim() || "";
  if (!hasMeaningfulText(text)) return { title: "", description: "" };
  const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length > 1 && blocks[0].length <= 120) {
    return {
      title: blocks[0],
      description: blocks.slice(1).join("\n\n"),
    };
  }
  return {
    title: text.split(/[.!?]/).find((part) => hasMeaningfulText(part))?.trim() || text,
    description: text,
  };
}

export default function BrowseJobsPage() {
  const [boardMode, setBoardMode] = useState<WorkBoardMode>("day");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [shiftJobs, setShiftJobs] = useState<ShiftJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [shiftReason, setShiftReason] = useState<string | null>(null);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [shiftNiche, setShiftNiche] = useState("");
  const [applyingShiftId, setApplyingShiftId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [showBidForm, setShowBidForm] = useState<string | null>(null);
  const { verificationStatus, loading: verificationLoading } = useSellerVerification();

  const canPlaceBid = Boolean(verificationStatus?.isVerified);

  const fetchJobs = useCallback(async () => {
    if (boardMode !== "day") return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchCity) params.set("city", searchCity);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const normalizedCity = searchCity.trim().toLowerCase();
        const nextJobs = (data.jobs || []).filter((job: Job) => {
          const categoryMatches = !selectedCategory || job.category_slug === selectedCategory;
          const cityMatches = !normalizedCity || [job.city, job.address].some((value) => String(value || "").toLowerCase().includes(normalizedCity));
          return categoryMatches && cityMatches;
        });
        setJobs(nextJobs);
        setSelectedJobId((current) => current && nextJobs.some((job: Job) => job.id === current) ? current : nextJobs[0]?.id || null);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [boardMode, selectedCategory, searchCity]);

  const fetchShiftJobs = useCallback(async () => {
    if (boardMode !== "shift") return;
    setShiftLoading(true);
    setShiftError(null);
    try {
      const params = new URLSearchParams();
      if (shiftNiche) params.set("niche", shiftNiche);
      const response = await fetch(`/api/shifts?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setShiftError(payload.error || "Unable to load shift jobs");
        setShiftJobs([]);
        setSelectedShiftId(null);
      } else {
        const nextJobs = payload.jobs || [];
        setShiftJobs(nextJobs);
        setShiftReason(payload.reason || null);
        setSelectedShiftId((current) => current && nextJobs.some((job: ShiftJob) => job.id === current) ? current : nextJobs[0]?.id || null);
      }
    } catch {
      setShiftError("Unable to load shift jobs");
      setShiftJobs([]);
      setSelectedShiftId(null);
    } finally {
      setShiftLoading(false);
    }
  }, [boardMode, shiftNiche]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchShiftJobs();
  }, [fetchShiftJobs]);

  const handleBidSubmitted = () => {
    setShowBidForm(null);
    fetchJobs();
  };
  const selectedJob = jobs.find((job) => job.id === selectedJobId) || jobs[0] || null;
  const selectedShift = shiftJobs.find((job) => job.id === selectedShiftId) || shiftJobs[0] || null;

  async function applyForShift(job: ShiftJob) {
    setApplyingShiftId(job.id);
    setShiftError(null);
    try {
      const response = await fetch("/api/shifts/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: job.id,
          proposedHourlyRate: job.business_preferred_hourly_rate,
          proposedDayRate: job.business_preferred_day_rate,
          message: "I am available for this shift and can work at the posted rate.",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setShiftError(payload.error || "Unable to apply for shift");
        return;
      }
      await fetchShiftJobs();
    } catch {
      setShiftError("Unable to apply for shift");
    } finally {
      setApplyingShiftId(null);
    }
  }

  const budgetLabel = (job: Job) => {
    const min = Number(job.budget_range_min || 0);
    const max = Number(job.budget_range_max || 0);
    if (min && max) return `€${min} - €${max}`;
    if (min) return `from €${min}`;
    if (max) return `up to €${max}`;
    return "Open budget";
  };

  const jobTitle = (job: Job) => {
    return splitJobDescription(job.job_description).title.slice(0, 74) || categoryNames[job.category_slug] || "Service request";
  };

  const jobDescription = (job: Job) => splitJobDescription(job.job_description).description || "No description provided.";

  return (
    <div className="min-h-screen bg-[#f4f5f9] pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-600">Provider work board</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-blue-950">Browse jobs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Switch between day-to-day buyer jobs and business work shifts. Pick a post, inspect the details, then apply from the right workflow.</p>
          </div>
          {boardMode === "day" && !loading ? (
            <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
              {jobs.length} live job{jobs.length === 1 ? "" : "s"}
            </div>
          ) : null}
          {boardMode === "shift" && !shiftLoading ? (
            <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
              {shiftJobs.length} work shift{shiftJobs.length === 1 ? "" : "s"}
            </div>
          ) : null}
        </div>

        <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setBoardMode("day");
              setShowBidForm(null);
            }}
            className={`rounded-lg px-4 py-3 text-left transition ${boardMode === "day" ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}
          >
            <span className="flex items-center gap-2 text-sm font-black">
              <Gavel className="h-4 w-4" />
              Day-to-day jobs
            </span>
            <span className={`mt-1 block text-xs leading-5 ${boardMode === "day" ? "text-white/80" : "text-slate-500"}`}>Buyer requests and normal service jobs.</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setBoardMode("shift");
              setShowBidForm(null);
            }}
            className={`rounded-lg px-4 py-3 text-left transition ${boardMode === "shift" ? "bg-red-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}
          >
            <span className="flex items-center gap-2 text-sm font-black">
              <Briefcase className="h-4 w-4" />
              Work shifts
            </span>
            <span className={`mt-1 block text-xs leading-5 ${boardMode === "shift" ? "text-white/80" : "text-slate-500"}`}>Business day-wage and long-duration shift posts.</span>
          </button>
        </div>

        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-3">
          {boardMode === "day" ? (
            <div className="grid gap-3 lg:grid-cols-[1fr_260px_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by city or coarse area"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchJobs()}
                  className="h-11 w-full rounded-full border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="relative block">
                <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white pl-10 pr-8 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All Categories</option>
                  {Object.entries(categoryNames).map(([slug, name]) => (
                    <option key={slug} value={slug}>{name}</option>
                  ))}
                </select>
              </label>
              <button
                onClick={fetchJobs}
                className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="relative block">
                <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={shiftNiche}
                  onChange={(event) => setShiftNiche(event.target.value)}
                  className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white pl-10 pr-8 text-sm font-semibold text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">All my shift niches</option>
                  {SHIFT_NICHES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <button
                onClick={fetchShiftJobs}
                className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700"
              >
                Refresh shifts
              </button>
            </div>
          )}
        </div>

        {boardMode === "day" && !canPlaceBid && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                {verificationLoading ? "Checking provider verification..." : "KYC approval is required before placing bids."}
              </p>
              <p className="mt-1 text-amber-800">You can still browse jobs, but bidding unlocks only after your provider verification is approved.</p>
            </div>
          </div>
        )}

        {boardMode === "day" ? (
          loading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
          ) : jobs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later</p>
          </div>
          ) : (
          <div className="grid gap-5 lg:grid-cols-[430px_minmax(0,1fr)]">
            <section className="space-y-3 lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto lg:pr-1">
              {jobs.map((job) => {
                const active = selectedJob?.id === job.id;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setShowBidForm(null);
                    }}
                    className={`w-full rounded-lg border p-4 text-left transition ${active ? "border-blue-200 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-100 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {job.work_images?.[0] ? (
                        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <img src={job.work_images[0].image_url} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-lg font-bold leading-6 text-blue-950">{jobTitle(job)}</h2>
                        <div className="mt-3 space-y-1.5 text-sm font-semibold text-slate-500">
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {job.address || job.city || "Approximate area"}
                            {job.distance_km != null ? <span className="text-slate-400">· {job.distance_km} km</span> : null}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {job.preferred_date ? new Date(job.preferred_date).toLocaleDateString() : "Flexible date"}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-lg font-black text-blue-950">{budgetLabel(job)}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${categoryColors[job.category_slug] || "bg-slate-100 text-slate-700"}`}>
                        {categoryNames[job.category_slug] || job.category_slug}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-blue-600">
                        <Gavel className="h-4 w-4" />
                        {job.bid_count} offer{job.bid_count === 1 ? "" : "s"}
                      </span>
                      {job.work_image_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <ImageIcon className="h-4 w-4" />
                          {job.work_image_count} photo{job.work_image_count === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                    {job.my_bid ? (
                      <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
                        Your offer: {formatMoney(Number(job.my_bid.amount))} · {job.my_bid.status}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </section>

            {selectedJob ? (
              <section className="rounded-lg border border-slate-200 bg-white p-6 lg:sticky lg:top-20 lg:self-start">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-green-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-green-800">Open</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${categoryColors[selectedJob.category_slug] || "bg-slate-100 text-slate-700"}`}>
                        {categoryNames[selectedJob.category_slug] || selectedJob.category_slug}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">Posted {new Date(selectedJob.submitted_at).toLocaleDateString()}</span>
                    </div>
                    <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-blue-950">{jobTitle(selectedJob)}</h2>

                    <div className="mt-7 grid gap-5 md:grid-cols-3">
                      <div className="flex gap-3">
                        <MapPin className="mt-1 h-5 w-5 text-blue-950" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Approx. location</p>
                          <p className="font-semibold text-slate-800">{selectedJob.address || selectedJob.city || "Shared after acceptance"}</p>
                          {selectedJob.distance_km != null ? <p className="text-sm text-slate-500">{selectedJob.distance_km} km away</p> : null}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Calendar className="mt-1 h-5 w-5 text-blue-950" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">To be done</p>
                          <p className="font-semibold text-slate-800">{selectedJob.preferred_date ? new Date(selectedJob.preferred_date).toLocaleDateString() : "Flexible date"}</p>
                          <p className="text-sm text-slate-500">{selectedJob.preferred_time_start || "Anytime"}{selectedJob.preferred_time_end ? ` - ${selectedJob.preferred_time_end}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Clock className="mt-1 h-5 w-5 text-blue-950" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Workload</p>
                          <p className="font-semibold text-slate-800">{selectedJob.estimated_duration_hours ? `${selectedJob.estimated_duration_hours}h estimated` : "Duration not set"}</p>
                          <p className="text-sm text-slate-500">{selectedJob.number_of_people_needed || 1} people needed</p>
                        </div>
                      </div>
                    </div>

                    {selectedJob.custom_tags && selectedJob.custom_tags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {selectedJob.custom_tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">{tag}</span>
                        ))}
                      </div>
                    )}

                    <h3 className="mt-8 text-xl font-black text-blue-950">Details</h3>
                    <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{jobDescription(selectedJob)}</p>
                    {selectedJob.work_images?.length ? (
                      <div className="mt-8">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-5 w-5 text-blue-700" />
                          <h3 className="text-xl font-black text-blue-950">Job photos</h3>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                          {selectedJob.work_images.map((image, index) => (
                            <a
                              key={image.id}
                              href={image.image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                            >
                              <img src={image.image_url} alt={`Job photo ${index + 1}`} className="h-full w-full object-cover transition hover:scale-105" />
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <aside className="space-y-4">
                    <div className="rounded-lg bg-slate-100 p-6 text-center">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Task budget</p>
                      <p className="mt-2 text-4xl font-black text-blue-950">{budgetLabel(selectedJob)}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">{selectedJob.bid_count} offer{selectedJob.bid_count === 1 ? "" : "s"} so far</p>
                      <Link href={`/pro/jobs/${selectedJob.id}`} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-blue-700 hover:bg-blue-50">
                        Open full page
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>

                    {selectedJob.my_bid ? (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle2 className="h-5 w-5" />
                          <p className="font-black">Your offer is sent</p>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-green-900">{formatMoney(Number(selectedJob.my_bid.amount))} · {selectedJob.my_bid.status}</p>
                        {selectedJob.my_bid.status === "pending" && (
                          <p className="mt-1 text-xs text-green-800">Buyer sees total bid: {formatMoney(calculateBookingTokenBreakdown(Number(selectedJob.my_bid.amount)).buyerTotal)}</p>
                        )}
                      </div>
                    ) : showBidForm === selectedJob.id ? (
                      <div className="rounded-lg border border-slate-200 p-4">
                        <BidForm
                          inquiryId={selectedJob.id}
                          budgetMin={selectedJob.budget_range_min}
                          budgetMax={selectedJob.budget_range_max}
                          onSubmit={handleBidSubmitted}
                          onCancel={() => setShowBidForm(null)}
                        />
                      </div>
                    ) : (
                      <button
                        disabled={!canPlaceBid}
                        onClick={() => setShowBidForm(selectedJob.id)}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        <DollarSign className="h-4 w-4" />
                        {canPlaceBid ? "Make an offer" : "KYC required"}
                      </button>
                    )}

                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-sm font-black text-blue-950">What you can see now</p>
                      <div className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
                        <p>Approximate area only until acceptance.</p>
                        <p>Buyer contact unlocks after paid acceptance.</p>
                        <p>{selectedJob.work_image_count} photo{selectedJob.work_image_count === 1 ? "" : "s"} attached.</p>
                      </div>
                    </div>
                  </aside>
                </div>
              </section>
            ) : null}
          </div>
          )
        ) : shiftLoading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : shiftError || shiftReason ? (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{shiftError ? "Work shifts unavailable" : "Shift profile update needed"}</p>
              <p className="mt-1 text-amber-800">{shiftError || shiftReason}</p>
            </div>
          </div>
        ) : shiftJobs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <Briefcase className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <h3 className="mb-1 text-lg font-semibold text-gray-900">No work shifts found</h3>
            <p className="text-gray-500">When approved businesses post matching shifts, they will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[430px_minmax(0,1fr)]">
            <section className="space-y-3 lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto lg:pr-1">
              {shiftJobs.map((job) => {
                const active = selectedShift?.id === job.id;
                const nicheInfo = getShiftNiche(job.niche);
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedShiftId(job.id)}
                    className={`w-full rounded-lg border p-4 text-left transition ${active ? "border-red-200 bg-red-50 shadow-sm" : "border-slate-200 bg-white hover:border-red-100 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-lg font-bold leading-6 text-blue-950">{job.role_title}</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{job.business?.business_name || "Approved business"}</p>
                        <div className="mt-3 space-y-1.5 text-sm font-semibold text-slate-500">
                          <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{job.city || "Business location"}</p>
                          <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{job.starts_at ? new Date(job.starts_at).toLocaleDateString() : "Flexible date"}</p>
                        </div>
                      </div>
                      <p className="shrink-0 text-lg font-black text-blue-950">€{job.business_preferred_hourly_rate || nicheInfo.hourlyAverage}/h</p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">{nicheInfo.label}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{job.work_type.replaceAll("_", " ")}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-slate-500">
                        <Users className="h-4 w-4" />
                        {job.headcount} worker{job.headcount === 1 ? "" : "s"}
                      </span>
                    </div>
                    {job.myApplication ? (
                      <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-bold text-red-700 ring-1 ring-red-100">
                        Application {job.myApplication.status}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </section>

            {selectedShift ? (
              <section className="rounded-lg border border-slate-200 bg-white p-6 lg:sticky lg:top-20 lg:self-start">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-green-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-green-800">Open</span>
                      <span className="rounded-full bg-red-50 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-red-700">Work shift</span>
                      <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-slate-600">{selectedShift.work_type.replaceAll("_", " ")}</span>
                    </div>
                    <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-blue-950">{selectedShift.role_title}</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">{selectedShift.business?.business_name || "Approved business"}</p>

                    <div className="mt-7 grid gap-5 md:grid-cols-3">
                      <div className="flex gap-3">
                        <MapPin className="mt-1 h-5 w-5 text-blue-950" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Location</p>
                          <p className="font-semibold text-slate-800">{selectedShift.city || "Shared by business"}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Calendar className="mt-1 h-5 w-5 text-blue-950" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Shift date</p>
                          <p className="font-semibold text-slate-800">{selectedShift.starts_at ? new Date(selectedShift.starts_at).toLocaleDateString() : "Flexible date"}</p>
                          {selectedShift.starts_at && selectedShift.ends_at ? (
                            <p className="text-sm text-slate-500">
                              {new Date(selectedShift.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(selectedShift.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Users className="mt-1 h-5 w-5 text-blue-950" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Headcount</p>
                          <p className="font-semibold text-slate-800">{selectedShift.headcount} worker{selectedShift.headcount === 1 ? "" : "s"}</p>
                        </div>
                      </div>
                    </div>

                    <h3 className="mt-8 text-xl font-black text-blue-950">Details</h3>
                    <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{selectedShift.description || "No shift details provided yet."}</p>
                  </div>

                  <aside className="space-y-4">
                    <div className="rounded-lg bg-slate-100 p-6 text-center">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Business preferred rate</p>
                      <p className="mt-2 text-4xl font-black text-blue-950">€{selectedShift.business_preferred_hourly_rate || getShiftNiche(selectedShift.niche).hourlyAverage}/h</p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">Day rate: €{selectedShift.business_preferred_day_rate || getShiftNiche(selectedShift.niche).dayAverage}</p>
                    </div>

                    {selectedShift.myApplication ? (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 text-green-800">
                          {selectedShift.myApplication.payment?.status === "held" || selectedShift.myApplication.payment?.status === "released" ? <WalletCards className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                          <p className="font-black">Application {selectedShift.myApplication.status}</p>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-green-900">
                          {selectedShift.myApplication.payment?.status ? `Payment ${selectedShift.myApplication.payment.status}` : "Waiting for business review"}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => applyForShift(selectedShift)}
                        disabled={applyingShiftId === selectedShift.id}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {applyingShiftId === selectedShift.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
                        Apply for shift
                      </button>
                    )}

                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-sm font-black text-blue-950">How work shifts behave</p>
                      <div className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
                        <p>Only matching shift-worker niches can see these posts.</p>
                        <p>The business accepts applications and pays AnyJob before completion.</p>
                        <p>Shift earnings appear in your wallet after completion is confirmed.</p>
                      </div>
                    </div>
                  </aside>
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
