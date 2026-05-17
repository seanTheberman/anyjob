import { NextRequest, NextResponse } from "next/server";

// Webhook endpoint for Supabase Database Webhooks
// Configure in Supabase Dashboard: Database > Webhooks
// Trigger: INSERT on eloo_messages table
// URL: https://your-domain.com/api/webhooks/chat

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
  };
  old_record?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional, configure in Supabase)
    const authHeader = request.headers.get("authorization");
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: WebhookPayload = await request.json();

    if (payload.type === "INSERT" && payload.table === "eloo_messages") {
      const { conversation_id, sender_id, content } = payload.record;

      // Here you can integrate with external notification services:
      // 1. Send push notifications (e.g., Firebase Cloud Messaging)
      // 2. Send email notifications for offline users
      // 3. Send SMS notifications for urgent messages
      // 4. Integrate with Slack/Discord webhooks

      console.log(`[Chat Webhook] New message in conversation ${conversation_id} from ${sender_id}: ${content.substring(0, 50)}...`);

      // Example: Send email notification (implement with your email service)
      // await sendEmailNotification(conversation_id, sender_id, content);

      // Example: Send push notification
      // await sendPushNotification(conversation_id, sender_id, content);

      return NextResponse.json({ 
        success: true, 
        message: "Webhook processed",
        conversation_id,
      });
    }

    return NextResponse.json({ success: true, message: "No action taken" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
