"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Briefcase, Calendar, Clock, Loader2, MapPin, Search, ShieldAlert, Users } from "lucide-react";
import { SHIFT_NICHES, getShiftNiche } from "@/lib/shift-work";

type ShiftJob = {
  id: string;
  work_type: string;
  niche: string;
  role_title: string;
  description: string;
  city: string;
  starts_at?: string | null;
  ends_at?: string | null;
  headcount: number;
  business_preferred_hourly_rate?: number | null;
  business_preferred_day_rate?: number | null;
  business?: { business_name?: string; industry?: string } | null;
};

export default function ProviderShiftBoardPage() {
  const [niche, setNiche] = useState("");
  const [jobs, setJobs] = useState<ShiftJob[]>([]);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (niche) params.set("niche", niche);
      const response = await fetch(`/api/shifts?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Unable to load shift jobs");
        setJobs([]);
      } else {
        setJobs(payload.jobs || []);
        setReason(payload.reason || null);
      }
      setLoading(false);
    }
    load();
  }, [niche]);

  return (
    <ProviderLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-950">Shift Board</h1>
          <p className="text-sm text-gray-600">Business day-wage and shift posts matched to your shift-worker niches.</p>
        </div>

        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <select value={niche} onChange={(event) => setNiche(event.target.value)} className="w-full bg-transparent text-sm outline-none">
                <option value="">All my shift niches</option>
                {SHIFT_NICHES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <Link href="/become-provider" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Update work mode
            </Link>
          </div>
        </div>

        {error || reason ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{error ? "Shift board unavailable" : "Shift profile update needed"}</p>
              <p className="mt-1">{error || reason}</p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-gray-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading shift jobs...
          </div>
        ) : jobs.length ? (
          <div className="space-y-4">
            {jobs.map((job) => {
              const nicheInfo = getShiftNiche(job.niche);
              return (
                <article key={job.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">{nicheInfo.label}</span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{job.work_type.replaceAll("_", " ")}</span>
                      </div>
                      <h2 className="text-lg font-bold text-gray-950">{job.role_title}</h2>
                      <p className="mt-1 text-sm text-gray-600">{job.business?.business_name || "Approved business"}</p>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-lg font-bold text-gray-950">€{job.business_preferred_hourly_rate || nicheInfo.hourlyAverage}/h</p>
                      <p className="text-xs text-gray-500">Business preferred rate</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-700">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.city}
                    </span>
                    {job.starts_at ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(job.starts_at).toLocaleDateString()}
                      </span>
                    ) : null}
                    {job.starts_at && job.ends_at ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(job.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(job.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.headcount} worker{job.headcount === 1 ? "" : "s"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <h2 className="font-semibold text-gray-950">No matching shift jobs</h2>
            <p className="mt-1 text-sm text-gray-500">When approved businesses post jobs in your niche, they will appear here.</p>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}
