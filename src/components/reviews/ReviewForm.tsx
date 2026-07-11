"use client";

import { useState } from "react";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: ReviewData) => void;
  revieweeName: string;
  reviewType: "buyer_to_seller" | "seller_to_buyer";
  loading?: boolean;
}

export interface ReviewData {
  rating: number;
  title: string;
  comment: string;
  communication_rating?: number;
  professionalism_rating?: number;
  quality_rating?: number;
  punctuality_rating?: number;
  would_hire_again?: boolean;
  would_work_with_again?: boolean;
}

function StarRating({
  value,
  onChange,
  hoveredRating,
  setHoveredRating,
  size = "normal",
}: {
  value: number;
  onChange: (rating: number) => void;
  hoveredRating: number;
  setHoveredRating: (rating: number) => void;
  size?: "small" | "normal";
}) {
  const starSize = size === "small" ? "w-4 h-4" : "w-6 h-6";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Set rating to ${star} star${star === 1 ? "" : "s"}`}
          title={`${star} star${star === 1 ? "" : "s"}`}
          className={`${starSize} transition-colors ${
            star <= (hoveredRating || value)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 fill-gray-300"
          }`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(0)}
        >
          <Star className={starSize} />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  revieweeName, 
  reviewType, 
  loading = false 
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [communicationRating, setCommunicationRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [wouldHireAgain, setWouldHireAgain] = useState(false);
  const [wouldWorkWithAgain, setWouldWorkWithAgain] = useState(false);

  const isBuyerReviewingSeller = reviewType === "buyer_to_seller";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0 || !title.trim() || !comment.trim()) {
      return;
    }

    const reviewData: ReviewData = {
      rating,
      title: title.trim(),
      comment: comment.trim(),
      ...(isBuyerReviewingSeller && {
        communication_rating: communicationRating || undefined,
        professionalism_rating: professionalismRating || undefined,
        quality_rating: qualityRating || undefined,
        punctuality_rating: punctualityRating || undefined,
        would_hire_again: wouldHireAgain,
      }),
      ...(!isBuyerReviewingSeller && {
        would_work_with_again: wouldWorkWithAgain,
      }),
    };

    onSubmit(reviewData);
  };

  const resetForm = () => {
    setRating(0);
    setTitle("");
    setComment("");
    setCommunicationRating(0);
    setProfessionalismRating(0);
    setQualityRating(0);
    setPunctualityRating(0);
    setWouldHireAgain(false);
    setWouldWorkWithAgain(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Review {revieweeName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              Overall Rating *
            </Label>
            <StarRating
              value={rating}
              onChange={setRating}
              hoveredRating={hoveredRating}
              setHoveredRating={setHoveredRating}
            />
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 5 && "Excellent"}
                {rating === 4 && "Very Good"}
                {rating === 3 && "Good"}
                {rating === 2 && "Fair"}
                {rating === 1 && "Poor"}
              </p>
            )}
          </div>

          {/* Review Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Review Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={200}
              required
            />
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Review Details *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share more details about your experience"
              rows={4}
              required
            />
          </div>

          {/* Detailed Ratings (for buyer reviewing seller) */}
          {isBuyerReviewingSeller && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detailed Ratings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Communication</Label>
                  <StarRating 
                    value={communicationRating} 
                    onChange={setCommunicationRating} 
                    hoveredRating={hoveredRating}
                    setHoveredRating={setHoveredRating}
                    size="small" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Professionalism</Label>
                  <StarRating 
                    value={professionalismRating} 
                    onChange={setProfessionalismRating} 
                    hoveredRating={hoveredRating}
                    setHoveredRating={setHoveredRating}
                    size="small" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quality of Work</Label>
                  <StarRating 
                    value={qualityRating} 
                    onChange={setQualityRating} 
                    hoveredRating={hoveredRating}
                    setHoveredRating={setHoveredRating}
                    size="small" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Punctuality</Label>
                  <StarRating 
                    value={punctualityRating} 
                    onChange={setPunctualityRating} 
                    hoveredRating={hoveredRating}
                    setHoveredRating={setHoveredRating}
                    size="small" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBuyerReviewingSeller ? wouldHireAgain : wouldWorkWithAgain}
                onChange={(e) => 
                  isBuyerReviewingSeller 
                    ? setWouldHireAgain(e.target.checked)
                    : setWouldWorkWithAgain(e.target.checked)
                }
                className="rounded border-gray-300"
              />
              {isBuyerReviewingSeller 
                ? "I would hire this provider again" 
                : "I would work with this client again"
              }
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || rating === 0 || !title.trim() || !comment.trim()}
              className="flex-1"
            >
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
