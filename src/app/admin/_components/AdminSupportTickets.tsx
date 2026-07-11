"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock, MessageSquare, RefreshCw, Search, UserCheck } from "lucide-react";

import { StatusBadge } from "./AdminPrimitives";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_REQUESTER_TYPES,
  SUPPORT_STATUSES,
  formatTicketNumber,
  supportLabel,
  type SupportTicket,
} from "@/lib/support/tickets";

type FilterValue = "all" | string;

function includesQuery(ticket: SupportTicket, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    ticket.title,
    ticket.description,
    ticket.requesterName,
    ticket.requesterEmail,
    ticket.category,
    ticket.requesterType,
    formatTicketNumber(ticket.ticketNumber),
  ].some((value) => value.toLowerCase().includes(normalized));
}

function priorityClass(priority: string) {
  if (priority === "urgent") return "border-red-200 bg-red-50 text-red-800";
  if (priority === "high") return "border-orange-200 bg-orange-50 text-orange-800";
  if (priority === "low") return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

function requesterClass(type: string) {
  if (type === "business") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (type === "contractor") return "border-blue-200 bg-blue-50 text-blue-800";
  if (type === "provider") return "border-purple-200 bg-purple-50 text-purple-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function AdminSupportTickets({ tickets: initialTickets }: { tickets: SupportTicket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterValue>("all");
  const [requesterType, setRequesterType] = useState<FilterValue>("all");
  const [category, setCategory] = useState<FilterValue>("all");
  const [priority, setPriority] = useState<FilterValue>("all");
  const [expandedId, setExpandedId] = useState<string | null>(tickets[0]?.id || null);
  const [replyByTicket, setReplyByTicket] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tickets
      .filter((ticket) => status === "all" || ticket.status === status)
      .filter((ticket) => requesterType === "all" || ticket.requesterType === requesterType)
      .filter((ticket) => category === "all" || ticket.category === category)
      .filter((ticket) => priority === "all" || ticket.priority === priority)
      .filter((ticket) => includesQuery(ticket, query))
      .sort((left, right) => right.priorityScore - left.priorityScore || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [category, priority, query, requesterType, status, tickets]);

  const unresolvedCount = tickets.filter((ticket) => !["resolved", "closed"].includes(ticket.status)).length;
  const urgentCount = tickets.filter((ticket) => ticket.priority === "urgent" && !["resolved", "closed"].includes(ticket.status)).length;
  const oldestOpen = tickets
    .filter((ticket) => !["resolved", "closed"].includes(ticket.status))
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())[0];

  function replaceTicket(ticket: SupportTicket) {
    setTickets((current) => current.map((item) => item.id === ticket.id ? ticket : item));
  }

  async function updateTicket(ticket: SupportTicket, payload: Record<string, unknown>, successMessage: string) {
    setPending(ticket.id);
    setMessage(null);
    const response = await fetch("/api/admin/support/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: ticket.id, ...payload }),
    });
    const body = await response.json().catch(() => ({}));
    setPending(null);

    if (!response.ok) {
      setMessage(body.error || "Ticket update failed");
      return;
    }

    replaceTicket(body.ticket as SupportTicket);
    setMessage(successMessage);
  }

  async function sendReply(ticket: SupportTicket, internalNote = false) {
    const responseText = (replyByTicket[ticket.id] || "").trim();
    if (!responseText) return;
    await updateTicket(
      ticket,
      {
        response: responseText,
        internalNote,
        status: ticket.status === "open" ? "in_progress" : ticket.status,
      },
      internalNote ? "Internal note added." : "Reply added to the ticket."
    );
    setReplyByTicket((current) => ({ ...current, [ticket.id]: "" }));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Open support load</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{unresolvedCount}</p>
          <p className="mt-1 text-sm text-slate-500">Unresolved tickets across users, businesses, providers, and contractors.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Urgent tickets</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{urgentCount}</p>
          <p className="mt-1 text-sm text-slate-500">Urgent and delayed tickets receive the highest queue score.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Oldest open ticket</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{oldestOpen?.ageLabel || "None"}</p>
          <p className="mt-1 text-sm text-slate-500">Age is part of the priority score, so ignored tickets climb upward.</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-[1fr_160px_170px_160px_150px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              placeholder="Search tickets, requester, email, issue"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All statuses</option>
            {SUPPORT_STATUSES.map((item) => <option key={item} value={item}>{supportLabel(item)}</option>)}
          </select>
          <select value={requesterType} onChange={(event) => setRequesterType(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All requester types</option>
            {SUPPORT_REQUESTER_TYPES.map((item) => <option key={item} value={item}>{supportLabel(item)}</option>)}
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All categories</option>
            {SUPPORT_CATEGORIES.map((item) => <option key={item} value={item}>{supportLabel(item)}</option>)}
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All priorities</option>
            {SUPPORT_PRIORITIES.map((item) => <option key={item} value={item}>{supportLabel(item)}</option>)}
          </select>
          <button
            type="button"
            onClick={() => { setQuery(""); setStatus("all"); setRequesterType("all"); setCategory("all"); setPriority("all"); }}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      {message ? (
        <div className={`rounded-lg border px-3 py-2 text-sm ${message.includes("failed") ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {message}
        </div>
      ) : null}

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const expanded = expandedId === ticket.id;
            const pendingThis = pending === ticket.id;
            return (
              <section key={ticket.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : ticket.id)}
                  className="flex w-full flex-col gap-3 p-4 text-left hover:bg-slate-50 md:flex-row md:items-start md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-500">{formatTicketNumber(ticket.ticketNumber)}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${requesterClass(ticket.requesterType)}`}>{supportLabel(ticket.requesterType)}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClass(ticket.priority)}`}>{supportLabel(ticket.priority)}</span>
                      <StatusBadge value={supportLabel(ticket.status)} />
                    </div>
                    <h2 className="mt-2 truncate text-base font-semibold text-slate-950">{ticket.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{ticket.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {ticket.requesterName} · {ticket.requesterEmail} · {supportLabel(String(ticket.category))} · opened {ticket.ageLabel} ago
                    </p>
                  </div>
                  <div className="grid shrink-0 grid-cols-3 gap-2 text-center md:w-[240px]">
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-xs text-slate-500">Score</p>
                      <p className="font-semibold text-slate-950">{ticket.priorityScore}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-xs text-slate-500">Waiting</p>
                      <p className="font-semibold text-slate-950">{ticket.waitingLabel}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-xs text-slate-500">Messages</p>
                      <p className="font-semibold text-slate-950">{ticket.messages.length}</p>
                    </div>
                  </div>
                </button>

                {expanded ? (
                  <div className="border-t border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="space-y-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-950">Issue details</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p>
                          {ticket.relatedJobId || ticket.sourcePath ? (
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                              {ticket.relatedJobId ? <span>Related job: {ticket.relatedJobId}</span> : null}
                              {ticket.sourcePath ? <span>Raised from: {ticket.sourcePath}</span> : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="mb-3 text-sm font-semibold text-slate-950">Conversation</p>
                          {ticket.messages.length ? (
                            <div className="space-y-2">
                              {ticket.messages.map((item) => (
                                <div key={item.id} className={`rounded-lg border p-3 text-sm ${item.senderRole === "admin" ? "border-blue-100 bg-blue-50" : "border-slate-200 bg-white"}`}>
                                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                                    <span>{supportLabel(item.senderRole)}</span>
                                    {item.internalNote ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Internal note</span> : null}
                                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span>
                                  </div>
                                  <p className="whitespace-pre-wrap leading-6 text-slate-700">{item.body}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">No messages yet.</p>
                          )}
                        </div>
                      </div>

                      <aside className="space-y-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="mb-3 text-sm font-semibold text-slate-950">Triage</p>
                          <div className="space-y-3">
                            <label className="block text-xs font-medium text-slate-500">
                              Status
                              <select
                                value={ticket.status}
                                disabled={pendingThis}
                                onChange={(event) => updateTicket(ticket, { status: event.target.value }, "Ticket status updated.")}
                                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                              >
                                {SUPPORT_STATUSES.map((item) => <option key={item} value={item}>{supportLabel(item)}</option>)}
                              </select>
                            </label>
                            <label className="block text-xs font-medium text-slate-500">
                              Priority
                              <select
                                value={ticket.priority}
                                disabled={pendingThis}
                                onChange={(event) => updateTicket(ticket, { priority: event.target.value }, "Ticket priority updated.")}
                                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                              >
                                {SUPPORT_PRIORITIES.map((item) => <option key={item} value={item}>{supportLabel(item)}</option>)}
                              </select>
                            </label>
                            <button
                              type="button"
                              disabled={pendingThis}
                              onClick={() => updateTicket(ticket, { assignToMe: true, status: ticket.status === "open" ? "in_progress" : ticket.status }, "Ticket assigned.")}
                              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              <UserCheck className="h-4 w-4" />
                              Assign to me
                            </button>
                            <button
                              type="button"
                              disabled={pendingThis}
                              onClick={() => updateTicket(ticket, { status: "resolved" }, "Ticket resolved.")}
                              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Mark resolved
                            </button>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="mb-3 text-sm font-semibold text-slate-950">Reply</p>
                          <textarea
                            value={replyByTicket[ticket.id] || ""}
                            onChange={(event) => setReplyByTicket((current) => ({ ...current, [ticket.id]: event.target.value }))}
                            className="min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                            placeholder="Write a reply or internal note..."
                          />
                          <div className="mt-3 grid gap-2">
                            <button
                              type="button"
                              disabled={pendingThis || !(replyByTicket[ticket.id] || "").trim()}
                              onClick={() => sendReply(ticket, false)}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Send reply
                            </button>
                            <button
                              type="button"
                              disabled={pendingThis || !(replyByTicket[ticket.id] || "").trim()}
                              onClick={() => sendReply(ticket, true)}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              <Clock className="h-4 w-4" />
                              Add internal note
                            </button>
                          </div>
                        </div>
                      </aside>
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 text-base font-semibold text-slate-950">No tickets match these filters</h2>
          <p className="mt-1 text-sm text-slate-500">Clear filters or wait for users to raise new support requests.</p>
        </div>
      )}

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        <div className="flex items-start gap-2">
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Queue order is calculated from selected priority, ticket age, unresolved status, and time since the last admin response. A normal ticket that is ignored will keep moving upward.
          </p>
        </div>
      </div>
    </div>
  );
}
