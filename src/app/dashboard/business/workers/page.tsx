"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Loader2, Search, ShieldAlert, Star, Users } from "lucide-react";
import { SHIFT_NICHES, getShiftNiche } from "@/lib/shift-work";

type WorkerRow = {
  id: string;
  user_id: string;
  niches: string[];
  preferred_roles: string[];
  preferred_hourly_rate?: number | null;
  preferred_day_rate?: number | null;
  reliability_score?: number | null;
  profile?: { first_name?: string; last_name?: string; city?: string; is_verified?: boolean; kyc_status?: string } | null;
  seller?: { first_name?: string; last_name?: string; city?: string; service_category?: string; rating?: number; total_jobs?: number } | null;
};

export default function BusinessWorkersPage() {
  const [niche, setNiche] = useState<string>(SHIFT_NICHES[0].value);
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/business/shift-workers?niche=${encodeURIComponent(niche)}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Unable to load workers");
        setWorkers([]);
      } else {
        setWorkers(payload.workers || []);
      }
      setLoading(false);
    }
    load();
  }, [niche]);

  const selectedNiche = getShiftNiche(niche);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-950">Shift Worker Pool</h1>
          <p className="text-sm text-gray-600">Browse approved shift workers by niche before posting or assigning business work.</p>
        </div>

        <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <select value={niche} onChange={(event) => setNiche(event.target.value)} className="w-full bg-transparent text-sm outline-none">
                {SHIFT_NICHES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-600">
              Market average: €{selectedNiche.hourlyAverage}/hour · €{selectedNiche.dayAverage}/day
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Worker pool locked</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-10 text-gray-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading workers...
          </div>
        ) : workers.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workers.map((worker) => {
              const profile = worker.profile || worker.seller || {};
              const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Shift worker";
              return (
                <div key={worker.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-gray-950">{name}</h2>
                      <p className="text-sm text-gray-600">{profile.city || "Location not set"}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Available
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {worker.preferred_roles.map((role) => (
                      <span key={role} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        {role}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-gray-500">Hourly fee</p>
                      <p className="font-semibold text-gray-950">€{worker.preferred_hourly_rate || selectedNiche.hourlyAverage}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-gray-500">Day fee</p>
                      <p className="font-semibold text-gray-950">€{worker.preferred_day_rate || selectedNiche.dayAverage}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500" />
                      {worker.seller?.rating || "0.0"}
                    </span>
                    <span>{worker.seller?.total_jobs || 0} jobs</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <h2 className="font-semibold text-gray-950">No matching shift workers yet</h2>
            <p className="mt-1 text-sm text-gray-500">Workers will appear here after providers choose shift work and match this niche.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
