"use client";

import { useSellerVerification } from "@/hooks/useSellerVerification";
import { ReactNode } from "react";

interface JobApplicationGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function JobApplicationGuard({ children, fallback }: JobApplicationGuardProps) {
  const { verificationStatus, loading } = useSellerVerification();

  // If not a seller or verification status unknown, show children
  if (!loading && !verificationStatus) {
    return <>{children}</>;
  }

  // If verified, show the protected content
  if (verificationStatus?.isVerified) {
    return <>{children}</>;
  }

  // If unverified seller, show fallback or default blocked message
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default blocked UI for job applications
  return (
    <div 
      className="relative group"
      title="Complete KYC verification to apply for this job"
    >
      <div className="absolute inset-0 bg-gray-900/20 rounded-xl flex items-center justify-center z-10">
        <div className="bg-white rounded-lg px-4 py-2 shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700">
            🔒 Verification Required
          </p>
        </div>
      </div>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    </div>
  );
}
