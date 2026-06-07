"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("status, email_verified, phone_verified, id_document_url, selfie_video_url, insurance_document_url, background_check_status")
    .eq("id", user.id)
    .maybeSingle();

  if (sellerError || !seller) {
    return {
      ...DEFAULT_LOCKED_STATUS,
      emailVerified: Boolean(user.email_confirmed_at),
    };
  }

  const documentsUploaded = Boolean(
    seller.id_document_url &&
    seller.selfie_video_url &&
    seller.insurance_document_url
  );
  const kycComplete = Boolean(seller.email_verified && seller.phone_verified && documentsUploaded);

  return {
    isVerified: seller.status === "approved",
    status: seller.status,
    kycComplete,
    emailVerified: seller.email_verified || false,
    phoneVerified: seller.phone_verified || false,
    documentsUploaded,
    backgroundCheckStatus: seller.background_check_status,
  };
}

export function useSellerVerification() {
  const [verificationStatus, setVerificationStatus] = useState<SellerVerificationStatus | null>(
    cachedVerificationStatus ?? DEFAULT_LOCKED_STATUS
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
