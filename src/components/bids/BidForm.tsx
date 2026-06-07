"use client";

import { useState } from "react";
import { DollarSign, Clock, Calendar, Send, X, Loader2 } from "lucide-react";
import { calculateBookingTokenBreakdown, formatMoney } from "@/lib/booking-token";

interface BidFormProps {
  inquiryId: string;
  budgetMin?: number;
  budgetMax?: number;
  onSubmit?: (bid: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export function BidForm({ inquiryId, budgetMin, budgetMax, onSubmit, onCancel }: BidFormProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [availableDate, setAvailableDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountValue = parseFloat(amount);
  const hasAmount = Number.isFinite(amountValue) && amountValue > 0;
  const feeBreakdown = calculateBookingTokenBreakdown(hasAmount ? amountValue : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          amount: parseFloat(amount),
          message: message || null,
          estimated_duration_hours: estimatedHours ? parseFloat(estimatedHours) : null,
          available_date: availableDate || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit bid");
      }

      const { bid } = await response.json();
      onSubmit?.(bid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit bid");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Place Your Bid</h3>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {budgetMin !== undefined && budgetMax !== undefined && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Client budget: <span className="font-semibold">€{budgetMin} - €{budgetMax}</span>
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Your Quote (€) *
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 150"
            min="1"
            step="0.01"
            required
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        {hasAmount && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Your job payout</span>
              <span className="font-semibold text-gray-900">{formatMoney(feeBreakdown.onsiteDue)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-600">AnyJob fee added to buyer</span>
              <span className="font-semibold text-gray-900">{formatMoney(feeBreakdown.bookingToken)}</span>
            </div>
            <div className="mt-3 border-t border-red-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Buyer sees total bid</span>
                <span className="text-lg font-bold text-gray-900">{formatMoney(feeBreakdown.buyerTotal)}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                The buyer is shown one total bid. AnyJob collects the fee when the buyer accepts; you collect your job payout at the location.
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Clock className="w-4 h-4 inline mr-1" />
            Estimated Duration (hours)
          </label>
          <input
            type="number"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="e.g. 3"
            min="0.5"
            step="0.5"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Available Date
          </label>
          <input
            type="date"
            value={availableDate}
            onChange={(e) => setAvailableDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message to Client
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your approach, experience, and why you're the best fit for this job..."
            rows={4}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !hasAmount}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Bid
            </>
          )}
        </button>
      </form>
    </div>
  );
}
