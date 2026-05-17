"use client";

import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { buttonVariants } from "@/components/ui/button";

export default function SavedPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Saved providers</h1>
          <p className="text-gray-600 mt-2">Keep track of providers you want to book again.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved providers yet</h2>
          <p className="text-gray-600 mb-6">Browse providers and save the ones that fit your needs.</p>
          <Link href="/search" className={buttonVariants()}>
            <Search className="w-4 h-4 mr-2" />
            Find providers
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
