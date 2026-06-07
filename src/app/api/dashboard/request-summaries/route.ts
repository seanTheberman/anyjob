import { calculateBookingTokenBreakdown } from "@/lib/booking-token";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type LooseRow = Record<string, any>;

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient() as never as { from(table: string): any };
    const { data: inquiries, error: inquiriesError } = await admin
      .from("service_inquiries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (inquiriesError) {
      return NextResponse.json({ error: inquiriesError.message }, { status: 500 });
    }

    const inquiryRows = (inquiries || []) as LooseRow[];
    const inquiryIds = inquiryRows.map((inquiry) => String(inquiry.id)).filter(Boolean);

    const [bidsResult, imagesResult] = inquiryIds.length
      ? await Promise.all([
          admin
            .from("bids")
            .select("id,inquiry_id,amount,status,created_at,provider_id")
            .in("inquiry_id", inquiryIds)
            .order("created_at", { ascending: false }),
          admin
            .from("user_images")
            .select("id,inquiry_id,image_url,public_id,image_type,title,description,created_at")
            .in("inquiry_id", inquiryIds)
            .eq("image_type", "work_image")
            .order("created_at", { ascending: true }),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];

    if (bidsResult.error || imagesResult.error) {
      return NextResponse.json(
        { error: bidsResult.error?.message || imagesResult.error?.message || "Failed to load request summaries" },
        { status: 500 }
      );
    }

    const bidsByInquiry = new Map<string, LooseRow[]>();
    for (const bid of (bidsResult.data || []) as LooseRow[]) {
      const inquiryId = String(bid.inquiry_id || "");
      if (!inquiryId) continue;
      bidsByInquiry.set(inquiryId, [...(bidsByInquiry.get(inquiryId) || []), bid]);
    }

    const imagesByInquiry = new Map<string, LooseRow[]>();
    for (const image of (imagesResult.data || []) as LooseRow[]) {
      const inquiryId = String(image.inquiry_id || "");
      if (!inquiryId) continue;
      imagesByInquiry.set(inquiryId, [...(imagesByInquiry.get(inquiryId) || []), image]);
    }

    const requests = inquiryRows.map((inquiry) => {
      const id = String(inquiry.id);
      const bids = bidsByInquiry.get(id) || [];
      const images = imagesByInquiry.get(id) || [];
      const pendingBids = bids.filter((bid) => String(bid.status || "").toLowerCase() === "pending");
      const acceptedBid = bids.find((bid) => String(bid.status || "").toLowerCase() === "accepted") || null;
      const lowestBid = bids.reduce<LooseRow | null>((lowest, bid) => {
        if (!lowest) return bid;
        return Number(bid.amount || 0) < Number(lowest.amount || 0) ? bid : lowest;
      }, null);

      return {
        ...inquiry,
        quotes: {
          total: bids.length,
          pending: pendingBids.length,
          accepted: Boolean(acceptedBid),
          lowestTotal: lowestBid ? calculateBookingTokenBreakdown(Number(lowestBid.amount || 0)).buyerTotal : null,
          acceptedTotal: acceptedBid ? calculateBookingTokenBreakdown(Number(acceptedBid.amount || 0)).buyerTotal : null,
        },
        workImages: images,
      };
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Request summaries failed:", error);
    return NextResponse.json({ error: "Failed to load request summaries" }, { status: 500 });
  }
}
