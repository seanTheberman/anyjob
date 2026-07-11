"use client";

import { useEffect, useState } from "react";

interface SellerVerificationStatus {
  isVerified: boolean;
  status: "pending" | "approved" | "rejected" | null;
  kycComplete: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  documentsUploaded: boolean;
  backgroundCheckStatus: string | null;
}

const DEFAULT_LOCKED_STATUS: SellerVerificationStatus = {
  isVerified: false,
  status: null,
  kycComplete: false,
  emailVerified: false,
  phoneVerified: false,
  documentsUploaded: false,
  backgroundCheckStatus: null,
};

let cachedVerificationStatus: SellerVerificationStatus | null = null;
let verificationPromise: Promise<SellerVerificationStatus | null> | null = null;

async function fetchSellerVerificationStatus(): Promise<SellerVerificationStatus | null> {
  const response = await fetch("/api/provider/verification", { cache: "no-store" });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to load provider verification status");
  }

  const payload = await response.json();
  return payload.verification ?? DEFAULT_LOCKED_STATUS;
}

export function useSellerVerification() {
  const [verificationStatus, setVerificationStatus] = useState<SellerVerificationStatus | null>(
    cachedVerificationStatus
  );
  const [loading, setLoading] = useState(!cachedVerificationStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkVerification() {
      try {
        verificationPromise ??= fetchSellerVerificationStatus();
        const status = await verificationPromise;
        cachedVerificationStatus = status;
        verificationPromise = null;

        if (active) {
          setVerificationStatus(status);
        }
      } catch (err) {
        console.error("Error checking verification status:", err);
        if (active) {
          setError("Failed to check verification status");
          setVerificationStatus(DEFAULT_LOCKED_STATUS);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkVerification();

    return () => {
      active = false;
    };
  }, []);

  return { verificationStatus, loading, error };
}
