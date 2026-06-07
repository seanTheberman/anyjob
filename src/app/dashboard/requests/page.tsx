"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Calendar, Clock, MapPin, Circle, Gavel, ImageIcon, Plus, Search, WalletCards } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getJobStatusColor, getJobStatusLabel } from "@/lib/job-status";
import { formatMoney } from "@/lib/booking-token";

interface ServiceInquiry {
  id: string;
  category_slug: string;
  subcategory_slug: string;
  service_type: string;
  job_description: string;
  preferred_date: string;
  preferred_time_start: string;
  preferred_time_end: string;
  address: string;
  city: string;
  postal_code: string;
  budget_range_min?: number;
  budget_range_max?: number;
  status: string;
  created_at: string;
  quotes?: {
    total: number;
    pending: number;
    accepted: boolean;
    lowestTotal: number | null;
    acceptedTotal: number | null;
  };
  workImages?: Array<{
    id: string;
    image_url: string;
    title?: string | null;
  }>;
}

// Helper function to get service name from slugs
const getServiceName = (categorySlug: string, subcategorySlug: string) => {
  const categoryNames: { [key: string]: string } = {
    menage: "Cleaning",
    bricolage: "Handyman",
    jardinage: "Gardening",
    demenagement: "Moving",
    enfants: "Childcare",
    animaux: "Pet Care",
    informatique: "IT Support",
    "aide-domicile": "Home Help",
    "cours-particuliers": "Private Tutoring",
    custom: "Custom job request",
  };

  const subcategoryNames: { [key: string]: string } = {
    "nettoyage-vitres": "Window Cleaning",
    "nettoyage-regular": "Regular Cleaning",
    "nettoyage-profond": "Deep Cleaning",
    "repassage": "Ironing",
    "nettoyage-apres-construction": "End of Construction Cleaning",
    "custom-job": "Flexible request",
  };

  if (categorySlug === "custom") {
    return categoryNames.custom;
  }

  const categoryName = categoryNames[categorySlug] || categorySlug;
  const subcategoryName = subcategorySlug.startsWith("other-") ? "Other" : subcategoryNames[subcategorySlug] || subcategorySlug;
  
  return `${categoryName} - ${subcategoryName}`;
};

export default function MyRequestsPage() {
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const response = await fetch("/api/dashboard/request-summaries");

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            console.error("Error fetching inquiries:", payload.error || response.statusText);
          } else {
            const payload = await response.json();
            setInquiries(payload.requests || []);
            setSelectedId((current) => current || payload.requests?.[0]?.id || null);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [supabase]);

  const stats = {
    total: inquiries.length,
    pendingReview: inquiries.filter(i => ["pending_for_review", "pending", "draft"].includes(String(i.status || "").toLowerCase())).length,
    approved: inquiries.filter(i => ["approved", "submitted"].includes(String(i.status || "").toLowerCase())).length,
    completed: inquiries.filter(i => i.status === "completed").length,
    spent: inquiries.reduce((sum, inquiry) => sum + (inquiry.quotes?.acceptedTotal || 0), 0),
  };
  const selectedInquiry = inquiries.find((inquiry) => inquiry.id === selectedId) || inquiries[0] || null;

  const budgetLabel = (inquiry: ServiceInquiry) => {
    if (inquiry.quotes?.acceptedTotal) return formatMoney(inquiry.quotes.acceptedTotal);
    if (inquiry.quotes?.lowestTotal) return `from ${formatMoney(inquiry.quotes.lowestTotal)}`;
    if (inquiry.budget_range_min || inquiry.budget_range_max) {
      return `${formatMoney(Number(inquiry.budget_range_min || 0))} - ${formatMoney(Number(inquiry.budget_range_max || 0))}`;
    }
    return "Awaiting offers";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-6 w-48"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="h-4 bg-gray-300 rounded mb-2 w-16"></div>
                  <div className="h-6 bg-gray-300 rounded w-8"></div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Request board</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">My requests</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Track each job, compare offers, and keep images, timing, and quote status in one place.</p>
          </div>
          <Link href="/questionnaire" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Post a request
          </Link>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-5">
          {[
            ["Total", stats.total, "text-slate-950"],
            ["Pending review", stats.pendingReview, "text-yellow-700"],
            ["Approved", stats.approved, "text-emerald-700"],
            ["Completed", stats.completed, "text-emerald-700"],
            ["Accepted spend", formatMoney(stats.spent), "text-blue-700"],
          ].map(([label, value, tone]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className={`text-2xl font-black ${tone}`}>{value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[430px_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" placeholder="Search your requests" />
            </div>
            {inquiries.map((inquiry) => {
              const active = selectedInquiry?.id === inquiry.id;
              return (
                <button
                  key={inquiry.id}
                  type="button"
                  onClick={() => setSelectedId(inquiry.id)}
                  className={`w-full rounded-lg border p-4 text-left transition ${active ? "border-blue-200 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-100 hover:bg-slate-50"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-lg font-bold leading-6 text-blue-950">{getServiceName(inquiry.category_slug, inquiry.subcategory_slug)}</h3>
                      <div className="mt-2 space-y-1 text-sm font-medium text-slate-500">
                        <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{inquiry.city || "Location not set"}</p>
                        <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{inquiry.preferred_date ? new Date(inquiry.preferred_date).toLocaleDateString() : "Flexible date"}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-lg font-black text-blue-950">{budgetLabel(inquiry)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getJobStatusColor(inquiry.status)}`}>{getJobStatusLabel(inquiry.status)}</span>
                    <span className="font-bold text-blue-600">{inquiry.quotes?.total || 0} offer{(inquiry.quotes?.total || 0) === 1 ? "" : "s"}</span>
                    {(inquiry.workImages?.length || 0) > 0 ? <span className="text-slate-500">{inquiry.workImages?.length} photo{inquiry.workImages?.length === 1 ? "" : "s"}</span> : null}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedInquiry ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getJobStatusColor(selectedInquiry.status)}`}>{getJobStatusLabel(selectedInquiry.status)}</span>
                    <span className="text-sm font-semibold text-slate-500">Posted {new Date(selectedInquiry.created_at).toLocaleDateString()}</span>
                  </div>
                  <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-blue-950">{getServiceName(selectedInquiry.category_slug, selectedInquiry.subcategory_slug)}</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="flex gap-3">
                      <MapPin className="mt-1 h-5 w-5 text-blue-900" />
                      <div><p className="text-xs font-bold uppercase text-slate-500">Location</p><p className="font-semibold text-slate-800">{selectedInquiry.address || selectedInquiry.city}</p></div>
                    </div>
                    <div className="flex gap-3">
                      <Calendar className="mt-1 h-5 w-5 text-blue-900" />
                      <div><p className="text-xs font-bold uppercase text-slate-500">To be done</p><p className="font-semibold text-slate-800">{selectedInquiry.preferred_date ? new Date(selectedInquiry.preferred_date).toLocaleDateString() : "Flexible"}</p></div>
                    </div>
                    <div className="flex gap-3">
                      <Clock className="mt-1 h-5 w-5 text-blue-900" />
                      <div><p className="text-xs font-bold uppercase text-slate-500">Time</p><p className="font-semibold text-slate-800">{selectedInquiry.preferred_time_start || "Anytime"}</p></div>
                    </div>
                  </div>
                  <h3 className="mt-8 text-xl font-black text-blue-950">Details</h3>
                  <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{selectedInquiry.job_description || "No description added yet."}</p>
                  {(selectedInquiry.workImages?.length || 0) > 0 && (
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {selectedInquiry.workImages?.slice(0, 6).map((image) => (
                        <img key={image.id} src={image.image_url} alt={image.title || "Job image"} className="aspect-square rounded-lg border border-slate-200 object-cover" />
                      ))}
                    </div>
                  )}
                </div>
                <aside className="space-y-4">
                  <div className="rounded-lg bg-slate-100 p-6 text-center">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Current best total</p>
                    <p className="mt-2 text-4xl font-black text-blue-950">{budgetLabel(selectedInquiry)}</p>
                    <Link href={`/dashboard/requests/${selectedInquiry.id}`} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
                      Open full request
                    </Link>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-5">
                    <p className="text-sm font-black text-blue-950">Offers</p>
                    <div className="mt-3 flex items-center gap-3">
                      <Gavel className="h-5 w-5 text-blue-600" />
                      <p className="font-semibold text-slate-700">{selectedInquiry.quotes?.total || 0} provider offer{(selectedInquiry.quotes?.total || 0) === 1 ? "" : "s"}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <WalletCards className="h-5 w-5 text-emerald-600" />
                      <p className="font-semibold text-slate-700">{selectedInquiry.quotes?.accepted ? "Accepted provider selected" : "No accepted offer yet"}</p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          ) : null}
        </div>

        {/* Empty State */}
        {inquiries.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Circle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
            <p className="text-gray-500 mb-4">
              Book your first service and it will appear here
            </p>
            <Link
              href="/questionnaire"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              Request a service
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
