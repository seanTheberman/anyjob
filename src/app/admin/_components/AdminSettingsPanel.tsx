"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";

import { settingsGroups } from "./admin-data";

type SavedSetting = {
  key: string;
  value: string;
};

function settingKey(groupTitle: string, item: string) {
  return `${groupTitle}:${item}`.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function AdminSettingsPanel({ savedSettings }: { savedSettings: SavedSetting[] }) {
  const saved = useMemo(() => new Map(savedSettings.map((setting) => [setting.key, setting.value])), [savedSettings]);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const group of settingsGroups) {
      for (const item of group.items) {
        const key = settingKey(group.title, item);
        initial[key] = saved.get(key) || "Default policy";
      }
    }
    return initial;
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function saveSettings() {
    setPending(true);
    setMessage(null);
    const settings = settingsGroups.flatMap((group) => group.items.map((item) => {
      const key = settingKey(group.title, item);
      return { key, value: values[key] || "", groupTitle: group.title };
    }));

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);
    setMessage(response.ok ? payload.message || "Settings saved." : payload.error || "Settings save failed.");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          disabled={pending}
          onClick={saveSettings}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {pending ? "Saving..." : "Save settings"}
        </button>
      </div>
      {message ? <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{message}</div> : null}
      <div className="grid gap-5 xl:grid-cols-3">
        {settingsGroups.map((group) => (
          <section key={group.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">{group.title}</h2>
            <div className="mt-4 space-y-4">
              {group.items.map((item) => {
                const key = settingKey(group.title, item);
                return (
                  <label key={item} className="block">
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                    <input
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      value={values[key] || ""}
                      onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                    />
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
