"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle, Clock, DollarSign, Loader2, MapPin, UserCircle } from "lucide-react";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { formatMoney } from "@/lib/booking-token";

type ProviderBid = {
  id: string;
  amount: number;
  status: string;
  created_at: string | null;
  inquiry?: {
    id: string;
    category_slug: string | null;
    subcategory_slug: string | null;
    job_description: string | null;
    city: string | null;
    preferred_date: string | null;
    budget_range_min: number | null;
    budget_range_max: number | null;
  } | null;
};

function hasMeaningfulText(value?: string | null) {
  return /[\p{L}\p{N}]/u.test(value || "");
}

function jobTitle(job?: ProviderBid["inquiry"]) {
  const description = String(job?.job_description || "").trim();
  const blocks = description.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  if (blocks[0] && blocks[0].length <= 120 && hasMeaningfulText(blocks[0])) return blocks[0];
  if (hasMeaningfulText(description)) return description.split(/[.!?]/).find((part) => hasMeaningfulText(part))?.trim() || description.slice(0, 80);
  return String(job?.subcategory_slug || job?.category_slug || "Accepted job").replaceAll("-", " ");
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PendingJobsPage() {
  const [bids, setBids] = useState<ProviderBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPendingJobs() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/bids?role=provider", { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(payload.error || "Could not load pending jobs.");
          setBids([]);
          return;
        }
        const accepted = (payload.bids || []).filter((bid: ProviderBid) => ["accepted", "in_progress"].includes(String(bid.status || "").toLowerCase()));
        setBids(accepted);
      } catch {
        setError("Could not load pending jobs.");
        setBids([]);
      } finally {
        setLoading(false);
      }
    }

    void loadPendingJobs();
  }, []);

  const totalPending = useMemo(() => bids.reduce((sum, bid) => sum + Number(bid.amount || 0), 0), [bids]);
  const inProgressCount = bids.filter((bid) => String(bid.status || "").toLowerCase() === "in_progress").length;

  return (
    <ProviderLayout>
      <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending Jobs</h1>
          <p className="text-gray-600">Accepted work loaded from Supabase. Client contact opens only after paid acceptance.</p>
        </div>

        {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Accepted Jobs</p>
            <p className="text-2xl font-bold text-gray-900">{bids.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Provider Quotes</p>
            <p className="text-2xl font-bold text-green-600">{formatMoney(totalPending)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading accepted jobs...
          </div>
        ) : bids.length ? (
          <div className="space-y-4">
            {bids.map((bid) => (
              <article key={bid.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-400">
                    <UserCircle className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{jobTitle(bid.inquiry)}</h3>
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">{statusLabel(bid.status)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {bid.inquiry?.city || "Approximate area"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {bid.inquiry?.preferred_date ? new Date(bid.inquiry.preferred_date).toLocaleDateString() : "Flexible date"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
                        <DollarSign className="h-4 w-4" />
                        {formatMoney(Number(bid.amount || 0))} provider quote
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        Accepted offer
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                      {bid.inquiry?.id ? (
                        <Link href={`/pro/jobs/${bid.inquiry.id}`} className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
                          Open job
                        </Link>
                      ) : null}
                      <Link href="/pro/messages" className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-bold text-gray-700 hover:bg-gray-50">
                        Messages
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No accepted jobs yet</h3>
            <p className="text-gray-500">Accepted bids will appear here after a buyer pays to accept your offer.</p>
            <Link href="/pro/jobs" className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
              Browse jobs
            </Link>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}
