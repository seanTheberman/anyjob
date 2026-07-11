"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { ReceivedReviewsPanel } from "@/components/reviews/ReceivedReviewsPanel";

export default function ReviewsPage() {
  return (
    <ProviderLayout>
      <div className="mx-auto mt-4 max-w-4xl lg:mt-6">
        <div className="mb-6">
          <Link href="/pro/profile" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="mt-2 text-gray-600">All ratings and feedback clients and businesses have left for your provider account.</p>
        </div>

        <ReceivedReviewsPanel mode="full" />
      </div>
    </ProviderLayout>
  );
}
