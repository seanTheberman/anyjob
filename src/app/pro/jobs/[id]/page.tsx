"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { calculateBookingTokenBreakdown, formatMoney } from "@/lib/booking-token";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone,
  Star,
  ArrowLeft,
  Send,
  Loader2,
  Gavel,
  ImageIcon,
  ShieldCheck,
  BriefcaseBusiness,
  Percent,
  Award
} from "lucide-react";

interface JobDetails {
  id: string;
  title: string;
  description: string;
  client: {
    name: string;
    email?: string;
    phone?: string;
    photo?: string;
    rating?: number;
    reviewCount?: number;
  };
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  location: {
    address: string;
    city: string;
    postalCode: string;
  };
  category: string;
  customTags?: string[];
  serviceType: string;
  urgency: string;
  duration: string;
  peopleNeeded: number;
  date: string;
  startTime: string;
  endTime: string;
  materials: string;
  equipment: string;
  postedAt: string;
  status: string;
  bid_count: number;
  my_bid?: {
    amount: number;
    status: string;
  } | null;
  work_image_count: number;
  work_images?: Array<{
    id: string;
    image_url: string;
  }>;
  offers?: Array<{
    id: string;
    providerId: string;
    amount: number;
    buyerTotal: number;
    message: string;
    estimatedDurationHours: number | null;
    availableDate: string | null;
    status: string;
    createdAt: string;
    provider: {
      name: string;
      avatar: string | null;
      rating: number;
      reviewCount: number;
      totalJobs: number;
      completionRate: number;
      serviceCategory: string | null;
      experienceLevel: string | null;
    };
  }>;
  buyerStats?: {
    jobsPosted: number;
    hires: number;
    hireRate: number;
    averageRatingGiven: number;
    ratingsGiven: number;
  };
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeInsightTab, setActiveInsightTab] = useState<"offers" | "buyer">("offers");

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Job not found");
        } else {
          setError("Failed to fetch job details");
        }
        return;
      }
      
      const data = await response.json();
      setJob(data.job);
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError("Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(bidAmount);
    const minBudget = Number(job?.budget.min || 0);
    const maxBudget = Number(job?.budget.max || 0);
    if (!bidAmount.trim()) {
      setError("Enter your bid amount before submitting.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid bid amount greater than 0.");
      return;
    }
    if (minBudget && amount < minBudget) {
      setError(`Your bid is below the client budget minimum of ${job?.budget.currency || "€"}${minBudget}.`);
      return;
    }
    if (maxBudget && amount > maxBudget) {
      setError(`Your bid is above the client budget maximum of ${job?.budget.currency || "€"}${maxBudget}.`);
      return;
    }

    try {
      setSubmittingBid(true);
      setError(null);

      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inquiry_id: jobId,
          amount,
          message: bidMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit bid");
        return;
      }

      // Refresh job details to show the new bid
      await fetchJobDetails();
      
      // Reset form
      setBidAmount("");
      setBidMessage("");
      
    } catch (error) {
      console.error('Error submitting bid:', error);
      setError("Failed to submit bid");
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading) {
    return (
      <ProviderLayout>
        <div className="max-w-4xl mx-auto mt-4 lg:mt-6 flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading job details...</span>
        </div>
      </ProviderLayout>
    );
  }

  if (error || !job) {
    return (
      <ProviderLayout>
        <div className="max-w-4xl mx-auto mt-4 lg:mt-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
            <p className="text-gray-600 mb-6">{error || "This job may have been removed or is no longer available."}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  const existingBid = job.my_bid ?? null;
  const bidAmountValue = parseFloat(bidAmount);
  const hasBidAmount = Number.isFinite(bidAmountValue) && bidAmountValue > 0;
  const feeBreakdown = calculateBookingTokenBreakdown(hasBidAmount ? bidAmountValue : 0);
  const bidValidationError = !bidAmount.trim()
    ? null
    : !hasBidAmount
      ? "Enter a valid bid amount greater than 0."
      : job.budget.min && bidAmountValue < job.budget.min
        ? `Your bid is below the client budget minimum of ${job.budget.currency}${job.budget.min}.`
        : job.budget.max && bidAmountValue > job.budget.max
          ? `Your bid is above the client budget maximum of ${job.budget.currency}${job.budget.max}.`
          : null;
  const offers = job.offers || [];
  const buyerStats = job.buyerStats || { jobsPosted: 0, hires: 0, hireRate: 0, averageRatingGiven: 0, ratingsGiven: 0 };

  return (
    <ProviderLayout>
      <div className="mx-auto max-w-7xl px-1 py-4 lg:py-6">
        <button type="button" onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </button>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-8">
            <section className="rounded-lg border border-slate-200 bg-white p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-green-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-green-800">Open</span>
                <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-slate-600">{job.status}</span>
                <span className="rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-blue-700">{job.bid_count} offer{job.bid_count === 1 ? "" : "s"}</span>
              </div>
              <h1 className="mt-8 max-w-4xl text-5xl font-black leading-tight tracking-tight text-blue-950">{job.title}</h1>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <div className="flex gap-3">
                  <MapPin className="mt-1 h-6 w-6 text-blue-950" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Location</p>
                    <p className="mt-1 font-semibold text-slate-800">{job.location.address}</p>
                    <p className="text-sm text-slate-500">{job.location.city} {job.location.postalCode}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="mt-1 h-6 w-6 text-blue-950" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">To be done on</p>
                    <p className="mt-1 font-semibold text-slate-800">{job.date}</p>
                    <p className="text-sm text-slate-500">{job.startTime} - {job.endTime}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="mt-1 h-6 w-6 text-blue-950" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Workload</p>
                    <p className="mt-1 font-semibold text-slate-800">{job.duration}</p>
                    <p className="text-sm text-slate-500">{job.peopleNeeded} people needed</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-7">
              <h2 className="text-2xl font-black text-blue-950">Details</h2>
              <p className="mt-5 whitespace-pre-wrap text-lg leading-8 text-slate-700">{job.description}</p>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Materials</p>
                  <p className="mt-1 font-semibold text-slate-800">{job.materials || "Not specified"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Equipment</p>
                  <p className="mt-1 font-semibold text-slate-800">{job.equipment || "Not specified"}</p>
                </div>
              </div>
            </section>

            {job.work_images && job.work_images.length > 0 && (
              <section className="rounded-lg border border-slate-200 bg-white p-7">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-700" />
                  <h2 className="text-2xl font-black text-blue-950">Job photos</h2>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {job.work_images.map((image, index) => (
                    <button key={image.id} type="button" onClick={() => window.open(image.image_url, "_blank")} className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <img src={image.image_url} alt={`Work image ${index + 1}`} className="h-full w-full object-cover transition hover:scale-105" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-lg border border-slate-200 bg-white p-7">
              <div className="mx-auto grid max-w-4xl grid-cols-2 rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveInsightTab("offers")}
                  className={`rounded-full px-5 py-3 text-base font-black transition ${activeInsightTab === "offers" ? "bg-blue-950 text-white shadow-sm" : "text-slate-500 hover:text-blue-950"}`}
                >
                  Offers <span className="ml-2 opacity-70">{offers.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInsightTab("buyer")}
                  className={`rounded-full px-5 py-3 text-base font-black transition ${activeInsightTab === "buyer" ? "bg-blue-950 text-white shadow-sm" : "text-slate-500 hover:text-blue-950"}`}
                >
                  Buyer activity
                </button>
              </div>

              {activeInsightTab === "offers" ? (
                <div className="mt-7 space-y-5">
                  {offers.length ? offers.map((offer) => (
                    <article key={offer.id} className="rounded-lg border border-slate-200 bg-white p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-4">
                          {offer.provider.avatar ? (
                            <img src={offer.provider.avatar} alt={offer.provider.name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50">
                              <User className="h-7 w-7 text-blue-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-xl font-black text-blue-950">{offer.provider.name}</h3>
                              <ShieldCheck className="h-5 w-5 text-blue-600" />
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black uppercase text-slate-600">{offer.status}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                {offer.provider.rating ? offer.provider.rating.toFixed(1) : "New"} {offer.provider.reviewCount ? `(${offer.provider.reviewCount})` : ""}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Percent className="h-4 w-4 text-blue-600" />
                                {offer.provider.completionRate}% completion rate
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
                                {offer.provider.totalJobs} previous job{offer.provider.totalJobs === 1 ? "" : "s"}
                              </span>
                            </div>
                            {(offer.provider.serviceCategory || offer.provider.experienceLevel) ? (
                              <p className="mt-2 text-sm font-semibold text-slate-500">
                                {[offer.provider.serviceCategory, offer.provider.experienceLevel].filter(Boolean).join(" · ")}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="shrink-0 rounded-lg bg-slate-50 px-4 py-3 text-right">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Buyer sees</p>
                          <p className="text-2xl font-black text-blue-950">{formatMoney(offer.buyerTotal, job.budget.currency)}</p>
                        </div>
                      </div>

                      {offer.message ? (
                        <p className="mt-5 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-base leading-7 text-slate-700">{offer.message}</p>
                      ) : (
                        <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">No message added with this offer.</p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                        <span>Provider quote: {formatMoney(offer.amount, job.budget.currency)}</span>
                        {offer.estimatedDurationHours ? <span>Estimated: {offer.estimatedDurationHours}h</span> : null}
                        {offer.availableDate ? <span>Available: {new Date(offer.availableDate).toLocaleDateString()}</span> : null}
                        <span>Sent {new Date(offer.createdAt).toLocaleDateString()}</span>
                      </div>
                    </article>
                  )) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <Gavel className="mx-auto h-9 w-9 text-slate-300" />
                      <h3 className="mt-3 text-lg font-black text-slate-800">No offers yet</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">Your offer can be the first one the buyer receives.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-7 rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-white p-4">
                      <BriefcaseBusiness className="h-5 w-5 text-blue-700" />
                      <p className="mt-3 text-3xl font-black text-blue-950">{buyerStats.jobsPosted}</p>
                      <p className="text-sm font-bold text-slate-500">Jobs posted by buyer</p>
                    </div>
                    <div className="rounded-lg bg-white p-4">
                      <Award className="h-5 w-5 text-emerald-700" />
                      <p className="mt-3 text-3xl font-black text-blue-950">{buyerStats.hireRate}%</p>
                      <p className="text-sm font-bold text-slate-500">Hire rate</p>
                    </div>
                    <div className="rounded-lg bg-white p-4">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <p className="mt-3 text-3xl font-black text-blue-950">{buyerStats.averageRatingGiven ? buyerStats.averageRatingGiven.toFixed(1) : "New"}</p>
                      <p className="text-sm font-bold text-slate-500">Avg rating given</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">
                    This buyer has hired providers for {buyerStats.hires} of {buyerStats.jobsPosted} posted job{buyerStats.jobsPosted === 1 ? "" : "s"}.
                    {buyerStats.ratingsGiven ? ` They have left ${buyerStats.ratingsGiven} provider rating${buyerStats.ratingsGiven === 1 ? "" : "s"}.` : " They have not left provider ratings yet."}
                  </p>
                </div>
              )}
            </section>

            {/* Bidding Section */}
            {!existingBid ? (
              <section className="rounded-lg border border-slate-200 bg-white p-7">
                  <div className="mb-5 flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-blue-700" />
                    <h2 className="text-2xl font-black text-blue-950">Make an offer</h2>
                  </div>
                  <form onSubmit={handleSubmitBid} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Your Bid Amount ({job.budget.currency})
                      </label>
                      <input
                        type="number"
                        min={job.budget.min}
                        max={job.budget.max * 1.5}
                        step="0.01"
                        value={bidAmount}
                        onChange={(e) => {
                          setBidAmount(e.target.value);
                          setError(null);
                        }}
                        placeholder={`Enter amount between ${job.budget.min} - ${job.budget.max}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Client budget: {job.budget.currency} {job.budget.min} - {job.budget.max}
                      </p>
                    </div>

                    {hasBidAmount && bidValidationError ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                        {bidValidationError}
                      </div>
                    ) : null}

                    {hasBidAmount && !bidValidationError && (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Your job payout</span>
                          <span className="font-semibold text-gray-900">
                            {formatMoney(feeBreakdown.onsiteDue, job.budget.currency)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-gray-600">AnyJob fee added to buyer</span>
                          <span className="font-semibold text-gray-900">
                            {formatMoney(feeBreakdown.bookingToken, job.budget.currency)}
                          </span>
                        </div>
                        <div className="mt-3 border-t border-red-100 pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Buyer sees total bid</span>
                            <span className="text-lg font-bold text-gray-900">
                              {formatMoney(feeBreakdown.buyerTotal, job.budget.currency)}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-gray-600">
                            The buyer is shown one total bid. AnyJob collects the fee when the buyer accepts; you collect your job payout at the location.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Message to Client (Optional)
                      </label>
                      <textarea
                        value={bidMessage}
                        onChange={(e) => setBidMessage(e.target.value)}
                        placeholder="Introduce yourself and explain why you're the right person for this job..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={submittingBid}
                      className="inline-flex h-12 w-full items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {submittingBid ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Bid
                        </>
                      )}
                    </button>
                  </form>
              </section>
            ) : (
              <section className="rounded-lg border border-green-200 bg-green-50 p-7">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <ShieldCheck className="h-6 w-6 text-green-700" />
                    </div>
                    <h3 className="mb-2 text-lg font-black text-green-950">Offer already submitted</h3>
                      <p className="mb-2 text-green-900">
                      You have already submitted a quote of {formatMoney(Number(existingBid.amount), job.budget.currency)}.
                      AnyJob will add its fee to the buyer&apos;s total bid.
                    </p>
                    <p className="text-sm text-green-800">
                      Status: <Badge variant="outline">{existingBid.status}</Badge>
                    </p>
                  </div>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-lg bg-slate-100 p-7 text-center">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Task budget</p>
              <p className="mt-3 text-5xl font-black text-blue-950">{job.budget.currency}{job.budget.min} - {job.budget.max}</p>
              <button
                type="button"
                disabled={Boolean(existingBid)}
                onClick={() => document.querySelector("form")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="mt-7 inline-flex h-14 w-full items-center justify-center rounded-full bg-blue-600 px-5 text-lg font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"
              >
                {existingBid ? "Offer sent" : "Make an offer"}
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-black text-blue-950">Client information</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">{job.client.name}</h4>
                    {job.client.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span>{job.client.rating}</span>
                        {job.client.reviewCount && (
                          <span className="text-gray-500">({job.client.reviewCount} reviews)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {job.client.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{job.client.phone}</span>
                  </div>
                )}
                
                {job.client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{job.client.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-black text-blue-950">Job statistics</h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Posted</span>
                  <span className="text-sm font-medium">{job.postedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant="outline">{job.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Bids</span>
                  <span className="text-sm font-medium">{job.bid_count}</span>
                </div>
                {job.work_image_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Images</span>
                    <span className="text-sm font-medium">{job.work_image_count}</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ProviderLayout>
  );
}
