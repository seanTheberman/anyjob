"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Bot, CheckCircle2, ListChecks, Loader2, MessageSquare, Send, ShieldAlert, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";
type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  rows?: Array<Record<string, unknown>>;
  pendingAction?: PendingAction;
};

type PendingAction = {
  operation: "update_record" | "insert_record";
  table: string;
  id?: string;
  values: Record<string, unknown>;
  reason?: string;
};

type AssistantResponse = {
  message?: string;
  rows?: Array<Record<string, unknown>>;
  pendingAction?: PendingAction;
  error?: string;
};

const starterPrompts = [
  "Who needs KYC review?",
  "Did any providers upload KYC documents?",
  "How many live jobs are there?",
  "Which live jobs have no quotes?",
  "How many jobs came in today?",
];

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function displayValue(value: unknown) {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "object") return JSON.stringify(value).slice(0, 140);
  return String(value);
}

function ToolRows({ rows }: { rows: Array<Record<string, unknown>> }) {
  const columns = useMemo(() => {
    const first = rows[0] || {};
    return Object.keys(first).slice(0, 5);
  }, [rows]);

  if (!rows.length || !columns.length) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <ListChecks className="h-3.5 w-3.5" />
        Results
      </div>
      <div className="max-h-52 overflow-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-white text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="border-b border-slate-100 px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.slice(0, 8).map((row, index) => (
              <tr key={String(row.id || index)}>
                {columns.map((column) => (
                  <td key={column} className="max-w-44 truncate px-3 py-2 text-slate-700">
                    {displayValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 8 ? <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">Showing 8 of {rows.length} rows.</div> : null}
    </div>
  );
}

function PendingActionCard({
  action,
  onConfirm,
  onCancel,
  disabled,
}: {
  action: PendingAction;
  onConfirm: () => void;
  onCancel: () => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">Confirm admin change</p>
          <p className="mt-1 text-xs leading-5 text-amber-800">{action.reason || "The assistant prepared this change."}</p>
        </div>
      </div>
      <dl className="mt-3 grid gap-2 rounded-md bg-white/70 p-2 text-xs">
        <div>
          <dt className="font-semibold uppercase tracking-wide text-amber-700">Table</dt>
          <dd className="mt-0.5 break-all font-mono text-amber-950">{action.table}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-amber-700">Operation</dt>
          <dd className="mt-0.5 font-mono text-amber-950">{action.operation}</dd>
        </div>
        {action.id ? (
          <div>
            <dt className="font-semibold uppercase tracking-wide text-amber-700">Record</dt>
            <dd className="mt-0.5 break-all font-mono text-amber-950">{action.id}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold uppercase tracking-wide text-amber-700">Values</dt>
          <dd className="mt-0.5 max-h-32 overflow-auto rounded bg-amber-100/70 p-2 font-mono text-amber-950">
            {JSON.stringify(action.values, null, 2)}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onConfirm}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {disabled ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Apply change
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onCancel}
          className="h-8 rounded-md border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function AdminAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: newId(),
      role: "assistant",
      content: "I can check AnyJob admin data and prepare safe updates. I will ask you to confirm before changing anything.",
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function askAssistant(prompt: string) {
    const text = prompt.trim();
    if (!text || pending) return;

    const nextMessages: ChatMessage[] = [...messages, { id: newId(), role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({ role: message.role, content: message.content })),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as AssistantResponse;
      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: "assistant",
          content: response.ok ? payload.message || "Done." : payload.error || "The assistant could not complete that.",
          rows: payload.rows,
          pendingAction: payload.pendingAction,
        },
      ]);
    } finally {
      setPending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  async function confirmAction(messageId: string, action: PendingAction) {
    if (confirmingId) return;
    setConfirmingId(messageId);

    try {
      const response = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmAction: action }),
      });
      const payload = (await response.json().catch(() => ({}))) as AssistantResponse;
      setMessages((current) => [
        ...current.map((message) => (message.id === messageId ? { ...message, pendingAction: undefined } : message)),
        {
          id: newId(),
          role: "assistant",
          content: response.ok ? payload.message || "Change applied." : payload.error || "The change failed.",
          rows: payload.rows,
        },
      ]);
    } finally {
      setConfirmingId(null);
    }
  }

  function cancelAction(messageId: string) {
    setMessages((current) => current.map((message) => (message.id === messageId ? { ...message, pendingAction: undefined } : message)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAssistant(input);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open admin assistant"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-5 right-5 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-xl shadow-slate-900/25 transition hover:bg-slate-800",
          open && "hidden"
        )}
      >
        <Bot className="h-5 w-5" />
        Admin assistant
      </button>

      {open ? (
        <section className="fixed bottom-5 right-5 z-50 flex h-[min(760px,calc(100vh-2.5rem))] w-[min(460px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/25">
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">AnyJob admin assistant</h2>
                <p className="truncate text-xs text-slate-300">Checks admin data. Changes need confirmation.</p>
              </div>
            </div>
            <button type="button" aria-label="Close admin assistant" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-6",
                    message.role === "user" ? "bg-red-600 text-white" : "border border-slate-200 bg-white text-slate-800 shadow-sm"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.rows ? <ToolRows rows={message.rows} /> : null}
                  {message.pendingAction ? (
                    <PendingActionCard
                      action={message.pendingAction}
                      disabled={confirmingId === message.id}
                      onConfirm={() => void confirmAction(message.id, message.pendingAction as PendingAction)}
                      onCancel={() => cancelAction(message.id)}
                    />
                  ) : null}
                </div>
              </div>
            ))}
            {pending ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking admin data...
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={pending}
                  onClick={() => void askAssistant(prompt)}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <MessageSquare className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={pending}
                  placeholder="Ask about users, jobs, badges, settings..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={pending || !input.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                aria-label="Send admin assistant message"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </>
  );
}
