"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import Link from "next/link";

import { ReviewDisplay } from "@/components/reviews/ReviewDisplay";

type ReceivedReview = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  communication_rating?: number;
  professionalism_rating?: number;
  quality_rating?: number;
  punctuality_rating?: number;
  would_hire_again?: boolean;
  would_work_with_again?: boolean;
  created_at: string;
  reviewer: {
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
  review_type: "buyer_to_seller" | "seller_to_buyer";
};

type ReceivedReviewsPanelProps = {
  mode?: "summary" | "full";
  allReviewsHref?: string;
};

export function ReceivedReviewsPanel({ mode = "full", allReviewsHref }: ReceivedReviewsPanelProps) {
  const [reviews, setReviews] = useState<ReceivedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/reviews?received=true&limit=${mode === "summary" ? 20 : 100}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Could not load reviews");
        }
        if (active) {
          setReviews(payload.reviews || []);
        }
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Could not load reviews");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadReviews();
    return () => {
      active = false;
    };
  }, [mode]);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  const distribution = useMemo(() => {
    const ratings = reviews.map((review) => Math.round(Number(review.rating || 0))).filter((rating) => rating >= 1 && rating <= 5);
    const rows = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: ratings.filter((rating) => rating === stars).length,
    }));
    const maxCount = Math.max(...rows.map((row) => row.count), 0);
    return { rows, maxCount };
  }, [reviews]);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 space-y-3">
          <div className="h-20 animate-pulse rounded bg-gray-100" />
          <div className="h-20 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Reviews received</h4>
            <p className="mt-1 text-sm text-gray-600">
              {mode === "summary" ? "Your public rating summary from completed work." : "Feedback other AnyJob users have left for this account."}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1.5 text-sm font-semibold text-yellow-800">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {reviews.length ? `${average.toFixed(1)} from ${reviews.length}` : "No rating yet"}
          </div>
        </div>
      </div>

      {mode === "summary" ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-4xl font-bold text-gray-950">{reviews.length ? average.toFixed(1) : "New"}</p>
              <p className="mt-1 text-sm text-gray-600">
                {reviews.length} review{reviews.length === 1 ? "" : "s"} received
              </p>
            </div>
            <div className="space-y-2">
              {distribution.rows.map((row) => (
                <div key={row.stars} className="flex items-center gap-2">
                  <span className="flex w-8 items-center gap-1 text-xs font-semibold text-gray-600">
                    {row.stars}
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: distribution.maxCount ? `${(row.count / distribution.maxCount) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-gray-500">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
          {allReviewsHref ? (
            <Link href={allReviewsHref} className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
              See all reviews
            </Link>
          ) : null}
        </div>
      ) : null}

      {mode === "summary" ? null : reviews.length ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewDisplay key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No one has reviewed this account yet.
        </div>
      )}

    </div>
  );
}
