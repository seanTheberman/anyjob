import { cleanText } from "../tokens.ts";
import { createAdminClient } from "../supabase-admin.ts";
import type { TenantContext } from "../tenant-email.ts";
import { escapeHtml, fullAppUrl, sendNotificationEmail } from "./core.ts";

type ConversationRow = {
  id: string;
  client_id: string | null;
  provider_id: string | null;
  is_active: boolean | null;
};

type MessageRow = {
  id: string;
  conversation_id: string | null;
  sender_id: string | null;
  content: string | null;
  created_at: string | null;
};

type NotificationRow = {
  id: string;
  user_id: string | null;
  title: string | null;
  message: string | null;
  type: string | null;
  action_url: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  role: string | null;
};

type UserUnreadSummary = {
  userId: string;
  messageCount: number;
  notificationCount: number;
  latestMessage?: MessageRow;
  latestNotification?: NotificationRow;
  conversationIds: Set<string>;
};

const MESSAGE_NOTIFICATION_TYPES = new Set(["message", "new_message"]);

function hourKey() {
  return new Date().toISOString().slice(0, 13);
}

function ensureSummary(groups: Map<string, UserUnreadSummary>, userId: string) {
  const existing = groups.get(userId);
  if (existing) return existing;
  const created: UserUnreadSummary = {
    userId,
    messageCount: 0,
    notificationCount: 0,
    conversationIds: new Set(),
  };
  groups.set(userId, created);
  return created;
}

function recipientForMessage(message: MessageRow, conversation?: ConversationRow) {
  if (!conversation || conversation.is_active === false || !message.sender_id) return null;
  if (conversation.client_id === message.sender_id) return conversation.provider_id;
  if (conversation.provider_id === message.sender_id) return conversation.client_id;
  return null;
}

function inboxPath(role?: string | null) {
  const normalized = cleanText(role).toLowerCase();
  if (["provider", "seller", "contractor"].includes(normalized)) return "/pro/messages";
  return "/dashboard/mail";
}

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function latestSnippet(value: string | null | undefined, fallback: string) {
  const text = cleanText(value, fallback).replace(/\s+/g, " ");
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

export async function processUnreadAlerts(
  context: TenantContext,
  options: { userId?: string | null; limit?: number } = {}
) {
  const supabase = createAdminClient();
  const targetUserId = cleanText(options.userId);
  const limit = Math.min(Math.max(Number(options.limit || 250), 1), 1000);
  const summaries = new Map<string, UserUnreadSummary>();

  let messageQuery = supabase
    .from("eloo_messages")
    .select("id,conversation_id,sender_id,content,created_at")
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (targetUserId) {
    const { data: targetConversations, error: targetConversationError } = await supabase
      .from("eloo_conversations")
      .select("id")
      .or(`client_id.eq.${targetUserId},provider_id.eq.${targetUserId}`)
      .eq("is_active", true)
      .limit(limit);

    if (targetConversationError) throw targetConversationError;
    const ids = (targetConversations || []).map((conversation) => conversation.id).filter(Boolean);
    if (ids.length === 0) {
      messageQuery = messageQuery.in("conversation_id", ["00000000-0000-0000-0000-000000000000"]);
    } else {
      messageQuery = messageQuery.in("conversation_id", ids);
    }
  }

  const { data: messages, error: messageError } = await messageQuery;
  if (messageError) throw messageError;

  const conversationIds = Array.from(new Set((messages || []).map((message) => message.conversation_id).filter(Boolean)));
  const conversationsById = new Map<string, ConversationRow>();

  if (conversationIds.length > 0) {
    const { data: conversations, error: conversationError } = await supabase
      .from("eloo_conversations")
      .select("id,client_id,provider_id,is_active")
      .in("id", conversationIds);

    if (conversationError) throw conversationError;
    for (const conversation of conversations || []) {
      conversationsById.set(conversation.id, conversation);
    }
  }

  for (const message of messages || []) {
    const recipientUserId = recipientForMessage(message, message.conversation_id ? conversationsById.get(message.conversation_id) : undefined);
    if (!recipientUserId || recipientUserId === message.sender_id) continue;
    if (targetUserId && recipientUserId !== targetUserId) continue;

    const summary = ensureSummary(summaries, recipientUserId);
    summary.messageCount += 1;
    summary.latestMessage ||= message;
    if (message.conversation_id) summary.conversationIds.add(message.conversation_id);
  }

  let notificationQuery = supabase
    .from("eloo_notifications")
    .select("id,user_id,title,message,type,action_url,created_at")
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (targetUserId) notificationQuery = notificationQuery.eq("user_id", targetUserId);

  const { data: notifications, error: notificationError } = await notificationQuery;
  if (notificationError) throw notificationError;

  for (const notification of notifications || []) {
    if (!notification.user_id) continue;
    if (MESSAGE_NOTIFICATION_TYPES.has(cleanText(notification.type).toLowerCase())) continue;

    const summary = ensureSummary(summaries, notification.user_id);
    summary.notificationCount += 1;
    summary.latestNotification ||= notification;
  }

  const userIds = Array.from(summaries.keys());
  const profilesById = new Map<string, ProfileRow>();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("eloo_profiles")
      .select("id,role")
      .in("id", userIds);

    if (profileError) throw profileError;
    for (const profile of profiles || []) {
      profilesById.set(profile.id, profile);
    }
  }

  const results = [];
  const dedupeHour = hourKey();

  for (const summary of summaries.values()) {
    const totalUnread = summary.messageCount + summary.notificationCount;
    if (totalUnread <= 0) continue;

    const profile = profilesById.get(summary.userId);
    const actionPath = summary.messageCount > 0 ? inboxPath(profile?.role) : "/dashboard/notifications";
    const lines = [];

    if (summary.messageCount > 0) {
      lines.push(
        `<p>You have <strong>${plural(summary.messageCount, "unread message")}</strong> waiting in AnyJob.</p>`
      );
      if (summary.latestMessage) {
        lines.push(`<p>Latest message: "${escapeHtml(latestSnippet(summary.latestMessage.content, "Open AnyJob to read it."))}"</p>`);
      }
    }

    if (summary.notificationCount > 0) {
      lines.push(
        `<p>You also have <strong>${plural(summary.notificationCount, "unread notification")}</strong> on your account.</p>`
      );
      if (summary.latestNotification) {
        lines.push(`<p>Latest notification: ${escapeHtml(latestSnippet(summary.latestNotification.title, "Account update"))}</p>`);
      }
    }

    const result = await sendNotificationEmail(context, {
      eventKey: "account.unread_alerts",
      dedupeKey: `unread-alerts:${summary.userId}:${dedupeHour}`,
      userId: summary.userId,
      subject: totalUnread === 1 ? "You have an unread AnyJob update" : `You have ${totalUnread} unread AnyJob updates`,
      title: "Unread AnyJob updates",
      body: lines.join(""),
      actionLabel: summary.messageCount > 0 ? "Open messages" : "Open notifications",
      actionUrl: fullAppUrl(context, actionPath),
      sourceTable: "eloo_notifications",
      metadata: {
        unread_messages: summary.messageCount,
        unread_notifications: summary.notificationCount,
        conversation_ids: Array.from(summary.conversationIds),
      },
    });

    results.push({
      userId: summary.userId,
      unreadMessages: summary.messageCount,
      unreadNotifications: summary.notificationCount,
      result,
    });
  }

  return { processed: results.length, results };
}
