import Link from "next/link";
import { Bell, Check, ExternalLink, MailOpen, Send } from "lucide-react";

import { AdminShell } from "../_components/AdminShell";
import { StatusBadge } from "../_components/AdminPrimitives";
import {
  formatNotificationType,
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  notificationTime,
  sendAdminBroadcastNotification,
} from "../_lib/admin-notifications";
import { type AdminSearchParams, firstParam } from "../_lib/admin-query";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage({ searchParams }: { searchParams?: AdminSearchParams }) {
  const params = (await searchParams) || {};
  const sentCount = firstParam(params, "broadcast_sent", "");
  const sentAudience = firstParam(params, "audience", "");
  const broadcastError = firstParam(params, "broadcast_error", "");
  const { notifications, unreadCount } = await getAdminNotifications();

  return (
    <AdminShell
      title="Notifications"
      description="Send manual in-app notifications to users and review recent notification activity."
      actions={
        <form action={markAllAdminNotificationsRead}>
          <button
            type="submit"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-slate-950 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <MailOpen className="h-4 w-4" />
            {unreadCount === 0 ? "Refresh read state" : "Mark all read"}
          </button>
        </form>
      }
    >
      {sentCount ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Sent notification to {sentCount} {sentCount === "1" ? "recipient" : "recipients"}{sentAudience ? ` (${sentAudience})` : ""}.
        </div>
      ) : null}
      {broadcastError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {broadcastError === "missing_fields"
            ? "Add a title and message before sending."
            : broadcastError === "no_recipients"
              ? "No recipients were found for that audience."
              : `Notification could not be sent: ${broadcastError}`}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Send in-app notification</h2>
          <p className="mt-1 text-sm text-slate-600">
            Broadcast a custom message to user notification bells and notification pages.
          </p>
        </div>
        <form action={sendAdminBroadcastNotification} className="grid gap-4 p-5 xl:grid-cols-[220px_1fr]">
          <div>
            <label htmlFor="audience" className="text-sm font-semibold text-slate-800">Audience</label>
            <select id="audience" name="audience" defaultValue="all" className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800">
              <option value="all">Everyone</option>
              <option value="buyers">Buyers only</option>
              <option value="providers">Providers only</option>
              <option value="businesses">Business accounts</option>
            </select>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div>
              <label htmlFor="title" className="text-sm font-semibold text-slate-800">Title</label>
              <input
                id="title"
                name="title"
                required
                maxLength={120}
                placeholder="Example: New platform update"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label htmlFor="action_url" className="text-sm font-semibold text-slate-800">Action link</label>
              <input
                id="action_url"
                name="action_url"
                maxLength={180}
                placeholder="/dashboard/requests"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="message" className="text-sm font-semibold text-slate-800">Message</label>
              <textarea
                id="message"
                name="message"
                required
                maxLength={800}
                rows={4}
                placeholder="Write exactly what users should see in their notification center."
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">This sends an in-app notification. It does not send an email broadcast.</p>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                >
                  <Send className="h-4 w-4" />
                  Send notification
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
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
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Recent notification activity</h2>
          <p className="mt-1 text-sm text-slate-600">Broadcasts are grouped here so one send does not flood the admin view.</p>
        </div>
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
                    {notification.recipientCount ? <StatusBadge value={`${notification.recipientCount} recipients`} /> : null}
                    {notification.audience ? <StatusBadge value={notification.audience} /> : null}
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
                  {!notification.isRead && !notification.broadcastId ? (
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
