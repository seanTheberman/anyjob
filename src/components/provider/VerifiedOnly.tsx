"use client";

import { Shield, Lock } from "lucide-react";
import Link from "next/link";
import { useSellerVerification } from "@/hooks/useSellerVerification";
import { ReactNode } from "react";

interface VerifiedOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
  showContent?: boolean; // New prop to control if content should be shown
}

export function VerifiedOnly({ children, fallback, showContent = false }: VerifiedOnlyProps) {
  const { verificationStatus, loading } = useSellerVerification();

  if (loading && showContent) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-xl mb-4"></div>
      </div>
    );
  }

  // If not a seller or verification status unknown, show children (let other auth handle it)
  if (!verificationStatus) {
    return <>{children}</>;
  }

  // If verified, show the protected content
  if (verificationStatus.isVerified) {
    return <>{children}</>;
  }

  // If showContent is true, show the content but with a warning banner
  if (showContent) {
    return (
      <>
        {/* Warning banner for unverified sellers */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-1">
                Verification Required to Apply
              </h3>
              <p className="text-yellow-700 text-sm">
                You can browse available jobs but must complete KYC verification before applying.
              </p>
            </div>
            <Link
              href="/pro/profile"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              Complete Verification
            </Link>
          </div>
        </div>
        {/* Show the content */}
        {children}
      </>
    );
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked UI for unverified sellers
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Verification Required
      </h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        Complete your KYC verification to apply for jobs and start earning.
        This helps us maintain a trusted community of service providers.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/pro/profile"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Shield className="w-4 h-4" />
          Complete Verification
        </Link>
        <Link
          href="/pro/help"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
}
