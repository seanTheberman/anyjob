"use client";

import { Star, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewDisplayProps {
  review: {
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
  };
  showReviewerInfo?: boolean;
}

export function ReviewDisplay({ review, showReviewerInfo = true }: ReviewDisplayProps) {
  const isBuyerReviewingSeller = review.review_type === "buyer_to_seller";
  const reviewTypeLabel = isBuyerReviewingSeller ? "Buyer Review" : "Provider Review";

  const renderStars = (rating: number, size = "normal") => {
    const starSize = size === "small" ? "w-3 h-3" : "w-4 h-4";
    
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300 fill-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 5: return "Excellent";
      case 4: return "Very Good";
      case 3: return "Good";
      case 2: return "Fair";
      case 1: return "Poor";
      default: return "";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {showReviewerInfo && (
              <Avatar className="w-10 h-10">
                <AvatarImage src={review.reviewer.profile_image_url} />
                <AvatarFallback>
                  {review.reviewer.first_name?.[0]}{review.reviewer.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {renderStars(review.rating)}
                <span className="text-sm font-medium text-gray-700">
                  {review.rating}.0
                </span>
              </div>
              {showReviewerInfo && (
                <p className="text-sm font-medium text-gray-900">
                  {review.reviewer.first_name} {review.reviewer.last_name}
                </p>
              )}
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {reviewTypeLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Review Title */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">{review.title}</h4>
            <p className="text-sm text-gray-600">{getRatingText(review.rating)}</p>
          </div>

          {/* Review Comment */}
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>

          {/* Detailed Ratings (for buyer reviewing seller) */}
          {isBuyerReviewingSeller && (
            <div className="border-t pt-3">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Detailed Ratings</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {review.communication_rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Communication:</span>
                    <div className="flex items-center gap-1">
                      {renderStars(review.communication_rating, "small")}
                      <span className="text-gray-700">{review.communication_rating}.0</span>
                    </div>
                  </div>
                )}
                
                {review.professionalism_rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Professionalism:</span>
                    <div className="flex items-center gap-1">
                      {renderStars(review.professionalism_rating, "small")}
                      <span className="text-gray-700">{review.professionalism_rating}.0</span>
                    </div>
                  </div>
                )}
                
                {review.quality_rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Quality:</span>
                    <div className="flex items-center gap-1">
                      {renderStars(review.quality_rating, "small")}
                      <span className="text-gray-700">{review.quality_rating}.0</span>
                    </div>
                  </div>
                )}
                
                {review.punctuality_rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Punctuality:</span>
                    <div className="flex items-center gap-1">
                      {renderStars(review.punctuality_rating, "small")}
                      <span className="text-gray-700">{review.punctuality_rating}.0</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="border-t pt-3">
            {isBuyerReviewingSeller && review.would_hire_again !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Would hire again:</span>
                <Badge variant={review.would_hire_again ? "default" : "secondary"}>
                  {review.would_hire_again ? "Yes" : "No"}
                </Badge>
              </div>
            )}
            
            {!isBuyerReviewingSeller && review.would_work_with_again !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Would work with again:</span>
                <Badge variant={review.would_work_with_again ? "default" : "secondary"}>
                  {review.would_work_with_again ? "Yes" : "No"}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
