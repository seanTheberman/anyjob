"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Star, Trash2 } from "lucide-react";

type AdminReview = {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  review_type?: string | null;
  service_inquiry_id?: string | null;
  shift_application_id?: string | null;
  business_work_post_id?: string | null;
  is_public?: boolean | null;
  created_at: string;
  reviewer: { name: string; email: string };
  reviewee: { name: string; email: string };
};

function contextLabel(review: AdminReview) {
  if (review.service_inquiry_id) return `Service ${review.service_inquiry_id.slice(0, 8)}`;
  if (review.shift_application_id) return `Shift ${review.shift_application_id.slice(0, 8)}`;
  if (review.business_work_post_id) return `Business job ${review.business_work_post_id.slice(0, 8)}`;
  return "Legacy review";
}

function reviewTypeLabel(value?: string | null) {
  if (value === "buyer_to_seller") return "Buyer to provider";
  if (value === "seller_to_buyer") return "Provider to client";
  return "Review";
}

export function AdminReviewsManager() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadReviews() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/reviews", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(payload.error || "Could not load reviews");
      return;
    }
    setReviews(payload.reviews || []);
  }

  useEffect(() => {
    void loadReviews();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return reviews;
    return reviews.filter((review) =>
      [
        review.title,
        review.comment,
        review.reviewer?.name,
        review.reviewer?.email,
        review.reviewee?.name,
        review.reviewee?.email,
        review.review_type,
        review.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [query, reviews]);

  async function deleteReview(review: AdminReview) {
    const reason = window.prompt("Why is this review being deleted?", "Deceptive or policy-violating review");
    if (!reason) return;

    setDeletingId(review.id);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: review.id, reason }),
    });
    const payload = await response.json().catch(() => ({}));
    setDeletingId(null);

    if (!response.ok) {
      setError(payload.error || "Could not delete review");
      return;
    }

    setReviews((current) => current.filter((item) => item.id !== review.id));
    setMessage("Review deleted and logged.");
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">{filtered.length} reviews shown</p>
            <p className="mt-1 text-xs text-slate-500">Admins can remove deceptive, abusive, or policy-violating reviews.</p>
          </div>
          <label className="relative block w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search reviews"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reviews..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
          </label>
        </div>
      </div>

      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Review</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">From</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Context</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((review) => (
                <tr key={review.id} className="align-top hover:bg-slate-50">
                  <td className="max-w-md px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {Number(review.rating || 0).toFixed(1)}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{reviewTypeLabel(review.review_type)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{review.title || "Untitled review"}</p>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{review.comment || "No comment"}</p>
                    <p className="mt-2 text-xs text-slate-400">{new Date(review.created_at).toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{review.reviewer?.name || "AnyJob user"}</p>
                    <p className="mt-1 text-xs text-slate-500">{review.reviewer?.email || review.reviewer_id}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{review.reviewee?.name || "AnyJob user"}</p>
                    <p className="mt-1 text-xs text-slate-500">{review.reviewee?.email || review.reviewee_id}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {contextLabel(review)}
                    <p className="mt-1 text-xs text-slate-500">{review.is_public === false ? "Hidden" : "Public"}</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => deleteReview(review)}
                      disabled={deletingId === review.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === review.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No reviews match this search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
