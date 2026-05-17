import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function hasBuyerKycForQuoteAcceptance(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  const { data: files } = await supabase
    .from("user_images")
    .select("image_type")
    .eq("user_id", userId)
    .in("image_type", ["id_document", "selfie_video"]);

  const fileTypes = new Set((files || []).map((file) => file.image_type));
  if (fileTypes.has("id_document") && fileTypes.has("selfie_video")) {
    return true;
  }

  const { data: buyer } = await supabase
    .from("buyers")
    .select("id_document_url,selfie_video_url,kyc_status")
    .eq("id", userId)
    .maybeSingle();

  return Boolean(
    buyer &&
    buyer.id_document_url &&
    buyer.selfie_video_url &&
    buyer.kyc_status !== "rejected"
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inquiry_id, amount, message, estimated_duration_hours, available_date } = body;

    if (!inquiry_id || !amount) {
      return NextResponse.json({ error: "inquiry_id and amount are required" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    // Verify the inquiry exists and is submitted (open for bids)
    const { data: inquiry, error: inquiryError } = await supabase
      .from("service_inquiries")
      .select("*")
      .eq("id", inquiry_id)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json({ error: "Service inquiry not found" }, { status: 404 });
    }

    // Provider cannot bid on their own inquiry
    if (inquiry.user_id === user.id) {
      return NextResponse.json({ error: "You cannot bid on your own inquiry" }, { status: 403 });
    }

    // Check if provider is a registered provider
    const { data: provider } = await supabase
      .from("eloo_profiles")
      .select("id, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (!provider) {
      return NextResponse.json({ error: "Only registered providers can place bids" }, { status: 403 });
    }

    // Insert bid
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .insert({
        inquiry_id,
        provider_id: user.id,
        amount,
        message: message || null,
        estimated_duration_hours: estimated_duration_hours || null,
        available_date: available_date || null,
        status: "pending",
      })
      .select()
      .single();

    if (bidError) {
      if (bidError.code === "23505") {
        return NextResponse.json({ error: "You have already placed a bid on this job" }, { status: 409 });
      }
      throw bidError;
    }

    // Ensure a conversation exists so client and provider can chat before acceptance
    const { data: existingConversation } = await supabase
      .from("eloo_conversations")
      .select("id")
      .eq("client_id", inquiry.user_id)
      .eq("provider_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!existingConversation) {
      await supabase.from("eloo_conversations").insert({
        client_id: inquiry.user_id,
        provider_id: user.id,
        bid_id: bid.id,
        is_active: true,
        last_message_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ bid }, { status: 201 });
  } catch (error) {
    console.error("Error creating bid:", error);
    return NextResponse.json({ error: "Failed to create bid" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inquiryId = searchParams.get("inquiry_id");
    const role = searchParams.get("role"); // "provider" or "client"

    let query = supabase
      .from("bids")
      .select(`
        *,
        inquiry:service_inquiries!bids_inquiry_id_fkey(
          id, category_slug, subcategory_slug, job_description, city, preferred_date, budget_range_min, budget_range_max, user_id
        )
      `)
      .order("created_at", { ascending: false });

    if (inquiryId) {
      query = query.eq("inquiry_id", inquiryId);
    }

    if (role === "provider") {
      query = query.eq("provider_id", user.id);
    }

    const { data: bids, error: bidsError } = await query;

    if (bidsError) throw bidsError;

    // Fetch provider information for each bid
    const bidsWithProviders = await Promise.all(
      (bids || []).map(async (bid) => {
        const { data: provider } = await supabase
          .from("eloo_profiles")
          .select("id, first_name, last_name")
          .eq("id", bid.provider_id)
          .single();

        return {
          ...bid,
          provider: provider || null,
        };
      })
    );

    return NextResponse.json({ bids: bidsWithProviders });
  } catch (error) {
    console.error("Error fetching bids:", error);
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bid_id, action } = body; // action: "accept", "reject", "withdraw"

    if (!bid_id || !action) {
      return NextResponse.json({ error: "bid_id and action are required" }, { status: 400 });
    }

    // Get the bid
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("*, inquiry:service_inquiries!bids_inquiry_id_fkey(*)")
      .eq("id", bid_id)
      .single();

    if (bidError || !bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    if (action === "withdraw") {
      // Only provider can withdraw their bid
      if (bid.provider_id !== user.id) {
        return NextResponse.json({ error: "Only the provider can withdraw their bid" }, { status: 403 });
      }
      if (bid.status !== "pending") {
        return NextResponse.json({ error: "Can only withdraw pending bids" }, { status: 400 });
      }

      const { data: updated, error } = await supabase
        .from("bids")
        .update({ status: "withdrawn", updated_at: new Date().toISOString() })
        .eq("id", bid_id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ bid: updated });
    }

    if (action === "accept" || action === "reject") {
      // Only the inquiry owner (client) can accept/reject
      if (bid.inquiry.user_id !== user.id) {
        return NextResponse.json({ error: "Only the client can accept or reject bids" }, { status: 403 });
      }
      if (bid.status !== "pending") {
        return NextResponse.json({ error: "Can only accept/reject pending bids" }, { status: 400 });
      }

      if (action === "accept") {
        const buyerKycComplete = await hasBuyerKycForQuoteAcceptance(supabase, user.id);
        if (!buyerKycComplete) {
          return NextResponse.json(
            { error: "Complete buyer KYC before accepting a quote. Upload your ID document and selfie video from Account." },
            { status: 403 }
          );
        }
      }

      const newStatus = action === "accept" ? "accepted" : "rejected";
      const timestamp = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from("bids")
        .update({
          status: newStatus,
          ...(action === "accept" ? { accepted_at: timestamp } : { rejected_at: timestamp }),
          updated_at: timestamp,
        })
        .eq("id", bid_id)
        .select()
        .single();

      if (error) throw error;

      // If accepted, reject all other pending bids for this inquiry
      if (action === "accept") {
        await supabase
          .from("bids")
          .update({ status: "rejected", rejected_at: timestamp, updated_at: timestamp })
          .eq("inquiry_id", bid.inquiry_id)
          .neq("id", bid_id)
          .eq("status", "pending");

        // Update inquiry status
        await supabase
          .from("service_inquiries")
          .update({
            status: "bid_accepted",
            matched_provider_ids: [bid.provider_id],
            updated_at: timestamp,
          })
          .eq("id", bid.inquiry_id);

        // Create a conversation between client and provider
        const { data: conversation } = await supabase
          .from("eloo_conversations")
          .insert({
            client_id: bid.inquiry.user_id,
            provider_id: bid.provider_id,
            bid_id: bid_id,
            is_active: true,
          })
          .select()
          .single();

        // Send auto-message from system
        if (conversation) {
          await supabase.from("eloo_messages").insert({
            conversation_id: conversation.id,
            sender_id: bid.provider_id,
            content: `Hi! My bid of €${bid.amount} has been accepted. I'm looking forward to working with you. Let me know if you have any questions!`,
          });
        }

        return NextResponse.json({ bid: updated, conversation });
      }

      return NextResponse.json({ bid: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating bid:", error);
    return NextResponse.json({ error: "Failed to update bid" }, { status: 500 });
  }
}
