"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, BarChart3, Briefcase, CheckCircle, DollarSign, Loader2, Star, Users } from "lucide-react";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { formatMoney } from "@/lib/booking-token";

type BookingRow = {
  id: string;
  total_price: number | null;
  service?: { title?: string | null } | { title?: string | null }[] | null;
};

type ReviewRow = {
  id: string;
  rating: number | null;
};

type BadgeRow = {
  id: string;
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function categoryFromBooking(booking: BookingRow) {
  const service = firstRelation(booking.service);
  return service?.title || "Uncategorized";
}

export default function AnalyticsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/provider/dashboard-data", { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(payload.error || "Could not load analytics.");
          return;
        }
        setBookings(payload.bookings || []);
        setReviews(payload.reviews || []);
        setBadges(payload.badges || []);
      } catch {
        setError("Could not load analytics.");
      } finally {
        setLoading(false);
      }
    }

    void loadAnalytics();
  }, []);

  const metrics = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
    const ratings = reviews.map((review) => Number(review.rating || 0)).filter((rating) => rating > 0);
    const averageRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
    const categories = new Map<string, number>();
    bookings.forEach((booking) => {
      const category = categoryFromBooking(booking);
      categories.set(category, (categories.get(category) || 0) + 1);
    });

    return {
      totalRevenue,
      averageRating,
      categoryRows: Array.from(categories.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [bookings, reviews]);

  const cards = [
    { label: "Completed Jobs", value: String(bookings.length), icon: Briefcase, color: "bg-blue-50 text-blue-600" },
    { label: "Collected On Site", value: formatMoney(metrics.totalRevenue), icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "Public Reviews", value: String(reviews.length), icon: Users, color: "bg-indigo-50 text-indigo-600" },
    { label: "Average Rating", value: metrics.averageRating ? `${metrics.averageRating.toFixed(1)}/5` : "New", icon: Star, color: "bg-yellow-50 text-yellow-600" },
    { label: "Badges Earned", value: String(badges.length), icon: Award, color: "bg-purple-50 text-purple-600" },
    { label: "Completion Source", value: "Supabase", icon: CheckCircle, color: "bg-green-50 text-green-600" },
  ];

  return (
    <ProviderLayout>
      <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
          <p className="text-gray-600">Live provider metrics from completed bookings, reviews, and badges.</p>
        </div>

        {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading analytics...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className="bg-white rounded-xl p-5 border border-gray-200">
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${metric.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Completed Jobs by Service</h3>
                </div>
                {metrics.categoryRows.length ? (
                  <div className="space-y-3">
                    {metrics.categoryRows.map(([category, count]) => {
                      const percentage = bookings.length ? Math.round((count / bookings.length) * 100) : 0;
                      return (
                        <div key={category}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{category}</span>
                            <span className="text-sm text-gray-500">{count} job{count === 1 ? "" : "s"} ({percentage}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-200">
                            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                    No completed bookings yet. This chart will populate after completed jobs are recorded.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Readiness Notes</h3>
                <div className="space-y-3 text-sm leading-6 text-gray-600">
                  <p>Analytics are based only on live Supabase records. No sample jobs, GBP demo revenue, or old month labels are shown.</p>
                  <p>Response-time and repeat-client metrics need timestamped booking lifecycle events before they can be calculated accurately.</p>
                  <p>When completed bookings and public reviews exist, this page updates automatically from `/api/provider/dashboard-data`.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ProviderLayout>
  );
}
