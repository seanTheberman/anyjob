"use client";

import { Shield, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useSellerVerification } from "@/hooks/useSellerVerification";

export function KYCVerificationBanner() {
  const { verificationStatus, loading } = useSellerVerification();

  if (loading) return null;
  if (!verificationStatus) return null;

  // If already verified, don't show banner
  if (verificationStatus.isVerified) return null;

  const { status, kycComplete, emailVerified, phoneVerified, documentsUploaded } = verificationStatus;

  // Determine banner style based on status
  const isPending = status === "pending";
  const isRejected = status === "rejected";

  let bgColor = "bg-yellow-50 border-yellow-200";
  let iconColor = "text-yellow-600";
  let title = "KYC Verification Required";
  let message = "Complete your verification to start accepting jobs.";
  let Icon = AlertCircle;

  if (isRejected) {
    bgColor = "bg-red-50 border-red-200";
    iconColor = "text-red-600";
    title = "Verification Rejected";
    message = "Your verification was rejected. Please update your documents and try again.";
    Icon = XCircle;
  } else if (isPending && kycComplete) {
    bgColor = "bg-blue-50 border-blue-200";
    iconColor = "text-blue-600";
    title = "Verification In Progress";
    message = "Your documents are under review. You'll be notified once approved.";
    Icon = Shield;
  }

  return (
    <div className={`${bgColor} border rounded-xl p-4 mb-6`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${iconColor} mb-1`}>{title}</h3>
          <p className="text-sm text-gray-600 mb-3">{message}</p>

          {/* Verification Checklist */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm">
              {emailVerified ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={emailVerified ? "text-gray-700" : "text-gray-500"}>
                Email verified
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {phoneVerified ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={phoneVerified ? "text-gray-700" : "text-gray-500"}>
                Phone verified
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {documentsUploaded ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={documentsUploaded ? "text-gray-700" : "text-gray-500"}>
                Identity document uploaded
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {status === "approved" ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={status === "approved" ? "text-gray-700" : "text-gray-500"}>
                Account approved
              </span>
            </div>
          </div>

          {!kycComplete && (
            <Link
              href="/pro/profile"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Complete verification
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
