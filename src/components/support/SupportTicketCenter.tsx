"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, MessageSquare, Plus, Send } from "lucide-react";

import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_REQUESTER_TYPES,
  formatTicketNumber,
  supportLabel,
  type SupportRequesterType,
  type SupportTicket,
} from "@/lib/support/tickets";

type SupportTicketCenterProps = {
  defaultRequesterType?: SupportRequesterType;
  requesterOptions?: SupportRequesterType[];
  heading?: string;
  description?: string;
  compact?: boolean;
  initialShowForm?: boolean;
};

const statusTone: Record<string, string> = {
  open: "border-red-200 bg-red-50 text-red-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  waiting_user: "border-blue-200 bg-blue-50 text-blue-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  closed: "border-slate-200 bg-slate-50 text-slate-700",
};

export function SupportTicketCenter({
  defaultRequesterType = "user",
  requesterOptions = SUPPORT_REQUESTER_TYPES.slice(),
  heading = "Support tickets",
  description = "Raise an issue and track replies from AnyJob support.",
  compact = false,
  initialShowForm = false,
}: SupportTicketCenterProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    requesterType: defaultRequesterType,
    category: "account",
    priority: "normal",
    title: "",
    description: "",
    relatedJobId: "",
  });

  const sortedTickets = useMemo(
    () => [...tickets].sort((left, right) => right.priorityScore - left.priorityScore || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [tickets]
  );

  useEffect(() => {
    let alive = true;
    async function loadTickets() {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/support/tickets").catch(() => null);
      if (!alive) return;
      if (!response?.ok) {
        const body = await response?.json().catch(() => ({}));
        setError(body?.error || "Could not load support tickets.");
        setLoading(false);
        return;
      }
      const body = await response.json().catch(() => ({}));
      setTickets(Array.isArray(body.tickets) ? body.tickets : []);
      setLoading(false);
    }

    loadTickets();
    return () => {
      alive = false;
    };
  }, []);

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
    setSuccess(null);
  }

  async function submitTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Add a title and details before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sourcePath: typeof window !== "undefined" ? window.location.pathname : "",
      }),
    }).catch(() => null);

    const body = await response?.json().catch(() => ({}));
    setSubmitting(false);

    if (!response?.ok) {
      setError(body?.error || "Support ticket could not be submitted.");
      return;
    }

    if (body.ticket) {
      setTickets((current) => [body.ticket, ...current]);
    }
    setForm((current) => ({ ...current, title: "", description: "", relatedJobId: "" }));
    setShowForm(false);
    setSuccess("Ticket submitted. Support will handle it from the admin queue.");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={`${compact ? "text-xl" : "text-2xl"} font-bold text-gray-950`}>{heading}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Close form" : "Raise ticket"}
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div> : null}

      {showForm ? (
        <form onSubmit={submitTicket} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium text-gray-700">
              Ticket from
              <select
                value={form.requesterType}
                onChange={(event) => updateForm("requesterType", event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
              >
                {requesterOptions.map((item) => <option key={item} value={item}>{supportLabel(item)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Category
              <select
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
              >
                {SUPPORT_CATEGORIES.map((item) => <option key={item} value={item}>{supportLabel(item)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Priority
              <select
                value={form.priority}
                onChange={(event) => updateForm("priority", event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
              >
                {SUPPORT_PRIORITIES.map((item) => <option key={item} value={item}>{supportLabel(item)}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="block text-sm font-medium text-gray-700">
              Title
              <input
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                maxLength={160}
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                placeholder="Short summary of the issue"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Related job ID
              <input
                value={form.relatedJobId}
                onChange={(event) => updateForm("relatedJobId", event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                placeholder="Optional"
              />
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium text-gray-700">
            Details
            <textarea
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              className="mt-1 min-h-36 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              placeholder="Explain what happened, what you expected, and any payment/job/reference details."
            />
          </label>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit ticket
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="font-semibold text-gray-950">Your tickets</h3>
            <p className="text-sm text-gray-500">Delayed unresolved tickets automatically rise in admin priority.</p>
          </div>
          <MessageSquare className="h-5 w-5 text-gray-400" />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 p-5 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading tickets...
          </div>
        ) : sortedTickets.length ? (
          <div className="divide-y divide-gray-100">
            {sortedTickets.map((ticket) => (
              <div key={ticket.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-gray-500">{formatTicketNumber(ticket.ticketNumber)}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone[ticket.status] || statusTone.open}`}>
                        {supportLabel(ticket.status)}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{supportLabel(String(ticket.category))}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{supportLabel(ticket.requesterType)}</span>
                    </div>
                    <h4 className="mt-2 font-semibold text-gray-950">{ticket.title}</h4>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600">{ticket.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-sm text-gray-500">
                    {ticket.status === "resolved" || ticket.status === "closed" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : ticket.status === "open" ? <AlertCircle className="h-4 w-4 text-red-600" /> : <Clock className="h-4 w-4 text-amber-600" />}
                    <span>Opened {ticket.ageLabel} ago</span>
                  </div>
                </div>
                {ticket.messages.length ? (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    <span className="font-medium text-gray-900">Latest update:</span>{" "}
                    {ticket.messages[ticket.messages.length - 1]?.body.slice(0, 180)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-gray-300" />
            <h3 className="mt-3 font-semibold text-gray-950">No tickets yet</h3>
            <p className="mt-1 text-sm text-gray-500">Raise a ticket when you need account, booking, KYC, payment, or technical support.</p>
          </div>
        )}
      </div>
    </div>
  );
}
