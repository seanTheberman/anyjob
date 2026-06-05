"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Building2, Clock, FileText, Loader2, Plus, ShieldCheck, Users } from "lucide-react";

type BusinessProfile = {
  id: string;
  business_name: string;
  registration_number: string;
  status: string;
  industry: string;
  document_url: string;
  rejection_reason?: string | null;
};

type BusinessPost = {
  id: string;
  work_type: string;
  role_title: string;
  niche: string;
  city: string;
  status: string;
  created_at: string;
};

function StatusPill({ value }: { value: string }) {
  const lower = value.toLowerCase();
  const classes = lower === "approved"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : lower === "rejected" || lower === "suspended"
      ? "bg-red-50 text-red-700 ring-red-100"
      : "bg-amber-50 text-amber-700 ring-amber-100";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classes}`}>{value}</span>;
}

export default function BusinessDashboardPage() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [posts, setPosts] = useState<BusinessPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [businessResponse, postsResponse] = await Promise.all([
        fetch("/api/business/register"),
        fetch("/api/business/posts"),
      ]);
      if (businessResponse.ok) {
        const payload = await businessResponse.json();
        setBusiness(payload.business || null);
      }
      if (postsResponse.ok) {
        const payload = await postsResponse.json();
        setPosts(payload.posts || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-950">Business</h1>
            <p className="text-sm text-gray-600">Register, get approved, then post freelance, day-wage, and shift work.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading business workspace...
          </div>
        ) : !business ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-red-600" />
            <h2 className="text-xl font-bold text-gray-950">Business registration required</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
              Businesses must submit a registration number and document before admin can approve job posting.
            </p>
            <Link href="/register-business" className="mt-6 inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              Start business registration
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-950">{business.business_name}</h2>
                    <StatusPill value={business.status} />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Registration number: {business.registration_number}</p>
                  <p className="text-sm text-gray-600">Industry: {business.industry}</p>
                  {business.rejection_reason ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{business.rejection_reason}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/dashboard/business/jobs/new"
                    className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold ${
                      business.status === "approved"
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "cursor-not-allowed bg-gray-100 text-gray-400"
                    }`}
                    aria-disabled={business.status !== "approved"}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Post work
                  </Link>
                  <Link
                    href="/dashboard/business/workers"
                    className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold ${
                      business.status === "approved"
                        ? "border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "cursor-not-allowed border-gray-100 text-gray-400"
                    }`}
                    aria-disabled={business.status !== "approved"}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Browse workers
                  </Link>
                </div>
              </div>

              {business.status !== "approved" ? (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Posting is locked until admin approval.</p>
                    <p className="mt-1 text-amber-800">Admin must approve the business registration number and document before any business job or shift can be uploaded.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Business approved.</p>
                    <p className="mt-1 text-emerald-800">You can post freelance business jobs, part-time day-wage work, and long-duration shift work.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <h2 className="font-semibold text-gray-950">Business posts</h2>
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              {posts.length ? (
                <div className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <div key={post.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-950">{post.role_title}</p>
                        <p className="text-sm text-gray-600">{post.work_type.replaceAll("_", " ")} · {post.niche} · {post.city}</p>
                      </div>
                      <StatusPill value={post.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-gray-500">No business posts yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
