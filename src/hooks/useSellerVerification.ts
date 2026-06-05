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

export function useSellerVerification() {
  const [verificationStatus, setVerificationStatus] = useState<SellerVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkVerification() {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Check if user is a seller
        const { data: seller, error: sellerError } = await supabase
          .from("sellers")
          .select("status, email_verified, phone_verified, id_document_url, insurance_document_url, background_check_status")
          .eq("id", user.id)
          .maybeSingle();

        if (sellerError || !seller) {
          setVerificationStatus({
            isVerified: false,
            status: null,
            kycComplete: false,
            emailVerified: Boolean(user.email_confirmed_at),
            phoneVerified: false,
            documentsUploaded: false,
            backgroundCheckStatus: null,
          });
          setLoading(false);
          return;
        }

        // Determine KYC completion
        const documentsUploaded = Boolean(seller.id_document_url || seller.insurance_document_url);
        const kycComplete = seller.email_verified && seller.phone_verified && documentsUploaded;
        
        // Determine if verified (approved status and complete KYC)
        const isVerified = seller.status === "approved" && kycComplete;

        setVerificationStatus({
          isVerified,
          status: seller.status,
          kycComplete,
          emailVerified: seller.email_verified || false,
          phoneVerified: seller.phone_verified || false,
          documentsUploaded,
          backgroundCheckStatus: seller.background_check_status,
        });
      } catch (err) {
        console.error("Error checking verification status:", err);
        setError("Failed to check verification status");
      } finally {
        setLoading(false);
      }
    }

    checkVerification();
  }, []);

  return { verificationStatus, loading, error };
}
