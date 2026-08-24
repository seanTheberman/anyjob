"use client";

import { useMemo, useState } from "react";
import { ImageIcon, RotateCcw, Save, Search } from "lucide-react";

import type { MobileContentDefinition } from "@/lib/mobile-content/catalog";

type SavedEntry = { key: string; value: string; updatedAt: string | null };

export function AdminMobileContentPanel({
  catalog,
  savedEntries,
}: {
  catalog: MobileContentDefinition[];
  savedEntries: SavedEntry[];
}) {
  const saved = useMemo(() => new Map(savedEntries.map((item) => [item.key, item.value])), [savedEntries]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(catalog.map((item) => [item.key, saved.get(item.key) ?? item.defaultValue])),
  );
  const sections = useMemo(() => [...new Set(catalog.map((item) => item.section))], [catalog]);
  const [activeSection, setActiveSection] = useState(sections[0] || "");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const visible = catalog.filter((item) => {
    if (item.section !== activeSection) return false;
    const needle = query.trim().toLowerCase();
    return !needle || `${item.label} ${item.key} ${item.description}`.toLowerCase().includes(needle);
  });

  async function publish() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/mobile-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: catalog.map((item) => ({ key: item.key, value: values[item.key] ?? "" })) }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Content could not be published.");
      setMessage({ tone: "success", text: payload.message || "App content published." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Content could not be published." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="min-w-0">
        <nav aria-label="Content sections" className="space-y-1">
          {sections.map((section) => {
            const active = section === activeSection;
            const count = catalog.filter((item) => item.section === section).length;
            return (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`flex min-h-10 w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold ${active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}`}
              >
                <span>{section}</span>
                <span className={active ? "text-slate-300" : "text-slate-400"}>{count}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{activeSection}</h2>
            <p className="mt-1 text-sm text-slate-500">Changes appear after the app refreshes its content cache.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find content"
              className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {visible.map((item) => (
            <div key={item.key} className="grid gap-3 py-5 lg:grid-cols-[minmax(180px,0.42fr)_minmax(0,1fr)]">
              <div className="min-w-0">
                <label htmlFor={item.key} className="text-sm font-semibold text-slate-900">{item.label}</label>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                <code className="mt-2 block break-all text-[11px] text-slate-400">{item.key}</code>
              </div>
              <div className="min-w-0">
                {item.type === "textarea" ? (
                  <textarea
                    id={item.key}
                    value={values[item.key] ?? ""}
                    onChange={(event) => setValues((current) => ({ ...current, [item.key]: event.target.value }))}
                    rows={3}
                    className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  />
                ) : (
                  <div className="relative">
                    {item.type === "url" ? <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /> : null}
                    <input
                      id={item.key}
                      type={item.type === "url" ? "url" : "text"}
                      value={values[item.key] ?? ""}
                      onChange={(event) => setValues((current) => ({ ...current, [item.key]: event.target.value }))}
                      className={`h-10 w-full rounded-md border border-slate-200 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 ${item.type === "url" ? "pl-9" : "pl-3"}`}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setValues((current) => ({ ...current, [item.key]: item.defaultValue }))}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore default
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite" className={`text-sm font-medium ${message?.tone === "error" ? "text-red-700" : "text-emerald-700"}`}>
            {message?.text}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => void publish()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {pending ? "Publishing..." : "Publish app content"}
          </button>
        </div>
      </section>
    </div>
  );
}
