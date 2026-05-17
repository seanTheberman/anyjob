"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface AssistanceRequest {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  lastUpdate: string;
  category: string;
}

const mockRequests: AssistanceRequest[] = [
  {
    id: "1",
    title: "Issue with booking token",
    description: "I need help with a booking token or onsite balance",
    status: "in_progress",
    createdAt: "2026-03-10",
    lastUpdate: "2 hours ago",
    category: "Billing",
  },
  {
    id: "2",
    title: "Provider didn't show up",
    description: "The provider I booked didn't arrive at the scheduled time",
    status: "open",
    createdAt: "2026-03-12",
    lastUpdate: "1 day ago",
    category: "Service Issue",
  },
];

const statusConfig = {
  open: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", label: "Open" },
  in_progress: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", label: "In Progress" },
  resolved: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", label: "Resolved" },
};

export default function AssistancePage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Assistance Requests</h1>
          <Link
            href="/dashboard/assistance/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Request
          </Link>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {mockRequests.map((request) => {
            const StatusIcon = statusConfig[request.status].icon;
            return (
              <div
                key={request.id}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{request.title}</h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusConfig[request.status].bg
                        } ${statusConfig[request.status].color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig[request.status].label}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{request.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Category: {request.category}</span>
                      <span>Created: {request.createdAt}</span>
                      <span>Last update: {request.lastUpdate}</span>
                    </div>
                  </div>
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {mockRequests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assistance requests</h3>
            <p className="text-gray-500 mb-4">
              Need help? Create a new request and our team will assist you
            </p>
            <Link
              href="/dashboard/assistance/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Request
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
