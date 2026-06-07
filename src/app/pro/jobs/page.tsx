"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MapPin, Calendar, DollarSign, Clock, Search, Filter, Gavel, ImageIcon, Loader2, ShieldAlert, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { BidForm } from "@/components/bids/BidForm";
import { calculateBookingTokenBreakdown, formatMoney } from "@/lib/booking-token";
import { useSellerVerification } from "@/hooks/useSellerVerification";

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

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showBidForm, setShowBidForm] = useState<string | null>(null);
  const { verificationStatus, loading: verificationLoading } = useSellerVerification();

  const canPlaceBid = Boolean(verificationStatus?.isVerified);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchCity) params.set("city", searchCity);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const nextJobs = data.jobs || [];
        setJobs(nextJobs);
        setSelectedJobId((current) => current && nextJobs.some((job: Job) => job.id === current) ? current : nextJobs[0]?.id || null);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchCity]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleBidSubmitted = () => {
    setShowBidForm(null);
    fetchJobs();
  };
  const selectedJob = jobs.find((job) => job.id === selectedJobId) || jobs[0] || null;

  const budgetLabel = (job: Job) => {
    const min = Number(job.budget_range_min || 0);
    const max = Number(job.budget_range_max || 0);
    if (min && max) return `€${min} - €${max}`;
    if (min) return `from €${min}`;
    if (max) return `up to €${max}`;
    return "Open budget";
  };

  const jobTitle = (job: Job) => {
    const text = job.job_description?.trim();
    if (!text) return categoryNames[job.category_slug] || "Service request";
    return text.split(/[.!?]/)[0]?.slice(0, 74) || text.slice(0, 74);
  };

  return (
    <ProviderLayout>
      <div className="mx-auto max-w-7xl px-1 py-4 lg:py-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-600">Provider work board</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-blue-950">Browse jobs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Pick a request, inspect the details, then send one clear total offer. Exact contact unlocks after the buyer accepts and pays the AnyJob fee.</p>
          </div>
          {!loading && (
            <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
              {jobs.length} live job{jobs.length === 1 ? "" : "s"}
            </div>
          )}
        </div>

        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-3">
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
        </div>

        {!canPlaceBid && (
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

        {loading ? (
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
                    <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{selectedJob.job_description || "No description provided."}</p>
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
        )}
      </div>
    </ProviderLayout>
  );
}
