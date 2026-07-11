"use client";

import { Search, SlidersHorizontal, MapPin, DollarSign, Calendar, ChevronRight, UserCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { JobApplicationGuard } from "./JobApplicationGuard";
import { Job } from "@/types/jobs";

interface JobFilters {
  keyword: string;
  jobType: string;
  minAmount: string;
  maxAmount: string;
  city: string;
  state: string;
  urgency: string;
}

interface JobListingProps {
  jobs: Job[];
}

export function JobListing({ jobs }: JobListingProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({
    keyword: "",
    jobType: "",
    minAmount: "",
    maxAmount: "",
    city: "",
    state: "",
    urgency: "",
  });

  const filteredJobs = jobs.filter((job) => {
    const keyword = filters.keyword.trim().toLowerCase();
    const city = filters.city.trim().toLowerCase();
    const state = filters.state.trim().toLowerCase();
    const minAmount = filters.minAmount ? Number(filters.minAmount) : null;
    const maxAmount = filters.maxAmount ? Number(filters.maxAmount) : null;

    const keywordText = [
      job.title,
      job.description,
      job.client.name,
      job.location.city,
      job.location.state,
      job.category,
    ].filter(Boolean).join(" ").toLowerCase();

    const matchesKeyword = !keyword || keywordText.includes(keyword);
    const matchesType = !filters.jobType || job.category.toLowerCase().includes(filters.jobType.toLowerCase());
    const matchesCity = !city || (job.location.city || "").toLowerCase().includes(city);
    const matchesState = !state || (job.location.state || "").toLowerCase().includes(state);
    const matchesUrgency = !filters.urgency || job.urgency === filters.urgency;
    const matchesMin = minAmount === null || Number.isNaN(minAmount) || job.budget.max >= minAmount;
    const matchesMax = maxAmount === null || Number.isNaN(maxAmount) || job.budget.min <= maxAmount;

    return matchesKeyword && matchesType && matchesCity && matchesState && matchesUrgency && matchesMin && matchesMax;
  });

  const urgencyColors = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  const urgencyLabels = {
    low: "Flexible",
    medium: "Soon",
    high: "Emergency",
  };

  return (
    <div>
      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs by keyword..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium">Filters</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select
                value={filters.jobType}
                onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="cleaning">Cleaning</option>
                <option value="handyman">Handyman</option>
                <option value="moving">Moving</option>
                <option value="gardening">Gardening</option>
                <option value="childcare">Childcare</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                placeholder="Enter city"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
              <input
                type="text"
                placeholder="Enter county"
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <select
                value={filters.urgency}
                onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="low">Flexible</option>
                <option value="medium">Soon</option>
                <option value="high">Emergency</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({
                    keyword: "",
                    jobType: "",
                    minAmount: "",
                    maxAmount: "",
                    city: "",
                    state: "",
                    urgency: "",
                  })
                }
                className="w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Job List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
            No jobs match the current filters.
          </div>
        )}

        {filteredJobs.map((job) => {
          const clientRating = Number(job.client.rating || 0);
          const clientReviewCount = Number(job.client.reviewCount || 0);
          const hasClientRating = clientRating > 0 && clientReviewCount > 0;

          return (
          <JobApplicationGuard key={job.id}>
            <Link
              href={`/pro/jobs/${job.id}`}
              className="block bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow"
            >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                  {job.isInStream && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      In Your Stream
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${urgencyColors[job.urgency]}`}>
                    {urgencyLabels[job.urgency]}
                  </span>
                </div>
                <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>

                {/* Client Info */}
                <div className="flex items-center gap-3 mb-3">
                  {job.client.photo ? (
                    <img
                      src={job.client.photo}
                      alt={job.client.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                      <UserCircle className="w-6 h-6" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{job.client.name}</span>
                    {hasClientRating ? (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm text-gray-500">
                        {clientRating.toFixed(1)} ({clientReviewCount})
                      </span>
                    </div>
                    ) : null}
                  </div>
                </div>

                {/* Job Details */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium text-gray-900">
                      {job.budget.currency}
                      {job.budget.min}-{job.budget.max}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {[job.location.city, job.location.state].filter(Boolean).join(", ") || "Location not set"}
                    </span>
                    {job.location.distance && (
                      <span className="text-gray-400">• {job.location.distance}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{job.postedAt}</span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </Link>
          </JobApplicationGuard>
          );
        })}
      </div>
    </div>
  );
}
