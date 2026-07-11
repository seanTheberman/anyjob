import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type QueryError = {
  message: string;
};

type QueryResult<T> = {
  data: T | null;
  error: QueryError | null;
  count?: number | null;
};

type LooseQuery<T> = PromiseLike<QueryResult<T>> & {
  select(columns: string, options?: { count?: "exact"; head?: boolean }): LooseQuery<T>;
  eq(column: string, value: unknown): LooseQuery<T>;
  maybeSingle(): PromiseLike<QueryResult<T>>;
};

type LooseAdminClient = {
  from<T = unknown>(table: string): LooseQuery<T>;
};

type SellerVerificationRow = {
  status: "pending" | "approved" | "rejected" | "suspended" | string | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
  id_document_url: string | null;
  selfie_video_url: string | null;
  insurance_document_url: string | null;
  insurance_status: string | null;
  background_check_status: string | null;
};

const LOCKED_STATUS = {
  isVerified: false,
  status: null,
  kycComplete: false,
  emailVerified: false,
  phoneVerified: false,
  documentsUploaded: false,
  backgroundCheckStatus: null,
};

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ verification: null }, { status: 401 });
  }

  const admin = createAdminSupabaseClient() as never as LooseAdminClient;
  const [{ data: seller, error: sellerError }, { count: idDocumentCount, error: idDocumentCountError }] = await Promise.all([
    admin
      .from<SellerVerificationRow>("sellers")
      .select("status, email_verified, phone_verified, id_document_url, selfie_video_url, insurance_document_url, insurance_status, background_check_status")
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("user_images")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("image_type", "id_document"),
  ]);

  if (sellerError || !seller) {
    return NextResponse.json({
      verification: {
        ...LOCKED_STATUS,
        emailVerified: Boolean(user.email_confirmed_at),
      },
    });
  }

  const status = seller.status || null;
  const hasTwoSidedId = idDocumentCountError ? Boolean(seller.id_document_url) : (idDocumentCount || 0) >= 2;
  const documentsUploaded = Boolean(
    hasTwoSidedId &&
    seller.selfie_video_url &&
    (seller.insurance_document_url || seller.insurance_status === "approved")
  );
  const isVerified = status === "approved";
  const kycComplete = Boolean(isVerified || (seller.email_verified && seller.phone_verified && documentsUploaded));

  return NextResponse.json({
    verification: {
      isVerified,
      status,
      kycComplete,
      emailVerified: Boolean(seller.email_verified || user.email_confirmed_at),
      phoneVerified: Boolean(seller.phone_verified),
      documentsUploaded,
      backgroundCheckStatus: seller.background_check_status || null,
    },
  });
}
