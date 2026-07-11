import "server-only";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { logAdminAction } from "@/lib/auth/admin-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string | null;
  recipientCount?: number;
  audience?: string;
  broadcastId?: string;
};

type AnyRecord = Record<string, unknown>;
type BroadcastAudience = "all" | "buyers" | "providers" | "businesses";

const broadcastAudiences = new Set(["all", "buyers", "providers", "businesses"]);

function formatType(value: string) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Notification";
}

export function formatNotificationType(value: string) {
  return formatType(value);
}

export function notificationTime(value: string | null) {
  if (!value) return "Unknown";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "Recently";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function fetchAllRows(table: string, select: string, limit = 10000): Promise<AnyRecord[]> {
  const supabase = createAdminSupabaseClient() as never as {
    from(name: string): {
      select(columns: string): {
        range(from: number, to: number): Promise<{ data: AnyRecord[] | null; error: { message: string } | null }>;
      };
    };
  };
  const batchSize = 1000;
  const rows: AnyRecord[] = [];

  for (let from = 0; from < limit; from += batchSize) {
    const { data, error } = await supabase.from(table).select(select).range(from, Math.min(from + batchSize - 1, limit - 1));
    if (error || !data?.length) break;
    rows.push(...data);
    if (data.length < batchSize) break;
  }

  return rows;
}

async function getBroadcastRecipients(audience: BroadcastAudience) {
  const [profiles, sellers, businesses] = await Promise.all([
    fetchAllRows("eloo_profiles", "id,role,email"),
    audience === "providers" ? fetchAllRows("sellers", "id") : Promise.resolve([]),
    audience === "businesses" ? fetchAllRows("business_profiles", "owner_user_id,status") : Promise.resolve([]),
  ]);

  const profileIds = new Set(profiles.map((profile) => String(profile.id || "")).filter(Boolean));
  const recipients = new Set<string>();

  if (audience === "all") {
    for (const profile of profiles) {
      const role = String(profile.role || "").toLowerCase();
      const id = String(profile.id || "");
      if (id && role !== "admin") recipients.add(id);
    }
  }

  if (audience === "buyers") {
    for (const profile of profiles) {
      const role = String(profile.role || "").toLowerCase();
      const id = String(profile.id || "");
      if (id && ["client", "buyer"].includes(role)) recipients.add(id);
    }
  }

  if (audience === "providers") {
    const sellerIds = new Set(sellers.map((seller) => String(seller.id || "")).filter(Boolean));
    for (const profile of profiles) {
      const role = String(profile.role || "").toLowerCase();
      const id = String(profile.id || "");
      if (id && (["provider", "seller"].includes(role) || sellerIds.has(id))) recipients.add(id);
    }
  }

  if (audience === "businesses") {
    for (const business of businesses) {
      const ownerId = String(business.owner_user_id || "");
      if (ownerId && profileIds.has(ownerId)) recipients.add(ownerId);
    }
  }

  return Array.from(recipients);
}

function normalizeActionUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") || trimmed.startsWith("https://") || trimmed.startsWith("http://")) return trimmed;
  return `/${trimmed}`;
}

function audienceLabel(value: string) {
  if (value === "buyers") return "Buyers";
  if (value === "providers") return "Providers";
  if (value === "businesses") return "Businesses";
  return "Everyone";
}

export async function getUnreadAdminNotificationCount() {
  const supabase = createAdminSupabaseClient();
  const { count, error } = await supabase
    .from("eloo_notifications")
    .select("id", { count: "exact", head: true })
    .is("user_id", null)
    .eq("is_read", false);

  if (error) return 0;
  return count || 0;
}

export async function getAdminNotifications() {
  const supabase = createAdminSupabaseClient();
  const client = supabase as never as {
    from(table: string): {
      select(columns: string): {
        order(column: string, options?: { ascending?: boolean }): {
          limit(count: number): Promise<{ data: AnyRecord[] | null; error: { message: string } | null }>;
        };
      };
    };
  };
  const { data, error } = await client
    .from("eloo_notifications")
    .select("id,user_id,title,message,type,action_url,is_read,created_at,data")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    return {
      notifications: [] as AdminNotification[],
      unreadCount: 0,
    };
  }

  const grouped = new Map<string, AdminNotification>();
  for (const row of data) {
    const dataValue = (row.data || {}) as AnyRecord;
    const broadcastId = typeof dataValue.broadcast_id === "string" ? dataValue.broadcast_id : "";
    const groupKey = broadcastId ? `broadcast:${broadcastId}` : String(row.id);
    const existing = grouped.get(groupKey);
    if (existing) {
      existing.recipientCount = (existing.recipientCount || 1) + 1;
      existing.isRead = existing.isRead && row.is_read === true;
      continue;
    }

    grouped.set(groupKey, {
      id: String(row.id || groupKey),
      title: String(row.title || "Notification"),
      message: String(row.message || ""),
      type: String(row.type || "system"),
      actionUrl: typeof row.action_url === "string" ? row.action_url : null,
      isRead: row.is_read === true,
      createdAt: typeof row.created_at === "string" ? row.created_at : null,
      recipientCount: broadcastId ? 1 : undefined,
      audience: typeof dataValue.audience === "string" ? dataValue.audience : undefined,
      broadcastId: broadcastId || undefined,
    });
  }

  const notifications = Array.from(grouped.values()).slice(0, 100);

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.isRead && !notification.broadcastId).length,
  };
}

export async function sendAdminBroadcastNotification(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const title = String(formData.get("title") || "").trim().slice(0, 120);
  const message = String(formData.get("message") || "").trim().slice(0, 800);
  const rawAudience = String(formData.get("audience") || "all");
  const audience = (broadcastAudiences.has(rawAudience) ? rawAudience : "all") as BroadcastAudience;
  const actionUrl = normalizeActionUrl(String(formData.get("action_url") || ""));

  if (!title || !message) {
    redirect("/admin/notifications?broadcast_error=missing_fields");
  }

  const recipientIds = await getBroadcastRecipients(audience);
  if (!recipientIds.length) {
    redirect(`/admin/notifications?broadcast_error=no_recipients&audience=${encodeURIComponent(audience)}`);
  }

  const supabase = createAdminSupabaseClient();
  const broadcastId = randomUUID();
  const now = new Date().toISOString();
  const rows = recipientIds.map((userId) => ({
    user_id: userId,
    title,
    message,
    type: "admin_broadcast",
    action_url: actionUrl,
    is_read: false,
    created_at: now,
    data: {
      broadcast_id: broadcastId,
      audience,
      audience_label: audienceLabel(audience),
      sent_by: admin.id,
    },
  }));

  for (let index = 0; index < rows.length; index += 500) {
    const { error } = await supabase.from("eloo_notifications").insert(rows.slice(index, index + 500));
    if (error) {
      redirect(`/admin/notifications?broadcast_error=${encodeURIComponent(error.message)}`);
    }
  }

  await logAdminAction({
    actorId: admin.id,
    action: "notifications.broadcast",
    targetType: "notification_broadcast",
    targetId: broadcastId,
    metadata: { audience, recipientCount: recipientIds.length, title, actionUrl },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/pro/notifications");
  redirect(`/admin/notifications?broadcast_sent=${recipientIds.length}&audience=${encodeURIComponent(audience)}`);
}

export async function markAdminNotificationRead(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = createAdminSupabaseClient();
  await supabase.from("eloo_notifications").update({ is_read: true }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}

export async function markAllAdminNotificationsRead() {
  "use server";

  const supabase = createAdminSupabaseClient();
  await supabase.from("eloo_notifications").update({ is_read: true }).eq("is_read", false);
  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}
