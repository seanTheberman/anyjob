import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getFastAuthUser } from "@/lib/auth/fast-user";
import { notifyJobEvent } from "@/lib/notifications/email-functions";
import { NextRequest, NextResponse } from "next/server";

async function isConversationUnlocked(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  conversation: { bid_id?: string | null }
) {
  if (!conversation.bid_id) return true;

  const { data: bid } = await supabase
    .from("bids")
    .select("status")
    .eq("id", conversation.bid_id)
    .maybeSingle();

  return bid?.status === "accepted";
}

// GET: Fetch conversations and messages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const user = await getFastAuthUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");
    const action = searchParams.get("action") || "conversations";

    if (action === "messages" && conversationId) {
      // Fetch messages for a specific conversation
      // First verify user is part of this conversation
      const { data: conversation } = await supabase
        .from("eloo_conversations")
        .select("*")
        .eq("id", conversationId)
        .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
        .single();

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      const unlocked = await isConversationUnlocked(supabase, conversation);
      if (!unlocked) {
        return NextResponse.json(
          { error: "Chat unlocks after the buyer accepts the bid and pays the AnyJob fee" },
          { status: 403 }
        );
      }

      const { data: messages, error } = await supabase
        .from("eloo_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Mark unread messages as read
      await supabase
        .from("eloo_messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      try {
        await createAdminSupabaseClient()
          .from("eloo_notifications")
          .update({ is_read: true })
          .eq("user_id", user.id)
          .eq("type", "new_message")
          .eq("is_read", false)
          .contains("data", { conversation_id: conversationId });
      } catch (notificationError) {
        console.error("Failed to mark message notifications as read:", notificationError);
      }

      return NextResponse.json({ messages, conversation });
    }

    // Fetch all conversations for the user
    const { data: conversations, error } = await supabase
      .from("eloo_conversations")
      .select("*")
      .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
      .eq("is_active", true)
      .order("last_message_at", { ascending: false });

    if (error) throw error;

    const allConversations = conversations || [];
    const bidIds = Array.from(new Set(allConversations.map((conversation) => conversation.bid_id).filter(Boolean)));
    const acceptedBidIds = new Set<string>();

    if (bidIds.length) {
      const { data: bids, error: bidsError } = await supabase
        .from("bids")
        .select("id,status")
        .in("id", bidIds);

      if (bidsError) throw bidsError;
      for (const bid of bids || []) {
        if (bid.status === "accepted") acceptedBidIds.add(String(bid.id));
      }
    }

    const unlockedConversations = allConversations.filter((conversation) => (
      !conversation.bid_id || acceptedBidIds.has(String(conversation.bid_id))
    ));
    const conversationIds = unlockedConversations.map((conversation) => conversation.id);
    const participantIds = Array.from(new Set(unlockedConversations.flatMap((conversation) => [
      conversation.client_id,
      conversation.provider_id,
    ]).filter(Boolean)));

    const [messagesResult, unreadResult, profilesResult] = await Promise.all([
      conversationIds.length
        ? supabase
          .from("eloo_messages")
          .select("conversation_id,content,created_at,sender_id")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      conversationIds.length
        ? supabase
          .from("eloo_messages")
          .select("conversation_id")
          .in("conversation_id", conversationIds)
          .neq("sender_id", user.id)
          .eq("is_read", false)
        : Promise.resolve({ data: [], error: null }),
      participantIds.length
        ? supabase
          .from("eloo_profiles")
          .select("id, first_name, last_name, profile_image_url")
          .in("id", participantIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (messagesResult.error) throw messagesResult.error;
    if (unreadResult.error) throw unreadResult.error;
    if (profilesResult.error) throw profilesResult.error;

    const latestMessageByConversation = new Map<string, unknown>();
    for (const message of messagesResult.data || []) {
      const conversationKey = String(message.conversation_id);
      if (!latestMessageByConversation.has(conversationKey)) {
        latestMessageByConversation.set(conversationKey, {
          content: message.content,
          created_at: message.created_at,
          sender_id: message.sender_id,
        });
      }
    }

    const unreadCountByConversation = new Map<string, number>();
    for (const message of unreadResult.data || []) {
      const conversationKey = String(message.conversation_id);
      unreadCountByConversation.set(conversationKey, (unreadCountByConversation.get(conversationKey) || 0) + 1);
    }

    const profilesById = new Map((profilesResult.data || []).map((profile) => [String(profile.id), profile]));

    const conversationsWithMeta = unlockedConversations.map((conv) => ({
      ...conv,
      client: profilesById.get(String(conv.client_id)) || null,
      provider: profilesById.get(String(conv.provider_id)) || null,
      last_message: latestMessageByConversation.get(String(conv.id)) || null,
      unread_count: unreadCountByConversation.get(String(conv.id)) || 0,
    }));

    return NextResponse.json({ conversations: conversationsWithMeta });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json({ error: "Failed to fetch chat data" }, { status: 500 });
  }
}

// POST: Send a message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversation_id, content, attachments } = body;

    if (!conversation_id || !content?.trim()) {
      return NextResponse.json({ error: "conversation_id and content are required" }, { status: 400 });
    }

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from("eloo_conversations")
      .select("*")
      .eq("id", conversation_id)
      .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found or unauthorized" }, { status: 404 });
    }

    if (!conversation.is_active) {
      return NextResponse.json({ error: "This conversation is no longer active" }, { status: 400 });
    }

    const unlocked = await isConversationUnlocked(supabase, conversation);
    if (!unlocked) {
      return NextResponse.json(
        { error: "Chat unlocks after the buyer accepts the bid and pays the AnyJob fee" },
        { status: 403 }
      );
    }

    // Insert message
    const { data: message, error: msgError } = await supabase
      .from("eloo_messages")
      .insert({
        conversation_id,
        sender_id: user.id,
        content: content.trim(),
        attachments: attachments || [],
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update conversation's last_message_at
    await supabase
      .from("eloo_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation_id);

    const recipientUserId = conversation.client_id === user.id ? conversation.provider_id : conversation.client_id;

    if (recipientUserId) {
      try {
        const admin = createAdminSupabaseClient();
        const { data: senderProfile } = await admin
          .from("eloo_profiles")
          .select("first_name,last_name,role")
          .eq("id", user.id)
          .maybeSingle();

        const senderName = [senderProfile?.first_name, senderProfile?.last_name].filter(Boolean).join(" ") || "Someone";
        const senderRole = String(senderProfile?.role || "").toLowerCase();
        const recipientMessagesPath = senderRole === "provider" || senderRole === "seller" || senderRole === "contractor" ? "/dashboard/mail" : "/pro/messages";

        await admin.from("eloo_notifications").insert({
          user_id: recipientUserId,
          title: "New message",
          message: `${senderName} sent you a message.`,
          type: "new_message",
          action_url: recipientMessagesPath,
          is_read: false,
          data: {
            conversation_id,
            message_id: message.id,
            sender_id: user.id,
          },
        });

        const emailResult = await notifyJobEvent({
          action: "process_unread_alerts",
          userId: recipientUserId,
          limit: 100,
        });

        if (!emailResult.ok) {
          console.error("Unread message email failed:", emailResult);
        }
      } catch (notificationError) {
        console.error("Unread message notification failed:", notificationError);
      }
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
