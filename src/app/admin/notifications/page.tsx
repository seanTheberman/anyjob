import Link from "next/link";
import { Bell, Check, ExternalLink, MailOpen } from "lucide-react";

import { AdminShell } from "../_components/AdminShell";
import { StatusBadge } from "../_components/AdminPrimitives";
import {
  formatNotificationType,
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  notificationTime,
} from "../_lib/admin-notifications";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const { notifications, unreadCount } = await getAdminNotifications();

  return (
    <AdminShell
      title="Notifications"
      description="Review live admin notifications from Supabase and clear unread items after they have been handled."
      actions={
        <form action={markAllAdminNotificationsRead}>
          <button
            type="submit"
            disabled={unreadCount === 0}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-slate-950 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <MailOpen className="h-4 w-4" />
            Mark all read
          </button>
        </form>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Unread</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{unreadCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total loaded</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{notifications.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Source</p>
          <p className="mt-3 text-sm font-semibold text-slate-950">eloo_notifications</p>
          <p className="mt-1 text-sm text-slate-500">Latest 100 records</p>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {notifications.length ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <article key={notification.id} className={`grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-start ${notification.isRead ? "" : "bg-red-50/30"}`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {!notification.isRead ? <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
                    <h2 className="text-base font-semibold text-slate-950">{notification.title}</h2>
                    <StatusBadge value={notification.isRead ? "Read" : "Unread"} />
                    <StatusBadge value={formatNotificationType(notification.type)} />
                  </div>
                  {notification.message ? (
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{notification.message}</p>
                  ) : null}
                  <p className="mt-2 text-xs font-medium text-slate-500">{notificationTime(notification.createdAt)}</p>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {notification.actionUrl ? (
                    <Link
                      href={notification.actionUrl}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Open
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  ) : null}
                  {!notification.isRead ? (
                    <form action={markAdminNotificationRead}>
                      <input type="hidden" name="id" value={notification.id} />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        <Check className="h-4 w-4" />
                        Mark read
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <Bell className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-lg font-semibold text-slate-950">No notifications</h2>
            <p className="mt-1 text-sm text-slate-600">Supabase has no notification records yet.</p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
