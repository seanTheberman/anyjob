"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Calendar, Clock, MapPin, Star, ChevronRight, Circle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

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
  status: string;
  created_at: string;
}

const statusColors = {
  submitted: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels = {
  submitted: "Submitted",
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

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
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Fetch user's service inquiries
          const { data: inquiriesData, error } = await supabase
            .from("service_inquiries")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error fetching inquiries:", error);
          } else {
            setInquiries(inquiriesData || []);
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
    pending: inquiries.filter(i => i.status === "submitted" || i.status === "pending").length,
    completed: inquiries.filter(i => i.status === "completed").length,
    spent: 0, // TODO: Calculate from actual pricing when available
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Requests</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Spent</p>
            <p className="text-2xl font-bold text-blue-600">£{stats.spent}</p>
          </div>
        </div>

        {/* Inquiries List */}
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Link
              key={inquiry.id}
              href={`/dashboard/requests/${inquiry.id}`}
              className="block bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left - Service Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {getServiceName(inquiry.category_slug, inquiry.subcategory_slug)}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[inquiry.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[inquiry.status as keyof typeof statusLabels] || inquiry.status}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{inquiry.job_description}</p>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {inquiry.preferred_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(inquiry.preferred_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {inquiry.preferred_time_start && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{inquiry.preferred_time_start} - {inquiry.preferred_time_end || "TBD"}</span>
                      </div>
                    )}
                    {inquiry.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{inquiry.address}, {inquiry.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right - Arrow */}
                <div className="flex items-center">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
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
