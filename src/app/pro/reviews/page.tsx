"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Star, UserCircle } from "lucide-react";

import { ProviderLayout } from "@/components/provider/ProviderLayout";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  reviewer?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

function reviewerName(review: ReviewRow) {
  return [review.reviewer?.first_name, review.reviewer?.last_name].filter(Boolean).join(" ") || "Client";
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      const response = await fetch("/api/provider/dashboard-data", { cache: "no-store" });
      const payload = response.ok ? await response.json().catch(() => null) : null;
      const data = payload?.reviews || [];

      setReviews(((data || []) as unknown as Array<ReviewRow & { reviewer?: ReviewRow["reviewer"] | ReviewRow["reviewer"][] }>).map((review) => ({
        ...review,
        reviewer: firstRelation(review.reviewer),
      })));
      setLoading(false);
    };

    void loadReviews();
  }, []);

  const stats = useMemo(() => {
    const ratings = reviews.map((review) => Number(review.rating || 0)).filter((rating) => rating > 0);
    const distribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: ratings.filter((rating) => Math.round(rating) === stars).length,
    }));
    const maxCount = Math.max(...distribution.map((item) => item.count), 0);
    const average = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

    return { average, distribution, maxCount };
  }, [reviews]);

  return (
    <ProviderLayout>
      <div className="max-w-4xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reviews</h1>
          <p className="text-gray-600">Reviews loaded from Supabase public booking feedback.</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-3 mb-2">
                <span className="text-5xl font-bold text-gray-900">{stats.average ? stats.average.toFixed(1) : "New"}</span>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(stats.average) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {stats.distribution.map((rating) => (
                <div key={rating.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium text-gray-700">{rating.stars}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: stats.maxCount ? `${(rating.count / stats.maxCount) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{rating.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-sm text-gray-500">Loading reviews...</div>
          ) : reviews.length ? reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                {review.reviewer?.avatar_url ? (
                  <img src={review.reviewer.avatar_url} alt={reviewerName(review)} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                    <UserCircle className="w-8 h-8" aria-hidden="true" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{reviewerName(review)}</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{review.created_at ? new Date(review.created_at).toLocaleDateString() : "No date"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <p className="text-gray-700">{review.comment || "No written comment."}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-sm text-gray-500">No Supabase reviews yet.</div>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}
