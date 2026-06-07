"use client";

import { useEffect, useState } from "react";
import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Calendar, Download, Loader2, ReceiptText, WalletCards } from "lucide-react";
import { formatMoney } from "@/lib/booking-token";

type WalletEntry = {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "available" | "paid_out" | "cancelled";
  description?: string | null;
  created_at?: string | null;
  available_at?: string | null;
};

type WalletTotals = {
  pending: number;
  available: number;
  paidOut: number;
};

const statusLabels = {
  pending: "To be credited",
  available: "Available",
  paid_out: "Paid out",
  cancelled: "Cancelled",
};

const statusColors = {
  pending: "bg-amber-100 text-amber-800",
  available: "bg-emerald-100 text-emerald-800",
  paid_out: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-700",
};

export default function EarningsPage() {
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [totals, setTotals] = useState<WalletTotals>({ pending: 0, available: 0, paidOut: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWallet() {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/provider/wallet");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Unable to load wallet");
      } else {
        setEntries(payload.entries || []);
        setTotals(payload.totals || { pending: 0, available: 0, paidOut: 0 });
      }
      setLoading(false);
    }
    loadWallet();
  }, []);

  function exportWallet() {
    const header = ["Description", "Amount", "Currency", "Status", "Created", "Available"];
    const rows = entries.map((entry) => [
      entry.description || "Wallet entry",
      entry.amount,
      entry.currency,
      entry.status,
      entry.created_at || "",
      entry.available_at || "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "anyjob-provider-wallet.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ProviderLayout>
      <div className="mx-auto mt-4 max-w-6xl lg:mt-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Earnings</h1>
            <p className="text-gray-600">Track shift payments held by AnyJob and wallet credits after completed work.</p>
          </div>
          <button type="button" onClick={exportWallet} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 transition-colors hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {error ? <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-1 text-sm text-gray-500">To be credited</p>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(totals.pending)}</p>
            <p className="mt-2 text-xs text-gray-500">Business paid AnyJob; release waits for completed work.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-1 text-sm text-gray-500">Available wallet</p>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(totals.available)}</p>
            <p className="mt-2 text-xs text-gray-500">Credited after business confirms the shift was completed.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-1 text-sm text-gray-500">Paid out</p>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(totals.paidOut)}</p>
            <p className="mt-2 text-xs text-gray-500">Transferred from wallet to provider payout method.</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <WalletCards className="mt-1 h-5 w-5 text-red-600" />
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Shift-work wallet</h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  For business shifts, the business pays the agreed full amount to AnyJob first. The amount appears as to be credited until the work is confirmed.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <ReceiptText className="mt-1 h-5 w-5 text-red-600" />
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Release after completion</h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  Once the business marks the shift complete, AnyJob releases the held amount into your available wallet balance.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900">Wallet ledger</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center p-10 text-gray-600">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading wallet...
            </div>
          ) : entries.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{entry.description || "Wallet entry"}</div>
                        {entry.available_at ? <div className="text-xs text-gray-500">Available {new Date(entry.available_at).toLocaleString()}</div> : null}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : "-"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{formatMoney(entry.amount)}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[entry.status]}`}>{statusLabels[entry.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <WalletCards className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <h2 className="font-semibold text-gray-950">No wallet entries yet</h2>
              <p className="mt-1 text-sm text-gray-500">Accepted business shifts will appear here after the business pays AnyJob.</p>
            </div>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}
