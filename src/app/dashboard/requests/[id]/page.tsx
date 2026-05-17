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

const statusColors = {
  submitted: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  converted: "bg-green-100 text-green-800",
  bid_accepted: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels = {
  submitted: "Submitted",
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  converted: "Completed",
  bid_accepted: "Bid Accepted",
  cancelled: "Cancelled",
};

const statusIcons = {
  submitted: Clock3,
  pending: Clock3,
  confirmed: CheckCircle,
  in_progress: Clock3,
  completed: CheckCircle,
  converted: CheckCircle,
  bid_accepted: CheckCircle,
  cancelled: XCircle,
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
  };

  const subcategoryNames: { [key: string]: string } = {
    "nettoyage-vitres": "Window Cleaning",
    "nettoyage-regular": "Regular Cleaning",
    "nettoyage-profond": "Deep Cleaning",
    "repassage": "Ironing",
    "nettoyage-apres-construction": "End of Construction Cleaning",
  };

  const categoryName = categoryNames[categorySlug] || categorySlug;
  const subcategoryName = subcategoryNames[subcategorySlug] || subcategorySlug;
  
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

  const handleCancelRequest = async () => {
    if (!inquiry || !user) return;
    
    try {
      const { error } = await supabase
        .from("service_inquiries")
        .update({ status: "cancelled" })
        .eq("id", inquiry.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error cancelling request:", error);
      } else {
        setInquiry({ ...inquiry, status: "cancelled" });
      }
    } catch (error) {
      console.error("Error:", error);
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

  const StatusIcon = statusIcons[inquiry.status as keyof typeof statusIcons] || Clock3;
  const acceptedPrice = inquiry.actual_price ?? null;
  const acceptedBreakdown = acceptedPrice ? calculateBookingTokenBreakdown(Number(acceptedPrice)) : null;

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
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                statusColors[inquiry.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
              }`}>
                <StatusIcon className="w-4 h-4" />
                {statusLabels[inquiry.status as keyof typeof statusLabels] || inquiry.status}
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
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Booking token</span>
                      <span className="font-medium text-gray-900">{formatMoney(acceptedBreakdown.bookingToken, "£")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pay provider on site</span>
                      <span className="font-medium text-gray-900">{formatMoney(acceptedBreakdown.onsiteDue, "£")}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                      <span className="text-gray-900 font-medium">Total offer</span>
                      <span className="font-semibold text-green-600">{formatMoney(acceptedBreakdown.buyerTotal, "£")}</span>
                    </div>
                  </>
                )}
                {!inquiry.estimated_price && !inquiry.actual_price && (
                  <p className="text-gray-500 text-sm">Review provider offers to see the booking token and onsite balance.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {inquiry.status === "submitted" || inquiry.status === "pending" ? (
                <>
                  <button
                    onClick={handleCancelRequest}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancel Request
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    Contact Support
                  </button>
                </>
              ) : inquiry.status === "confirmed" || inquiry.status === "in_progress" ? (
                <>
                  <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    Message Provider
                  </button>
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
