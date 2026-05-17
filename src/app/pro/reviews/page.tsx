"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Star, ThumbsUp, Calendar } from "lucide-react";

interface Review {
  id: string;
  client: {
    name: string;
    photo: string;
  };
  rating: number;
  comment: string;
  jobTitle: string;
  date: string;
  helpful: number;
}

const mockReviews: Review[] = [
  {
    id: "1",
    client: {
      name: "Sarah Johnson",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&face",
    },
    rating: 5,
    comment: "Excellent work! James assembled my entire IKEA bedroom set quickly and professionally. Very friendly and cleaned up after himself. Highly recommend!",
    jobTitle: "Furniture Assembly",
    date: "2026-03-14",
    helpful: 3,
  },
  {
    id: "2",
    client: {
      name: "Michael Brown",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&face",
    },
    rating: 5,
    comment: "Outstanding service! The house was spotless after the deep clean. Very thorough and paid attention to every detail. Will definitely book again.",
    jobTitle: "House Cleaning",
    date: "2026-03-12",
    helpful: 5,
  },
  {
    id: "3",
    client: {
      name: "Emma Wilson",
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&face",
    },
    rating: 4,
    comment: "Great help with the move. Very strong and careful with our furniture. Only minor issue was running a bit late, but made up for it with hard work.",
    jobTitle: "Moving Help",
    date: "2026-03-05",
    helpful: 2,
  },
  {
    id: "4",
    client: {
      name: "David Thompson",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&face",
    },
    rating: 5,
    comment: "Fantastic gardener! My lawn has never looked better. Very knowledgeable about plants and gave great advice for ongoing maintenance.",
    jobTitle: "Garden Maintenance",
    date: "2026-02-28",
    helpful: 4,
  },
  {
    id: "5",
    client: {
      name: "Lisa Anderson",
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&face",
    },
    rating: 5,
    comment: "Professional painting job. Clean lines, no drips, and finished ahead of schedule. Very impressed with the quality of work!",
    jobTitle: "Interior Painting",
    date: "2026-02-20",
    helpful: 6,
  },
];

const ratingDistribution = [
  { stars: 5, count: 38, percentage: 90 },
  { stars: 4, count: 3, percentage: 7 },
  { stars: 3, count: 1, percentage: 2 },
  { stars: 2, count: 0, percentage: 0 },
  { stars: 1, count: 0, percentage: 0 },
];

export default function ReviewsPage() {
  return (
    <ProviderLayout>
      <div className="max-w-4xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reviews</h1>
          <p className="text-gray-600">See what clients are saying about your work</p>
        </div>

        {/* Rating Overview */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-3 mb-2">
                <span className="text-5xl font-bold text-gray-900">4.8</span>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= 4.8 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Based on 42 reviews</p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map((rating) => (
                <div key={rating.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium text-gray-700">{rating.stars}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${rating.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{rating.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {mockReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                <img
                  src={review.client.photo}
                  alt={review.client.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{review.client.name}</h3>
                      <p className="text-sm text-gray-500">{review.jobTitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-gray-700 mb-3">{review.comment}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{review.helpful} people found this helpful</span>
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
