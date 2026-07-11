"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Briefcase, Calendar, CheckCircle2, Clock, Loader2, MapPin, Search, ShieldAlert, Star, Users, WalletCards } from "lucide-react";
import { SHIFT_NICHES, getShiftNiche } from "@/lib/shift-work";
import { ReviewForm, type ReviewData } from "@/components/reviews/ReviewForm";

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
    myReview?: { id: string; review_type: string; rating: number; title?: string | null; comment?: string | null } | null;
  } | null;
};

type ShiftReviewTarget = {
  job: ShiftJob;
  businessName: string;
};

export default function ProviderShiftBoardPage() {
  const [niche, setNiche] = useState("");
  const [jobs, setJobs] = useState<ShiftJob[]>([]);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ShiftReviewTarget | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  async function reloadJobs() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (niche) params.set("niche", niche);
    const response = await fetch(`/api/shifts?${params.toString()}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Unable to load shift jobs");
      setJobs([]);
    } else {
      setJobs(payload.jobs || []);
      setReason(payload.reason || null);
    }
    setLoading(false);
  }

  useEffect(() => {
    reloadJobs();
  }, [niche]);

  async function applyForShift(job: ShiftJob) {
    setApplyingId(job.id);
    setError(null);
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
        setError(payload.error || "Unable to apply for shift");
        return;
      }
      await reloadJobs();
    } catch {
      setError("Unable to apply for shift");
    } finally {
      setApplyingId(null);
    }
  }

  async function submitShiftReview(review: ReviewData) {
    if (!reviewTarget?.job.myApplication) return;
    setReviewLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...review,
          shift_application_id: reviewTarget.job.myApplication.id,
          review_type: "seller_to_buyer",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Unable to submit shift review");
        return;
      }
      setReviewTarget(null);
      await reloadJobs();
    } catch {
      setError("Unable to submit shift review");
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <ProviderLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-950">Shift Board</h1>
          <p className="text-sm text-gray-600">Business day-wage and shift posts matched to your shift-worker niches.</p>
        </div>

        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <select value={niche} onChange={(event) => setNiche(event.target.value)} className="w-full bg-transparent text-sm outline-none">
                <option value="">All my shift niches</option>
                {SHIFT_NICHES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <Link href="/become-provider" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Update work mode
            </Link>
          </div>
        </div>

        {error || reason ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{error ? "Shift board unavailable" : "Shift profile update needed"}</p>
              <p className="mt-1">{error || reason}</p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-gray-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading shift jobs...
          </div>
        ) : jobs.length ? (
          <div className="space-y-4">
            {jobs.map((job) => {
              const nicheInfo = getShiftNiche(job.niche);
              return (
                <article key={job.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">{nicheInfo.label}</span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{job.work_type.replaceAll("_", " ")}</span>
                      </div>
                      <h2 className="text-lg font-bold text-gray-950">{job.role_title}</h2>
                      <p className="mt-1 text-sm text-gray-600">{job.business?.business_name || "Approved business"}</p>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-lg font-bold text-gray-950">€{job.business_preferred_hourly_rate || nicheInfo.hourlyAverage}/h</p>
                      <p className="text-xs text-gray-500">Business preferred rate</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-700">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.city}
                    </span>
                    {job.starts_at ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(job.starts_at).toLocaleDateString()}
                      </span>
                    ) : null}
                    {job.starts_at && job.ends_at ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(job.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(job.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.headcount} worker{job.headcount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-950">
                        {job.myApplication ? `Application ${job.myApplication.status}` : "Apply for this shift"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {job.myApplication?.payment?.status === "held"
                          ? "Business has paid AnyJob. Wallet credit is pending completion."
                          : job.myApplication?.payment?.status === "released"
                            ? "Shift completed. Credit is available in your wallet."
                            : job.myApplication
                              ? "The business can now accept, pay AnyJob, and complete the shift."
                              : "Your application uses the posted rate. You can adjust rates from your shift profile later."}
                      </p>
                      {job.myApplication?.myReview ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          You reviewed this business {job.myApplication.myReview.rating}/5
                        </p>
                      ) : null}
                    </div>
                    {job.myApplication ? (
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700">
                          {job.myApplication.payment?.status === "held" || job.myApplication.payment?.status === "released" ? <WalletCards className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          {job.myApplication.payment?.status ? `Payment ${job.myApplication.payment.status}` : job.myApplication.status}
                        </span>
                        {job.myApplication.status === "completed" && !job.myApplication.myReview ? (
                          <button
                            type="button"
                            onClick={() => setReviewTarget({ job, businessName: job.business?.business_name || "business" })}
                            className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Review business
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => applyForShift(job)}
                        disabled={applyingId === job.id}
                        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {applyingId === job.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Apply for shift
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <h2 className="font-semibold text-gray-950">No matching shift jobs</h2>
            <p className="mt-1 text-sm text-gray-500">When approved businesses post jobs in your niche, or when your shift applications move forward, they will appear here.</p>
          </div>
        )}
      </div>
      <ReviewForm
        isOpen={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        onSubmit={submitShiftReview}
        revieweeName={reviewTarget?.businessName || "business"}
        reviewType="seller_to_buyer"
        loading={reviewLoading}
      />
    </ProviderLayout>
  );
}
