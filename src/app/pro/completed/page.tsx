"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { CheckCircle, MapPin, DollarSign, Calendar, Star, UserCircle, User } from "lucide-react";

interface CompletedJob {
  id: string;
  title: string;
  client: {
    name: string;
    photo: string;
  };
  completedDate: string;
  amount: number;
  location: string;
  rating?: number;
  review?: string;
}

const mockCompletedJobs: CompletedJob[] = [
  {
    id: "1",
    title: "Furniture Assembly",
    client: {
      name: "Sarah Johnson",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&face",
    },
    completedDate: "2026-03-14",
    amount: 95,
    location: "Edinburgh, Scotland",
    rating: 5,
    review: "Excellent work! Very professional.",
  },
  {
    id: "2",
    title: "House Cleaning",
    client: {
      name: "Michael Brown",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&face",
    },
    completedDate: "2026-03-12",
    amount: 120,
    location: "Edinburgh, Scotland",
    rating: 5,
    review: "Outstanding service!",
  },
  {
    id: "3",
    title: "Moving Help",
    client: {
      name: "Emma Wilson",
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&face",
    },
    completedDate: "2026-03-05",
    amount: 180,
    location: "Glasgow, Scotland",
    rating: 4,
  },
  {
    id: "4",
    title: "Garden Maintenance",
    client: {
      name: "David Thompson",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&face",
    },
    completedDate: "2026-02-28",
    amount: 75,
    location: "Edinburgh, Scotland",
    rating: 5,
  },
  {
    id: "5",
    title: "Interior Painting",
    client: {
      name: "Lisa Anderson",
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&face",
    },
    completedDate: "2026-02-20",
    amount: 250,
    location: "Edinburgh, Scotland",
    rating: 5,
  },
];

export default function CompletedJobsPage() {
  const totalEarnings = mockCompletedJobs.reduce((sum, job) => sum + job.amount, 0);
  const avgRating = mockCompletedJobs.reduce((sum, job) => sum + (job.rating || 0), 0) / mockCompletedJobs.length;

  return (
    <ProviderLayout>
      <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Completed Jobs</h1>
          <p className="text-gray-600">View completed jobs and onsite collections</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Completed</p>
            <p className="text-2xl font-bold text-gray-900">{mockCompletedJobs.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Collected On Site</p>
            <p className="text-2xl font-bold text-green-600">£{totalEarnings}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {mockCompletedJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {job.client.photo ? (
                    <img
                      src={job.client.photo}
                      alt={job.client.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                      <UserCircle className="w-8 h-8" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{job.client.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{job.completedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-gray-900">£{job.amount} collected on site</span>
                      </div>
                    </div>

                    {job.rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= job.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {job.review && <span className="text-sm text-gray-600">&ldquo;{job.review}&rdquo;</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProviderLayout>
  );
}
