import "server-only";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string | null;
};

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

export async function getUnreadAdminNotificationCount() {
  const supabase = createAdminSupabaseClient();
  const { count, error } = await supabase
    .from("eloo_notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) return 0;
  return count || 0;
}

export async function getAdminNotifications() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("eloo_notifications")
    .select("id,title,message,type,action_url,is_read,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return {
      notifications: [] as AdminNotification[],
      unreadCount: 0,
    };
  }

  const notifications = data.map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message || "",
    type: row.type || "system",
    actionUrl: row.action_url,
    isRead: row.is_read === true,
    createdAt: row.created_at,
  }));

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.isRead).length,
  };
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
