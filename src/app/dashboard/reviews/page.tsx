"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ReceivedReviewsPanel } from "@/components/reviews/ReceivedReviewsPanel";

export default function DashboardReviewsPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard/account?tab=reviews" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to account
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="mt-2 text-gray-600">All ratings and feedback other AnyJob users have left for your account.</p>
        </div>

        <ReceivedReviewsPanel mode="full" />
      </div>
    </DashboardLayout>
  );
}
