import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch conversations and messages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Get last message and unread count for each conversation
    const conversationsWithMeta = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: lastMsg } = await supabase
          .from("eloo_messages")
          .select("content, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { count } = await supabase
          .from("eloo_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id)
          .eq("is_read", false);

        // Fetch client and provider info
        const { data: client, error: clientError } = await supabase
          .from("eloo_profiles")
          .select("id, first_name, last_name")
          .eq("id", conv.client_id)
          .single();

        const { data: provider, error: providerError } = await supabase
          .from("eloo_profiles")
          .select("id, first_name, last_name")
          .eq("id", conv.provider_id)
          .single();

        if (clientError) {
          console.error("Error fetching client:", clientError);
        }
        if (providerError) {
          console.error("Error fetching provider:", providerError);
        }

        return {
          ...conv,
          client,
          provider,
          last_message: lastMsg,
          unread_count: count || 0,
        };
      })
    );

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

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
