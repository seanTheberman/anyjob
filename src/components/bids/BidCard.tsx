"use client";

import { useState } from "react";
import { Star, Clock, Calendar, CheckCircle, XCircle, MessageSquare, Loader2, User } from "lucide-react";
import { calculateBookingTokenBreakdown, formatMoney } from "@/lib/booking-token";

export interface BidProvider {
  id: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  rating: number;
  total_jobs: number;
  service_category?: string;
  experience_level?: string;
}

export interface Bid {
  id: string;
  inquiry_id: string;
  provider_id: string;
  amount: number;
  message?: string;
  estimated_duration_hours?: number;
  available_date?: string;
  status: string;
  created_at: string;
  provider?: BidProvider;
}

interface BidCardProps {
  bid: Bid;
  isClient: boolean;
  onAccept?: (bidId: string) => void;
  onReject?: (bidId: string) => void;
  onWithdraw?: (bidId: string) => void;
  onChat?: (bidId: string) => void;
}

export function BidCard({ bid, isClient, onAccept, onReject, onWithdraw, onChat }: BidCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const feeBreakdown = calculateBookingTokenBreakdown(Number(bid.amount));

  const handleAction = async (action: string, handler?: (id: string) => void) => {
    setLoading(action);
    setError(null);
    try {
      if (action === "accept") {
        const response = await fetch("/api/payments/bid-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bid_id: bid.id }),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.checkoutUrl) {
          setError(data?.error || "Could not start Stripe checkout.");
          return;
        }

        window.location.href = data.checkoutUrl;
        return;
      }

      const response = await fetch("/api/bids", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bid_id: bid.id, action }),
      });

      if (response.ok) {
        handler?.(bid.id);
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Could not update this bid.");
      }
    } catch (error) {
      console.error("Bid action error:", error);
    } finally {
      setLoading(null);
    }
  };

  const statusBadge = {
    pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    accepted: { color: "bg-green-100 text-green-800", label: "Accepted" },
    rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
    withdrawn: { color: "bg-gray-100 text-gray-800", label: "Withdrawn" },
    expired: { color: "bg-gray-100 text-gray-500", label: "Expired" },
  }[bid.status] || { color: "bg-gray-100 text-gray-800", label: bid.status };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:shadow-md transition-shadow">
      {/* Header: Provider Info + Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {bid.provider?.profile_image_url ? (
            <img
              src={bid.provider.profile_image_url}
              alt={`${bid.provider.first_name} ${bid.provider.last_name}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {bid.provider?.first_name} {bid.provider?.last_name}
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {bid.provider?.rating ? (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  {Number(bid.provider.rating).toFixed(1)}
                </span>
              ) : null}
              {bid.provider?.total_jobs ? (
                <span>• {bid.provider.total_jobs} jobs</span>
              ) : null}
              {bid.provider?.experience_level && (
                <span>• {bid.provider.experience_level}</span>
              )}
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Quote Amount */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
        {isClient ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Bid total</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMoney(feeBreakdown.buyerTotal)}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-500">
              Accepting the bid confirms this provider and unlocks chat and contact details.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Your job payout</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMoney(feeBreakdown.sellerQuote)}
              </span>
            </div>
            <div className="rounded-lg bg-white p-3 text-sm dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">AnyJob fee added to buyer</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(feeBreakdown.bookingToken)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Buyer sees total bid</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatMoney(feeBreakdown.buyerTotal)}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                AnyJob keeps this fee when the buyer accepts. The buyer only sees the total bid.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          {bid.estimated_duration_hours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {bid.estimated_duration_hours}h estimated
            </span>
          )}
          {bid.available_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(bid.available_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Message */}
      {bid.message && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            &ldquo;{bid.message}&rdquo;
          </p>
        </div>
      )}

      {/* Actions */}
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {bid.status === "pending" && (
        <div className="flex gap-2">
          {isClient ? (
            <>
              <button
                onClick={() => handleAction("accept", onAccept)}
                disabled={loading !== null}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading === "accept" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Accept & Pay Fee
              </button>
              <button
                onClick={() => handleAction("reject", onReject)}
                disabled={loading !== null}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Decline
              </button>
            </>
          ) : (
            <button
              onClick={() => handleAction("withdraw", onWithdraw)}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading === "withdraw" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Withdraw Bid
            </button>
          )}
        </div>
      )}

      {bid.status === "accepted" && (
        <button
          onClick={() => onChat?.(bid.id)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Open Chat
        </button>
      )}

      {/* Timestamp */}
      <p className="text-xs text-gray-400 mt-3">
        Bid placed {new Date(bid.created_at).toLocaleDateString()} at {new Date(bid.created_at).toLocaleTimeString()}
      </p>
    </div>
  );
}
