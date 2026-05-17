"use client";

import { useState, useEffect } from "react";
import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { JobListing } from "@/components/provider/JobListing";
import { KYCVerificationBanner } from "@/components/provider/KYCVerificationBanner";
import { VerifiedOnly } from "@/components/provider/VerifiedOnly";
import { Loader2 } from "lucide-react";
import { Job } from "@/types/jobs";

export default function ProviderDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    available: 0,
    inStream: 0,
    applied: 0,
    responseRate: 0
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      const data = await response.json();
      
      // Transform the data to match Job interface
      const transformedJobs = (data.jobs || []).map((job: any) => ({
        id: job.id,
        title: job.job_description ? job.job_description.split('.').slice(0, 2).join('.').trim() : 'Service Request',
        description: job.job_description || 'No description provided',
        client: {
          name: `${job.first_name} ${job.last_name}`,
          photo: undefined, // We don't have client photos in the current data
          rating: undefined,
          reviewCount: undefined
        },
        budget: {
          min: parseFloat(job.budget_range_min) || 0,
          max: parseFloat(job.budget_range_max) || 0,
          currency: "€"
        },
        location: {
          city: job.city || 'Unknown',
          state: undefined,
          distance: undefined
        },
        category: job.category_slug || 'general',
        postedAt: new Date(job.submitted_at).toLocaleDateString(),
        urgency: job.job_urgency === 'asap' ? 'high' : 
                 job.job_urgency === 'this_week' ? 'medium' : 'low',
        isInStream: false, // We'll implement this logic later
        bid_count: job.bid_count || 0,
        my_bid: job.my_bid || null,
        work_image_count: job.work_image_count || 0
      }));

      setJobs(transformedJobs);

      // Calculate stats
      const available = transformedJobs.length;
      const inStream = transformedJobs.filter((job: Job) => job.isInStream).length;
      const applied = transformedJobs.filter((job: Job) => job.my_bid).length;
      
      setStats({
        available,
        inStream,
        applied,
        responseRate: available > 0 ? Math.round((applied / available) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProviderLayout>
        <div className="max-w-6xl mx-auto mt-4 lg:mt-6 flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading jobs...</span>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
        {/* KYC Verification Banner */}
        <KYCVerificationBanner />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Live Jobs</h1>
          <p className="text-gray-600">Browse and apply to jobs matching your skills</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Available Jobs</p>
            <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">In Your Stream</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inStream}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Applied</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.applied}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Response Rate</p>
            <p className="text-2xl font-bold text-green-600">{stats.responseRate}%</p>
          </div>
        </div>

        {/* Job Listing - Show real jobs from database */}
        <VerifiedOnly showContent={true}>
          <JobListing jobs={jobs} />
        </VerifiedOnly>
      </div>
    </ProviderLayout>
  );
}
