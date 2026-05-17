"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { DollarSign, Calendar, Download, ArrowUpRight, ReceiptText, WalletCards } from "lucide-react";
import { calculateBookingTokenBreakdown, formatMoney } from "@/lib/booking-token";

interface EarningsStat {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down";
}

interface Transaction {
  id: string;
  jobTitle: string;
  client: string;
  quote: number;
  date: string;
  status: "collected" | "scheduled" | "quoted";
}

const stats: EarningsStat[] = [
  { label: "Onsite Collections", value: "€720", change: 12.5, trend: "up" },
  { label: "Scheduled to Collect", value: "€195", change: 8.3, trend: "up" },
  { label: "Avg. Seller Quote", value: "€144", change: 15.7, trend: "up" },
  { label: "AnyJob Payouts", value: "€0", change: 0, trend: "up" },
];

const transactions: Transaction[] = [
  {
    id: "1",
    jobTitle: "Furniture Assembly",
    client: "Sarah Johnson",
    quote: 95,
    date: "2026-03-14",
    status: "collected",
  },
  {
    id: "2",
    jobTitle: "House Cleaning",
    client: "Michael Brown",
    quote: 120,
    date: "2026-03-12",
    status: "collected",
  },
  {
    id: "3",
    jobTitle: "Garden Maintenance",
    client: "David Thompson",
    quote: 75,
    date: "2026-03-10",
    status: "scheduled",
  },
  {
    id: "4",
    jobTitle: "Interior Painting",
    client: "Lisa Anderson",
    quote: 250,
    date: "2026-03-08",
    status: "collected",
  },
  {
    id: "5",
    jobTitle: "Moving Help",
    client: "Emma Wilson",
    quote: 180,
    date: "2026-03-05",
    status: "quoted",
  },
];

const statusColors = {
  collected: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  quoted: "bg-yellow-100 text-yellow-700",
};

const statusLabels = {
  collected: "Collected on site",
  scheduled: "Collect on site",
  quoted: "Quote sent",
};

export default function EarningsPage() {
  return (
    <ProviderLayout>
      <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Earnings</h1>
            <p className="text-gray-600">Track quotes and money you collect directly from clients</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  {stat.change === 0 ? "No payout" : `${Math.abs(stat.change)}%`}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Model */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-start gap-3">
              <WalletCards className="w-5 h-5 text-red-600 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">How you get paid</h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  AnyJob does not process your full job payment and does not send seller payouts. You collect your quoted amount from the client at the job location.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-6 border border-red-100">
            <div className="flex items-start gap-3">
              <ReceiptText className="w-5 h-5 text-red-600 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">AnyJob booking token</h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  When you quote, AnyJob adds a booking token of 20% of your quote, capped at €40, to the client&apos;s total. AnyJob keeps that token as its service fee.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Quote and Collection Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Quote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AnyJob Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.jobTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{transaction.client}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {transaction.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatMoney(calculateBookingTokenBreakdown(transaction.quote).onsiteDue)}
                      </div>
                      <div className="text-xs text-gray-500">Collect directly</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-red-600">
                        {formatMoney(calculateBookingTokenBreakdown(transaction.quote).bookingToken)}
                      </div>
                      <div className="text-xs text-gray-500">Kept by AnyJob</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatMoney(calculateBookingTokenBreakdown(transaction.quote).buyerTotal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusColors[transaction.status]
                        }`}
                      >
                        {statusLabels[transaction.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collection Info */}
        <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-gray-700 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">No AnyJob seller payout</h4>
              <p className="text-gray-600 mb-2">
                The booking token protects the trip and confirms the client. Your job payment is still collected by you directly at the location.
              </p>
              <p className="text-sm text-gray-500">
                Agree the final onsite payment method with the client before starting work.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
