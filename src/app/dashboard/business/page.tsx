"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Building2, CheckCircle2, Clock, CreditCard, FileText, Headphones, Loader2, Plus, ShieldCheck, Star, Users, WalletCards } from "lucide-react";
import { ReviewForm, type ReviewData } from "@/components/reviews/ReviewForm";

type BusinessProfile = {
  id: string;
  business_name: string;
  registration_number: string;
  status: string;
  industry: string;
  document_url: string;
  rejection_reason?: string | null;
};

type BusinessPost = {
  id: string;
  work_type: string;
  role_title: string;
  niche: string;
  city: string;
  status: string;
  created_at: string;
};

type ShiftApplication = {
  id: string;
  business_work_post_id: string;
  provider_user_id: string;
  status: string;
  proposed_hourly_rate?: number | null;
  proposed_day_rate?: number | null;
  message?: string | null;
  provider?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    city?: string | null;
    is_verified?: boolean | null;
  } | null;
  seller?: {
    rating?: number | null;
    total_jobs?: number | null;
    status?: string | null;
  } | null;
  payment?: {
    id: string;
    status: string;
    agreed_amount: number;
    total_charged: number;
    currency: string;
  } | null;
  reviews?: Array<{
    id: string;
    review_type: "buyer_to_seller" | "seller_to_buyer";
    reviewer_id: string;
    reviewee_id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
  }>;
};

type ReviewTarget = {
  application: ShiftApplication;
  providerName: string;
};

function StatusPill({ value }: { value: string }) {
  const lower = value.toLowerCase();
  const classes = lower === "approved"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : lower === "rejected" || lower === "suspended"
      ? "bg-red-50 text-red-700 ring-red-100"
      : "bg-amber-50 text-amber-700 ring-amber-100";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classes}`}>{value}</span>;
}

export default function BusinessDashboardPage() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [posts, setPosts] = useState<BusinessPost[]>([]);
  const [applications, setApplications] = useState<ShiftApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setActionError(null);
    try {
      const businessResponse = await fetch("/api/business/register");
      if (businessResponse.ok) {
        const payload = await businessResponse.json();
        const nextBusiness = payload.business || null;
        setBusiness(nextBusiness);

        if (!nextBusiness) {
          setPosts([]);
          setApplications([]);
          return;
        }
      } else {
        setBusiness(null);
        setPosts([]);
        setApplications([]);
        return;
      }

      const [postsResponse, applicationsResponse] = await Promise.all([
        fetch("/api/business/posts"),
        fetch("/api/business/shift-applications"),
      ]);

      if (postsResponse.ok) {
        const payload = await postsResponse.json();
        setPosts(payload.posts || []);
      }
      if (applicationsResponse.ok) {
        const payload = await applicationsResponse.json();
        setApplications(payload.applications || []);
      }
    } catch {
      setActionError("Unable to load business workspace");
    } finally {
      setLoading(false);
    }
  }

  async function runShiftAction(applicationId: string, action: string) {
    setActionId(`${applicationId}:${action}`);
    setActionError(null);
    try {
      const response = await fetch("/api/business/shift-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, action }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionError(payload.error || "Unable to update shift application");
        return;
      }
      if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }
      await load();
    } catch {
      setActionError("Unable to update shift application");
    } finally {
      setActionId(null);
    }
  }

  async function submitShiftReview(review: ReviewData) {
    if (!reviewTarget) return;
    setReviewLoading(true);
    setActionError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...review,
          shift_application_id: reviewTarget.application.id,
          reviewee_id: reviewTarget.application.provider_user_id,
          review_type: "buyer_to_seller",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionError(payload.error || "Unable to submit shift review");
        return;
      }
      setReviewTarget(null);
      await load();
    } catch {
      setActionError("Unable to submit shift review");
    } finally {
      setReviewLoading(false);
    }
  }

  const applicationsByPost = applications.reduce((map, application) => {
    const current = map.get(application.business_work_post_id) || [];
    current.push(application);
    map.set(application.business_work_post_id, current);
    return map;
  }, new Map<string, ShiftApplication[]>());

  const explainerCards = [
    {
      title: "What “business” means",
      body: "Use this if you are hiring on behalf of a company, shop, agency, property operation, venue, clinic, restaurant, warehouse, care provider, or any organisation that needs workers for business work.",
      icon: Building2,
    },
    {
      title: "What shift jobs are",
      body: "Shift jobs are scheduled worker needs: a cleaner for Friday 9-5, a healthcare assistant for a day, event staff for a venue, retail cover, hospitality cover, logistics help, or recurring weekly support.",
      icon: Clock,
    },
    {
      title: "How payment works",
      body: "For shift work, the business agrees the amount and pays AnyJob first. AnyJob holds the payment, then credits/releases the provider based on completed work.",
      icon: WalletCards,
    },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
            <h1 className="text-2xl font-bold text-gray-950">Business</h1>
            <p className="text-sm text-gray-600">For companies and organisations that need workers, scheduled cover, or business service support.</p>
            </div>
            <Link
              href="/dashboard/assistance/new?type=business"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Headphones className="h-4 w-4" />
              Business support
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading business workspace...
          </div>
        ) : !business ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-8">
              <div className="mx-auto max-w-3xl text-center">
                <Building2 className="mx-auto mb-4 h-10 w-10 text-red-600" />
                <h2 className="text-xl font-bold text-gray-950">Business registration required</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  This area is not for normal home-service requests. It is for verified businesses that want to post work for providers, hire shift workers, or manage scheduled staffing through AnyJob.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {explainerCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left">
                      <Icon className="mb-3 h-5 w-5 text-red-600" />
                      <h3 className="font-semibold text-gray-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{item.body}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-semibold text-amber-950">What you need to register</h3>
                <div className="mt-3 grid gap-3 text-sm text-amber-900 md:grid-cols-2">
                  <p><span className="font-semibold">Business name:</span> the legal or trading name customers/workers should see.</p>
                  <p><span className="font-semibold">Registration number:</span> CRO number, company number, VAT, tax, or local business identifier.</p>
                  <p><span className="font-semibold">Business document:</span> registration certificate, tax proof, insurance, or other document admin can verify.</p>
                  <p><span className="font-semibold">Work details:</span> role, location, dates, times, rates, and what the worker must do.</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-3 text-center">
                <Link href="/register-business" className="inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                  Start business registration
                </Link>
                <p className="max-w-xl text-xs leading-5 text-gray-500">
                  If you only need a cleaner, handyman, mover, tutor, pet carer, or other provider for your own personal request, use the normal booking flow instead of business registration.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {explainerCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <Icon className="mb-3 h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-gray-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{item.body}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-950">{business.business_name}</h2>
                    <StatusPill value={business.status} />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Registration number: {business.registration_number}</p>
                  <p className="text-sm text-gray-600">Industry: {business.industry}</p>
                  {business.rejection_reason ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{business.rejection_reason}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/dashboard/business/jobs/new"
                    className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold ${
                      business.status === "approved"
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "cursor-not-allowed bg-gray-100 text-gray-400"
                    }`}
                    aria-disabled={business.status !== "approved"}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Post work
                  </Link>
                  <Link
                    href="/dashboard/business/workers"
                    className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold ${
                      business.status === "approved"
                        ? "border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "cursor-not-allowed border-gray-100 text-gray-400"
                    }`}
                    aria-disabled={business.status !== "approved"}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Browse workers
                  </Link>
                </div>
              </div>

              {business.status !== "approved" ? (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Posting is locked until admin approval.</p>
                    <p className="mt-1 text-amber-800">Admin must approve the business registration number and document before any business job or shift can be uploaded.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Business approved.</p>
                    <p className="mt-1 text-emerald-800">You can post freelance business jobs, part-time day-wage work, and long-duration shift work.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <h2 className="font-semibold text-gray-950">Business posts</h2>
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              {actionError ? <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div> : null}
              {posts.length ? (
                <div className="divide-y divide-gray-100">
                  {posts.map((post) => {
                    const postApplications = applicationsByPost.get(post.id) || [];
                    return (
                    <div key={post.id} className="p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-gray-950">{post.role_title}</p>
                          <p className="text-sm text-gray-600">{post.work_type.replaceAll("_", " ")} · {post.niche} · {post.city}</p>
                        </div>
                        <StatusPill value={post.status} />
                      </div>
                      {postApplications.length ? (
                        <div className="mt-4 space-y-3">
                          {postApplications.map((application) => {
                            const providerName = `${application.provider?.first_name || ""} ${application.provider?.last_name || ""}`.trim() || application.provider?.email || "Shift worker";
                            const paymentStatus = application.payment?.status;
                            const providerReview = (application.reviews || []).find((review) => review.review_type === "buyer_to_seller");
                            return (
                              <div key={application.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold text-gray-950">{providerName}</p>
                                      <StatusPill value={application.status} />
                                      {paymentStatus ? <StatusPill value={`payment ${paymentStatus}`} /> : null}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">
                                      {application.provider?.city || "City not set"} · Rating {Number(application.seller?.rating || 0).toFixed(1)} · {application.seller?.total_jobs || 0} jobs
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600">
                                      Proposed: €{application.proposed_hourly_rate || "-"} / hour · €{application.proposed_day_rate || "-"} / day
                                    </p>
                                    {application.payment ? (
                                      <p className="mt-1 text-sm font-medium text-gray-900">
                                        Business pays AnyJob: €{application.payment.total_charged} · Provider amount: €{application.payment.agreed_amount}
                                      </p>
                                    ) : null}
                                    {providerReview ? (
                                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                        Reviewed provider: {providerReview.rating}/5
                                      </p>
                                    ) : null}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {application.status === "applied" ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => runShiftAction(application.id, "accept")}
                                          disabled={Boolean(actionId)}
                                          className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                        >
                                          {actionId === `${application.id}:accept` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                          Accept
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => runShiftAction(application.id, "reject")}
                                          disabled={Boolean(actionId)}
                                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                        >
                                          Reject
                                        </button>
                                      </>
                                    ) : null}
                                    {application.status === "accepted" && (!paymentStatus || paymentStatus === "requires_payment") ? (
                                      <button
                                        type="button"
                                        onClick={() => runShiftAction(application.id, "pay")}
                                        disabled={Boolean(actionId)}
                                        className="inline-flex items-center rounded-lg bg-gray-950 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                                      >
                                        {actionId === `${application.id}:pay` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                                        Pay full amount to AnyJob
                                      </button>
                                    ) : null}
                                    {application.status === "accepted" && paymentStatus === "held" ? (
                                      <button
                                        type="button"
                                        onClick={() => runShiftAction(application.id, "complete")}
                                        disabled={Boolean(actionId)}
                                        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                      >
                                        {actionId === `${application.id}:complete` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WalletCards className="mr-2 h-4 w-4" />}
                                        Confirm work done
                                      </button>
                                    ) : null}
                                    {application.status === "completed" && !providerReview ? (
                                      <button
                                        type="button"
                                        onClick={() => setReviewTarget({ application, providerName })}
                                        className="inline-flex items-center rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                                      >
                                        <Star className="mr-2 h-4 w-4" />
                                        Review provider
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : post.work_type !== "freelance_service" ? (
                        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                          No shift worker applications yet.
                        </div>
                      ) : null}
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-gray-500">No business posts yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
      <ReviewForm
        isOpen={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        onSubmit={submitShiftReview}
        revieweeName={reviewTarget?.providerName || "provider"}
        reviewType="buyer_to_seller"
        loading={reviewLoading}
      />
    </DashboardLayout>
  );
}
