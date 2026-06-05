"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Clock, Calendar, MapPin, DollarSign, User, AlertCircle, UserCircle } from "lucide-react";
import { useState } from "react";

interface PendingJob {
  id: string;
  title: string;
  client: {
    name: string;
    photo: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  amount: number;
  location: string;
  status: "confirmed" | "pending_confirmation" | "in_progress";
  notes?: string;
}

const mockPendingJobs: PendingJob[] = [
  {
    id: "1",
    title: "Furniture Assembly - IKEA Bedroom Set",
    client: {
      name: "Sarah Johnson",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&face",
    },
    scheduledDate: "2026-03-18",
    scheduledTime: "2:00 PM",
    amount: 95,
    location: "Edinburgh, Scotland",
    status: "confirmed",
    notes: "Bring own tools. Parking available.",
  },
  {
    id: "2",
    title: "House Deep Cleaning",
    client: {
      name: "Michael Brown",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&face",
    },
    scheduledDate: "2026-03-19",
    scheduledTime: "10:00 AM",
    amount: 120,
    location: "Edinburgh, Scotland",
    status: "pending_confirmation",
  },
  {
    id: "3",
    title: "Garden Maintenance",
    client: {
      name: "David Thompson",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&face",
    },
    scheduledDate: "2026-03-20",
    scheduledTime: "9:00 AM",
    amount: 75,
    location: "Edinburgh, Scotland",
    status: "confirmed",
    notes: "Weekly recurring job.",
  },
];

const statusColors = {
  confirmed: "bg-green-100 text-green-700",
  pending_confirmation: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
};

const statusLabels = {
  confirmed: "Confirmed",
  pending_confirmation: "Pending Confirmation",
  in_progress: "In Progress",
};

export default function PendingJobsPage() {
  const [jobs, setJobs] = useState(mockPendingJobs);
  const [message, setMessage] = useState<string | null>(null);
  const totalPending = jobs.reduce((sum, job) => sum + job.amount, 0);

  function showMessage(nextMessage: string) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(null), 3500);
  }

  function setJobStatus(id: string, status: PendingJob["status"], action: string) {
    setJobs((current) => current.map((job) => job.id === id ? { ...job, status } : job));
    showMessage(`${action} saved.`);
  }

  function removeJob(id: string, action: string) {
    setJobs((current) => current.filter((job) => job.id !== id));
    showMessage(`${action} saved.`);
  }

  return (
    <ProviderLayout>
      <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending Jobs</h1>
          <p className="text-gray-600">Manage your upcoming scheduled jobs</p>
        </div>
        {message ? <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div> : null}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Pending</p>
            <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">
              {jobs.filter((j) => j.status === "confirmed").length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">To Collect On Site</p>
            <p className="text-2xl font-bold text-blue-600">£{totalPending}</p>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4 flex-1">
                  {job.client.photo ? (
                    <img
                      src={job.client.photo}
                      alt={job.client.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                      <UserCircle className="w-8 h-8" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                        {statusLabels[job.status]}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{job.client.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{job.scheduledDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{job.scheduledTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-gray-900">£{job.amount} onsite</span>
                      </div>
                    </div>

                    {job.notes && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-900">{job.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                {job.status === "pending_confirmation" && (
                  <>
                    <button type="button" onClick={() => setJobStatus(job.id, "confirmed", "Job confirmed")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                      Confirm Job
                    </button>
                    <button type="button" onClick={() => removeJob(job.id, "Job declined")} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                      Decline
                    </button>
                  </>
                )}
                {job.status === "confirmed" && (
                  <>
                    <button type="button" onClick={() => setJobStatus(job.id, "in_progress", "Job started")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Start Job
                    </button>
                    <button type="button" onClick={() => showMessage(`Reschedule request opened for ${job.title}.`)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Reschedule
                    </button>
                    <button type="button" onClick={() => showMessage(`Client contact opened for ${job.client.name}.`)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Contact Client
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No pending jobs</h3>
            <p className="text-gray-500">Check the Live Jobs page to find new opportunities!</p>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}
