"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Calendar, Clock, MapPin, ArrowLeft, User as UserIcon, MessageSquare, CheckCircle, XCircle, Clock3, Star, Gavel, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { ReviewForm, ReviewData } from "@/components/reviews/ReviewForm";
import { ReviewDisplay } from "@/components/reviews/ReviewDisplay";
import { BidCard, type Bid } from "@/components/bids/BidCard";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { calculateBookingTokenBreakdown, formatMoney } from "@/lib/booking-token";
import { getJobStatusColor, getJobStatusLabel, jobStatusIcons } from "@/lib/job-status";

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
  user_id: string;
  provider_id?: string;
  estimated_price?: number;
  actual_price?: number;
  notes?: string;
  provider_name?: string;
  buyer_name?: string;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  communication_rating?: number;
  professionalism_rating?: number;
  quality_rating?: number;
  punctuality_rating?: number;
  would_hire_again?: boolean;
  would_work_with_again?: boolean;
  created_at: string;
  reviewer: {
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
  review_type: "buyer_to_seller" | "seller_to_buyer";
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

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [inquiry, setInquiry] = useState<ServiceInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewFormType, setReviewFormType] = useState<"buyer_to_seller" | "seller_to_buyer">("buyer_to_seller");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user && params.id) {
          // Fetch the specific inquiry
          const { data: inquiryData, error } = await supabase
            .from("service_inquiries")
            .select("*")
            .eq("id", params.id)
            .eq("user_id", user.id)
            .single();

          if (error) {
            console.error("Error fetching inquiry:", error);
            setError("Request not found or you don't have permission to view it");
          } else if (inquiryData) {
            setInquiry(inquiryData);
            
            // Fetch reviews for this inquiry
            const reviewsResponse = await fetch(`/api/reviews?service_inquiry_id=${params.id}`);
            if (reviewsResponse.ok) {
              const reviewsData = await reviewsResponse.json();
              setReviews(reviewsData.reviews || []);
            }

            // Fetch bids for this inquiry
            const bidsResponse = await fetch(`/api/bids?inquiry_id=${params.id}`);
            if (bidsResponse.ok) {
              const bidsData = await bidsResponse.json();
              setBids(bidsData.bids || []);
            }
          }
        }
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to load request details");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestData();
  }, [supabase, params.id]);

  const updateRequestStatus = async (status: "cancelled" | "in_progress" | "completed") => {
    if (!inquiry || !user) return;

    setUpdatingStatus(status);
    try {
      const { error } = await supabase
        .from("service_inquiries")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", inquiry.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating request status:", error);
        alert(error.message || "Could not update request status");
      } else {
        setInquiry({ ...inquiry, status });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Could not update request status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleReviewSubmit = async (reviewData: ReviewData) => {
    if (!inquiry || !user) return;

    setSubmittingReview(true);
    
    try {
      // Determine reviewee based on review type and user role
      const isBuyer = inquiry.user_id === user.id;
      let revieweeId: string;
      
      if (reviewFormType === "buyer_to_seller" && isBuyer) {
        revieweeId = inquiry.provider_id!;
      } else if (reviewFormType === "seller_to_buyer" && !isBuyer) {
        revieweeId = inquiry.user_id;
      } else {
        throw new Error("Invalid review type for this user");
      }

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_inquiry_id: inquiry.id,
          reviewee_id: revieweeId,
          review_type: reviewFormType,
          ...reviewData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Add the new review to the list
        const newReview: Review = {
          ...result.review,
          reviewer: {
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            profile_image_url: user.user_metadata?.profile_image_url,
          },
        };
        setReviews([...reviews, newReview]);
        setShowReviewForm(false);
      } else {
        const error = await response.json();
        console.error("Error submitting review:", error);
        alert(error.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const canReview = inquiry && (inquiry.status === "completed" || inquiry.status === "converted") && user;
  const isBuyer = inquiry && user && inquiry.user_id === user.id;
  const hasBuyerReviewed = reviews.some(r => r.review_type === "buyer_to_seller" && r.reviewer.first_name === user?.user_metadata?.first_name);
  const hasSellerReviewed = reviews.some(r => r.review_type === "seller_to_buyer" && r.reviewer.first_name === user?.user_metadata?.first_name);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-6 w-32"></div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
              <div className="h-4 bg-gray-300 rounded mb-2 w-full"></div>
              <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !inquiry) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Not Found</h2>
          <p className="text-gray-500 mb-6">{error || "This request doesn't exist or you don't have permission to view it"}</p>
          <Link
            href="/dashboard/requests"
            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const StatusIcon = jobStatusIcons[inquiry.status as keyof typeof jobStatusIcons] || Clock3;
  const acceptedBid = bids.find((bid) => bid.status === "accepted") || null;
  const acceptedBreakdown = acceptedBid ? calculateBookingTokenBreakdown(Number(acceptedBid.amount)) : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/requests"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {getServiceName(inquiry.category_slug, inquiry.subcategory_slug)}
            </h1>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getJobStatusColor(inquiry.status)}`}>
                <StatusIcon className="w-4 h-4" />
                {getJobStatusLabel(inquiry.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
              <p className="text-gray-700 leading-relaxed">{inquiry.job_description}</p>
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service Type</p>
                  <p className="font-medium text-gray-900 capitalize">{inquiry.service_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="font-medium text-gray-900">{getServiceName(inquiry.category_slug, inquiry.subcategory_slug)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Request ID</p>
                  <p className="font-medium text-gray-900 text-sm">{inquiry.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Submitted</p>
                  <p className="font-medium text-gray-900">{new Date(inquiry.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Location</h2>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{inquiry.address}</p>
                  <p className="text-gray-600">{inquiry.city}, {inquiry.postal_code}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {inquiry.notes && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
                <p className="text-gray-700">{inquiry.notes}</p>
              </div>
            )}

            {/* Work Images */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Work Images</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">Add photos of the work you need done so providers can give better quotes</p>
              <ImageUploader
                imageType="work_image"
                inquiryId={inquiry.id}
                maxImages={8}
                compact
              />
            </div>

            {/* Bids Section */}
            {bids.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Gavel className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Bids ({bids.length})</h2>
                </div>
                <div className="space-y-4">
                  {bids.map((bid) => (
                    <BidCard
                      key={bid.id}
                      bid={bid}
                      isClient={true}
                      onAccept={() => {
                        setBids(bids.map(b => b.id === bid.id ? { ...b, status: "accepted" } : b.status === "pending" ? { ...b, status: "rejected" } : b));
                        setInquiry({ ...inquiry, status: "bid_accepted" });
                      }}
                      onReject={() => {
                        setBids(bids.map(b => b.id === bid.id ? { ...b, status: "rejected" } : b));
                      }}
                      onChat={() => {
                        router.push("/dashboard/mail");
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Schedule */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
              <div className="space-y-3">
                {inquiry.preferred_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{new Date(inquiry.preferred_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {inquiry.preferred_time_start && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium text-gray-900">{inquiry.preferred_time_start} - {inquiry.preferred_time_end || "TBD"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
              <div className="space-y-3">
                {inquiry.estimated_price && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Estimated Provider Price</span>
                    <span className="font-medium text-gray-900">£{inquiry.estimated_price}</span>
                  </div>
                )}
                {acceptedBreakdown && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">Accepted bid total</span>
                    <span className="font-semibold text-green-600">{formatMoney(acceptedBreakdown.buyerTotal)}</span>
                  </div>
                )}
                {!acceptedBreakdown && !inquiry.estimated_price && !inquiry.actual_price && (
                  <p className="text-gray-500 text-sm">Review provider offers to see the total bid amount.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {inquiry.status === "submitted" || inquiry.status === "pending" ? (
                <>
                  <button
                    disabled={updatingStatus === "cancelled"}
                    onClick={() => updateRequestStatus("cancelled")}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    {updatingStatus === "cancelled" ? "Cancelling..." : "Cancel Request"}
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    Contact Support
                  </button>
                </>
              ) : inquiry.status === "confirmed" || inquiry.status === "in_progress" || inquiry.status === "bid_accepted" ? (
                <>
                  <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    Message Provider
                  </button>
                  {inquiry.status === "bid_accepted" || inquiry.status === "confirmed" ? (
                    <button
                      type="button"
                      disabled={updatingStatus === "in_progress"}
                      onClick={() => updateRequestStatus("in_progress")}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
                    >
                      <Clock3 className="w-5 h-5" />
                      {updatingStatus === "in_progress" ? "Starting..." : "Mark In Progress"}
                    </button>
                  ) : null}
                  {inquiry.status === "in_progress" ? (
                    <button
                      type="button"
                      disabled={updatingStatus === "completed"}
                      onClick={() => updateRequestStatus("completed")}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {updatingStatus === "completed" ? "Completing..." : "Mark Completed"}
                    </button>
                  ) : null}
                  <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                    <UserIcon className="w-5 h-5" />
                    View Provider Profile
                  </button>
                </>
              ) : (inquiry.status === "completed" || inquiry.status === "converted") ? (
                <>
                  {canReview && isBuyer && !hasBuyerReviewed && (
                    <button
                      onClick={() => {
                        setReviewFormType("buyer_to_seller");
                        setShowReviewForm(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
                    >
                      <Star className="w-5 h-5" />
                      Review Provider
                    </button>
                  )}
                  {canReview && !isBuyer && !hasSellerReviewed && (
                    <button
                      onClick={() => {
                        setReviewFormType("seller_to_buyer");
                        setShowReviewForm(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
                    >
                      <Star className="w-5 h-5" />
                      Review Client
                    </button>
                  )}
                  <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                    <Calendar className="w-5 h-5" />
                    Book Again
                  </button>
                </>
              ) : (
                <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                  <Calendar className="w-5 h-5" />
                  Create New Request
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewDisplay key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}

        {/* Review Form Modal */}
        {showReviewForm && (
          <ReviewForm
            isOpen={showReviewForm}
            onClose={() => setShowReviewForm(false)}
            onSubmit={handleReviewSubmit}
            revieweeName={isBuyer ? "Provider" : "Client"}
            reviewType={reviewFormType}
            loading={submittingReview}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
