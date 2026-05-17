"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { useState, useEffect } from "react";
import { MapPin, Calendar, DollarSign, Clock, Search, Filter, Gavel, ImageIcon, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { BidForm } from "@/components/bids/BidForm";
import { calculateBookingTokenBreakdown, formatMoney } from "@/lib/booking-token";

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
  custom_tags?: string[] | null;
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
  custom: "Custom Job",
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
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [showBidForm, setShowBidForm] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchCity) params.set("city", searchCity);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory]);

  const handleBidSubmitted = () => {
    setShowBidForm(null);
    fetchJobs();
  };

  return (
    <ProviderLayout>
      <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
          <p className="text-gray-600">Find jobs in your area and place competitive bids</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchJobs()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                <option value="">All Categories</option>
                {Object.entries(categoryNames).map(([slug, name]) => (
                  <option key={slug} value={slug}>{name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchJobs}
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-4">{jobs.length} job{jobs.length !== 1 ? "s" : ""} available</p>
        )}

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[job.category_slug] || "bg-gray-100 text-gray-700"}`}>
                          {categoryNames[job.category_slug] || job.category_slug}
                        </span>
                        {job.bid_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Gavel className="w-3 h-3" />
                            {job.bid_count} bid{job.bid_count !== 1 ? "s" : ""}
                          </span>
                        )}
                        {job.work_image_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <ImageIcon className="w-3 h-3" />
                            {job.work_image_count} photo{job.work_image_count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      {job.custom_tags && job.custom_tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {job.custom_tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-gray-800 text-sm leading-relaxed line-clamp-2">
                        {job.job_description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">
                        €{job.budget_range_min} - €{job.budget_range_max}
                      </p>
                      <p className="text-xs text-gray-500">Budget</p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.city}
                    </span>
                    {job.preferred_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(job.preferred_date).toLocaleDateString()}
                      </span>
                    )}
                    {job.estimated_duration_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {job.estimated_duration_hours}h
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Posted {new Date(job.submitted_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {job.my_bid ? (
                      <div className="space-y-1">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                          job.my_bid.status === "accepted" ? "bg-green-100 text-green-700" :
                          job.my_bid.status === "rejected" ? "bg-red-100 text-red-700" :
                          job.my_bid.status === "withdrawn" ? "bg-gray-100 text-gray-500" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          <Gavel className="w-4 h-4" />
                          {job.my_bid.status === "pending" ? `Your quote: ${formatMoney(Number(job.my_bid.amount))}` :
                           job.my_bid.status === "accepted" ? "Quote accepted" :
                           job.my_bid.status === "rejected" ? "Quote declined" :
                           "Quote withdrawn"}
                        </div>
                        {job.my_bid.status === "pending" && (
                          <p className="text-xs text-gray-500">
                            Client total: {formatMoney(calculateBookingTokenBreakdown(Number(job.my_bid.amount)).buyerTotal)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowBidForm(showBidForm === job.id ? null : job.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        <DollarSign className="w-4 h-4" />
                        Place Bid
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      className="flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                    >
                      {expandedJob === job.id ? (
                        <>Less <ChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>Details <ChevronDown className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedJob === job.id && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-sm">
                      <div>
                        <p className="text-gray-500">Subcategory</p>
                        <p className="font-medium text-gray-900">
                          {job.category_slug === "custom" ? "Flexible request" : job.subcategory_slug}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Address</p>
                        <p className="font-medium text-gray-900">{job.address}</p>
                      </div>
                      {job.preferred_time_start && (
                        <div>
                          <p className="text-gray-500">Time</p>
                          <p className="font-medium text-gray-900">{job.preferred_time_start} - {job.preferred_time_end || "TBD"}</p>
                        </div>
                      )}
                      {job.number_of_people_needed > 0 && (
                        <div>
                          <p className="text-gray-500">People Needed</p>
                          <p className="font-medium text-gray-900">{job.number_of_people_needed}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Full Description</p>
                      <p className="text-gray-800 text-sm leading-relaxed">{job.job_description}</p>
                    </div>
                  </div>
                )}

                {/* Bid Form */}
                {showBidForm === job.id && !job.my_bid && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    <BidForm
                      inquiryId={job.id}
                      budgetMin={job.budget_range_min}
                      budgetMax={job.budget_range_max}
                      onSubmit={handleBidSubmitted}
                      onCancel={() => setShowBidForm(null)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}
