import { createServerSupabaseClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type BidWithInquiry = {
  id: string;
  inquiry_id: string;
  provider_id: string;
  status: string;
  inquiry: {
    user_id: string;
  };
};

const PROVIDER_BOOKING_CONFIRMED_MESSAGE =
  "Thank you for confirming the booking. Your AnyJob payment is complete, and I'm ready to coordinate the job with you here. Please send any final access details, preferred timing, photos, or special instructions, and I'll confirm the plan before arrival.";

export async function acceptBidAndUnlockChat(
  supabase: SupabaseClient,
  bid: BidWithInquiry,
  timestamp = new Date().toISOString()
) {
  if (bid.status !== "pending") {
    return { bid, conversation: null };
  }

  const { data: updated, error } = await supabase
    .from("bids")
    .update({
      status: "accepted",
      accepted_at: timestamp,
      updated_at: timestamp,
    })
    .eq("id", bid.id)
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("bids")
    .update({ status: "rejected", rejected_at: timestamp, updated_at: timestamp })
    .eq("inquiry_id", bid.inquiry_id)
    .neq("id", bid.id)
    .eq("status", "pending");

  const { error: inquiryUpdateError } = await supabase
    .from("service_inquiries")
    .update({
      status: "bid_accepted",
      matched_provider_ids: [bid.provider_id],
      updated_at: timestamp,
    })
    .eq("id", bid.inquiry_id);

  if (inquiryUpdateError) {
    throw inquiryUpdateError;
  }

  const { data: existingConversation } = await supabase
    .from("eloo_conversations")
    .select("*")
    .eq("client_id", bid.inquiry.user_id)
    .eq("provider_id", bid.provider_id)
    .eq("bid_id", bid.id)
    .eq("is_active", true)
    .maybeSingle();

  const { data: conversation } = existingConversation
    ? await supabase
        .from("eloo_conversations")
        .update({ last_message_at: timestamp })
        .eq("id", existingConversation.id)
        .select()
        .single()
    : await supabase
        .from("eloo_conversations")
        .insert({
          client_id: bid.inquiry.user_id,
          provider_id: bid.provider_id,
          bid_id: bid.id,
          is_active: true,
          last_message_at: timestamp,
        })
        .select()
        .single();

  if (conversation) {
    const { data: existingAutoMessage } = await supabase
      .from("eloo_messages")
      .select("id")
      .eq("conversation_id", conversation.id)
      .eq("sender_id", bid.provider_id)
      .eq("content", PROVIDER_BOOKING_CONFIRMED_MESSAGE)
      .maybeSingle();

    if (!existingAutoMessage) {
      await supabase.from("eloo_messages").insert({
        conversation_id: conversation.id,
        sender_id: bid.provider_id,
        content: PROVIDER_BOOKING_CONFIRMED_MESSAGE,
      });
    }
  }

  return { bid: updated, conversation };
}
