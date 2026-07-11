import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LooseRow = Record<string, unknown>;
type QueryError = { message: string };
type SingleQueryResponse<T> = { data: T | null; error: QueryError | null };
type ListQueryResponse<T> = { data: T[] | null; error: QueryError | null };
type SelectQuery<T extends LooseRow> = {
  eq(column: string, value: string): SelectQuery<T>;
  order(column: string, options?: { ascending?: boolean }): Promise<ListQueryResponse<T>>;
  maybeSingle(): Promise<SingleQueryResponse<T>>;
};
type AdminQueryClient = {
  from(table: string): {
    select(columns: string): SelectQuery<LooseRow>;
    update(values: LooseRow): {
      eq(column: string, value: string): {
        select(columns?: string): {
          single(): Promise<SingleQueryResponse<LooseRow>>;
        };
      };
    };
  };
};

async function getUserRole(admin: AdminQueryClient, userId: string) {
  const [elooProfile, userProfile] = await Promise.all([
    admin.from("eloo_profiles").select("role").eq("id", userId).maybeSingle(),
    admin.from("user_profiles").select("role").eq("id", userId).maybeSingle(),
  ]);

  return String(elooProfile.data?.role || userProfile.data?.role || "").toLowerCase();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const admin = createAdminSupabaseClient() as unknown as AdminQueryClient;

    const { data: inquiry, error: inquiryError } = await admin
      .from("service_inquiries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (inquiryError) {
      return NextResponse.json({ error: inquiryError.message }, { status: 500 });
    }

    if (!inquiry) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const role = await getUserRole(admin, user.id);
    const ownsRequest = String((inquiry as LooseRow).user_id || "") === user.id;
    const { data: providerBids, error: providerBidError } = ownsRequest || role === "admin"
      ? { data: [], error: null }
      : await admin
          .from("bids")
          .select("id,status")
          .eq("inquiry_id", id)
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false });

    if (providerBidError) {
      return NextResponse.json({ error: providerBidError.message }, { status: 500 });
    }

    const providerCanView = (providerBids || []).some((bid) =>
      ["accepted", "in_progress", "completed"].includes(String(bid.status || "").toLowerCase())
    );

    if (!ownsRequest && role !== "admin" && !providerCanView) {
      return NextResponse.json({ error: "You do not have permission to view this request" }, { status: 403 });
    }

    const { data: acceptedBid, error: acceptedBidError } = await admin
      .from("bids")
      .select("id,provider_id,status")
      .eq("inquiry_id", id)
      .eq("status", "accepted")
      .maybeSingle();

    if (acceptedBidError) {
      return NextResponse.json({ error: acceptedBidError.message }, { status: 500 });
    }

    const { data: workImages, error: imageError } = await admin
      .from("user_images")
      .select("id,image_url,public_id,image_type,title,description")
      .eq("inquiry_id", id)
      .eq("image_type", "work_image")
      .order("created_at", { ascending: true });

    if (imageError) {
      return NextResponse.json({ error: imageError.message }, { status: 500 });
    }

    return NextResponse.json({
      inquiry: {
        ...inquiry,
        provider_id: acceptedBid?.provider_id || null,
        accepted_bid_id: acceptedBid?.id || null,
      },
      workImages: workImages || [],
    });
  } catch (error) {
    console.error("Request detail lookup failed:", error);
    return NextResponse.json({ error: "Failed to load request details" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const nextStatus = String((body as LooseRow).status || "").toLowerCase();
    const allowedStatuses = new Set(["cancelled", "in_progress", "completed"]);
    if (!allowedStatuses.has(nextStatus)) {
      return NextResponse.json({ error: "Unsupported request status" }, { status: 400 });
    }

    const { id } = await params;
    const admin = createAdminSupabaseClient() as unknown as AdminQueryClient;

    const { data: inquiry, error: inquiryError } = await admin
      .from("service_inquiries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (inquiryError) {
      return NextResponse.json({ error: inquiryError.message }, { status: 500 });
    }

    if (!inquiry) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const role = await getUserRole(admin, user.id);
    const ownsRequest = String(inquiry.user_id || "") === user.id;
    if (!ownsRequest && role !== "admin") {
      return NextResponse.json({ error: "You do not have permission to update this request" }, { status: 403 });
    }

    const { data: acceptedBid, error: acceptedBidError } = await admin
      .from("bids")
      .select("id,provider_id,status")
      .eq("inquiry_id", id)
      .eq("status", "accepted")
      .maybeSingle();

    if (acceptedBidError) {
      return NextResponse.json({ error: acceptedBidError.message }, { status: 500 });
    }

    if ((nextStatus === "in_progress" || nextStatus === "completed") && !acceptedBid) {
      return NextResponse.json({ error: "Accept a provider bid before updating work status" }, { status: 409 });
    }

    const currentStatus = String(inquiry.status || "").toLowerCase();
    if (nextStatus === "in_progress" && !["bid_accepted", "confirmed", "in_progress"].includes(currentStatus)) {
      return NextResponse.json({ error: "This request cannot be marked in progress yet" }, { status: 409 });
    }

    if (nextStatus === "completed" && !["in_progress", "completed"].includes(currentStatus)) {
      return NextResponse.json({ error: "Start the job before marking it completed" }, { status: 409 });
    }

    const { data: updatedInquiry, error: updateError } = await admin
      .from("service_inquiries")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      inquiry: {
        ...updatedInquiry,
        provider_id: acceptedBid?.provider_id || null,
        accepted_bid_id: acceptedBid?.id || null,
      },
    });
  } catch (error) {
    console.error("Request status update failed:", error);
    return NextResponse.json({ error: "Failed to update request status" }, { status: 500 });
  }
}
