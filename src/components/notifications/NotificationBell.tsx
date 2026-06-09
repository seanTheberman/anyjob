"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Briefcase, Calendar, Check, MessageSquare, ReceiptText, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { InsuranceNotice } from "@/components/safety/InsuranceNotice";

type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string | null;
};

type NotificationPayload = {
  notifications: AppNotification[];
  unreadCount: number;
};

const iconByType = {
  job: Briefcase,
  job_more_info_requested: Briefcase,
  message: MessageSquare,
  new_message: MessageSquare,
  review: Star,
  booking: Calendar,
  payment: ReceiptText,
  system: Bell,
};

function timeAgo(value: string | null) {
  if (!value) return "Unknown";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "Recently";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function notificationIcon(type: string) {
  return iconByType[type as keyof typeof iconByType] || Bell;
}

function iconClass(type: string, accent: "red" | "green") {
  if (type.includes("message")) return "bg-emerald-50 text-emerald-600";
  if (type.includes("review")) return "bg-amber-50 text-amber-600";
  if (type.includes("payment") || type.includes("booking")) return "bg-blue-50 text-blue-600";
  return accent === "green" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600";
}

export function NotificationBell({ href, accent = "red" }: { href: string; accent?: "red" | "green" }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<NotificationPayload>({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    setLoading(true);
    const response = await fetch("/api/notifications?limit=5", { cache: "no-store" }).catch(() => null);
    if (response?.ok) {
      const data = await response.json().catch(() => null);
      setPayload({
        notifications: Array.isArray(data?.notifications) ? data.notifications : [],
        unreadCount: Number(data?.unreadCount || 0),
      });
    } else {
      setPayload({ notifications: [], unreadCount: 0 });
    }
    setLoading(false);
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadNotifications();
    });
  }, []);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          if (!open) void loadNotifications();
        }}
        className="relative rounded-full p-2 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {payload.unreadCount > 0 ? (
          <span className={cn("absolute right-1 top-1 h-2 w-2 rounded-full", accent === "green" ? "bg-green-500" : "bg-red-500")} />
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notification drawer"
          className="absolute right-0 top-full z-[60] mt-2 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">
                {payload.unreadCount > 0 ? `${payload.unreadCount} unread` : "All caught up"}
              </p>
            </div>
            <Link href={href} onClick={() => setOpen(false)} className={cn("text-xs font-semibold", accent === "green" ? "text-green-600" : "text-red-600")}>
              View all
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto">
            <div className="border-b border-gray-100 p-3">
              <InsuranceNotice compact accent={accent} />
            </div>
            {loading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : payload.notifications.length ? (
              payload.notifications.map((notification) => {
                const Icon = notificationIcon(notification.type);
                const content = (
                  <div className={cn("flex gap-3 px-4 py-3 text-left hover:bg-gray-50", !notification.isRead && "bg-gray-50")}>
                    <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", iconClass(notification.type, accent))}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">{notification.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-gray-600">{notification.message || "Open notification details."}</span>
                      <span className="mt-1 block text-xs text-gray-400">{timeAgo(notification.createdAt)}</span>
                    </span>
                    {!notification.isRead ? <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", accent === "green" ? "bg-green-500" : "bg-red-500")} /> : null}
                  </div>
                );

                return notification.actionUrl ? (
                  <Link key={notification.id} href={notification.actionUrl} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                );
              })
            ) : (
              <div className="p-6 text-center">
                <Bell className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm font-semibold text-gray-900">No notifications</p>
                <p className="mt-1 text-xs text-gray-500">New updates will appear here.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function NotificationCenter({ title = "Notifications", accent = "red" }: { title?: string; accent?: "red" | "green" }) {
  const [payload, setPayload] = useState<NotificationPayload>({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    setLoading(true);
    const response = await fetch("/api/notifications?limit=100", { cache: "no-store" }).catch(() => null);
    if (response?.ok) {
      const data = await response.json().catch(() => null);
      setPayload({
        notifications: Array.isArray(data?.notifications) ? data.notifications : [],
        unreadCount: Number(data?.unreadCount || 0),
      });
    } else {
      setPayload({ notifications: [], unreadCount: 0 });
    }
    setLoading(false);
  }

  async function markAsRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    await loadNotifications();
  }

  async function markAllAsRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    }).catch(() => null);
    await loadNotifications();
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadNotifications();
    });
  }, []);

  return (
    <div className="mx-auto mt-4 max-w-4xl lg:mt-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-gray-600">
            {payload.unreadCount > 0 ? `You have ${payload.unreadCount} unread notification${payload.unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
          </p>
        </div>
        <button
          type="button"
          onClick={markAllAsRead}
          disabled={payload.unreadCount === 0}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            accent === "green" ? "text-green-700 hover:bg-green-50" : "text-red-700 hover:bg-red-50"
          )}
        >
          <Check className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      <div className="mb-4">
        <InsuranceNotice accent={accent} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-lg border border-gray-200 bg-white" />
          ))}
        </div>
      ) : payload.notifications.length ? (
        <div className="space-y-3">
          {payload.notifications.map((notification) => {
            const Icon = notificationIcon(notification.type);
            return (
              <article
                key={notification.id}
                className={cn("rounded-lg border bg-white p-5 transition-colors", notification.isRead ? "border-gray-200" : accent === "green" ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30")}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconClass(notification.type, accent))}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <h2 className="font-semibold text-gray-900">{notification.title}</h2>
                      <span className="text-sm text-gray-500">{timeAgo(notification.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-6 text-gray-600">{notification.message || "Open notification details."}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {notification.actionUrl ? (
                        <Link href={notification.actionUrl} className={cn("text-sm font-semibold", accent === "green" ? "text-green-700" : "text-red-700")}>
                          View details
                        </Link>
                      ) : null}
                      {!notification.isRead ? (
                        <button type="button" onClick={() => markAsRead(notification.id)} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                          Mark as read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-3 text-lg font-semibold text-gray-900">No notifications</h2>
          <p className="mt-1 text-gray-500">You&apos;re all caught up. New updates will appear here.</p>
        </div>
      )}
    </div>
  );
}
