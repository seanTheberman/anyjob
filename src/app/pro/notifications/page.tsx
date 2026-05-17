"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Bell, Check, X, Calendar, MessageSquare, Star, ReceiptText } from "lucide-react";

interface Notification {
  id: string;
  type: "job" | "message" | "review" | "booking" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "job",
    title: "New Job Request",
    message: "Sarah Johnson requested you for Furniture Assembly",
    timestamp: "2 hours ago",
    read: false,
    actionUrl: "/pro/jobs/1",
  },
  {
    id: "2",
    type: "message",
    title: "New Message",
    message: "Michael Brown sent you a message about House Cleaning",
    timestamp: "5 hours ago",
    read: false,
    actionUrl: "/pro/messages",
  },
  {
    id: "3",
    type: "review",
    title: "New Review",
    message: "Emma Wilson left you a 5-star review",
    timestamp: "1 day ago",
    read: true,
    actionUrl: "/pro/reviews",
  },
  {
    id: "4",
    type: "booking",
    title: "Booking Token Paid",
    message: "Client paid the booking token for Furniture Assembly. Collect your quote on site.",
    timestamp: "1 day ago",
    read: true,
    actionUrl: "/pro/earnings",
  },
  {
    id: "5",
    type: "system",
    title: "Badge Unlocked!",
    message: "Congratulations! You've earned the Rising Talent badge",
    timestamp: "2 days ago",
    read: true,
    actionUrl: "/pro/badges",
  },
  {
    id: "6",
    type: "job",
    title: "Job Completed",
    message: "House Cleaning job marked as completed",
    timestamp: "3 days ago",
    read: true,
  },
  {
    id: "7",
    type: "booking",
    title: "Quote Accepted",
    message: "Your House Cleaning quote was accepted. AnyJob collected the booking token only.",
    timestamp: "5 days ago",
    read: true,
    actionUrl: "/pro/earnings",
  },
];

const notificationIcons = {
  job: Calendar,
  message: MessageSquare,
  review: Star,
  booking: ReceiptText,
  system: Bell,
};

const notificationColors = {
  job: "bg-blue-100 text-blue-600",
  message: "bg-green-100 text-green-600",
  review: "bg-yellow-100 text-yellow-600",
  booking: "bg-red-100 text-red-600",
  system: "bg-gray-100 text-gray-600",
};

export default function NotificationsPage() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <ProviderLayout>
      <div className="max-w-4xl mx-auto mt-4 lg:mt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {mockNotifications.map((notification) => {
            const Icon = notificationIcons[notification.type];
            return (
              <div
                key={notification.id}
                className={`bg-white rounded-xl p-5 border transition-colors ${
                  notification.read ? "border-gray-200" : "border-blue-200 bg-blue-50/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notificationColors[notification.type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className={`font-semibold ${notification.read ? "text-gray-900" : "text-gray-900"}`}>
                        {notification.title}
                      </h3>
                      <span className="text-sm text-gray-500 whitespace-nowrap">{notification.timestamp}</span>
                    </div>
                    <p className="text-gray-600 mb-3">{notification.message}</p>

                    <div className="flex items-center gap-2">
                      {notification.actionUrl && (
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          View Details
                        </button>
                      )}
                      {!notification.read && (
                        <button className="text-sm text-gray-600 hover:text-gray-700">
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>

                  <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State (if no notifications) */}
        {mockNotifications.length === 0 && (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications</h3>
            <p className="text-gray-500">You&apos;re all caught up! Check back later for updates.</p>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}
