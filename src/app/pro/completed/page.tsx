"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle, DollarSign, MapPin, Star, User, UserCircle } from "lucide-react";

import { ProviderLayout } from "@/components/provider/ProviderLayout";

type CompletedBooking = {
  id: string;
  city: string | null;
  address: string | null;
  scheduled_date: string | null;
  total_price: number | null;
  service?: { title: string | null } | null;
  client?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  review?: { rating: number | null; comment: string | null } | null;
};

type BookingReview = {
  booking_id: string;
  rating: number | null;
  comment: string | null;
};

function clientName(job: CompletedBooking) {
  return [job.client?.first_name, job.client?.last_name].filter(Boolean).join(" ") || "Client";
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

export default function CompletedJobsPage() {
  const [jobs, setJobs] = useState<CompletedBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      const response = await fetch("/api/provider/dashboard-data", { cache: "no-store" });
      const payload = response.ok ? await response.json().catch(() => null) : null;
      const bookings = payload?.bookings || [];

      const bookingRows = ((bookings || []) as unknown as Array<CompletedBooking & {
        service?: CompletedBooking["service"] | CompletedBooking["service"][];
        client?: CompletedBooking["client"] | CompletedBooking["client"][];
      }>).map((booking) => ({
        ...booking,
        service: firstRelation(booking.service),
        client: firstRelation(booking.client),
      }));
      const reviews = (payload?.bookingReviews || []) as BookingReview[];
      const reviewsByBooking = new Map((reviews || []).map((review) => [review.booking_id, review]));

      setJobs(bookingRows.map((job) => ({ ...job, review: reviewsByBooking.get(job.id) || null })));
      setLoading(false);
    };

    void loadJobs();
  }, []);

  const stats = useMemo(() => {
    const totalEarnings = jobs.reduce((sum, job) => sum + Number(job.total_price || 0), 0);
    const ratings = jobs.map((job) => Number(job.review?.rating || 0)).filter((rating) => rating > 0);
    const avgRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
    return { totalEarnings, avgRating };
  }, [jobs]);

  return (
    <ProviderLayout>
      <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Completed Jobs</h1>
          <p className="text-gray-600">Completed bookings loaded from Supabase.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Completed</p>
            <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Collected On Site</p>
            <p className="text-2xl font-bold text-green-600">${stats.totalEarnings.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.avgRating ? stats.avgRating.toFixed(1) : "New"}</p>
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl p-5 border border-gray-200 text-sm text-gray-500">Loading completed jobs...</div>
          ) : jobs.length ? jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-start gap-4">
                {job.client?.avatar_url ? (
                  <img src={job.client.avatar_url} alt={clientName(job)} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                    <UserCircle className="w-8 h-8" aria-hidden="true" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{job.service?.title || "Completed booking"}</h3>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span>{clientName(job)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : "No date"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{[job.address, job.city].filter(Boolean).join(", ") || "No location"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-gray-900">${Number(job.total_price || 0).toFixed(0)} collected on site</span>
                    </div>
                  </div>
                  {job.review?.rating ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-4 h-4 ${star <= Number(job.review?.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                        ))}
                      </div>
                      {job.review.comment ? <span className="text-sm text-gray-600">&ldquo;{job.review.comment}&rdquo;</span> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-xl p-5 border border-gray-200 text-sm text-gray-500">No completed Supabase bookings yet.</div>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}
