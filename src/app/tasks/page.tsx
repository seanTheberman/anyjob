"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Calendar, Clock, Filter, Gavel, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { formatMoney } from "@/lib/booking-token";

type Task = {
  id: string;
  source: "buyer" | "business";
  title: string;
  category: string;
  description: string;
  location: string;
  remote: boolean;
  priceMin: number;
  priceMax: number;
  quoteCount: number;
  lowestQuoteTotal: number | null;
  startsAt: string | null;
  createdAt: string | null;
  href: string;
  workImages?: Array<{ id: string; image_url: string }>;
};

function categoryLabel(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [remote, setRemote] = useState(true);
  const [sort, setSort] = useState("newest");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const params = useMemo(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (category) next.set("category", category);
    if (location) next.set("location", location);
    if (price) next.set("price", price);
    if (remote) next.set("remote", "true");
    if (sort) next.set("sort", sort);
    return next;
  }, [category, location, price, query, remote, sort]);

  useEffect(() => {
    let active = true;
    async function loadTasks() {
      setLoading(true);
      const response = await fetch(`/api/tasks?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));
      if (!active) return;
      const nextTasks = payload.tasks || [];
      setTasks(nextTasks);
      setSelectedTaskId((current) => current && nextTasks.some((task: Task) => `${task.source}-${task.id}` === current) ? current : nextTasks[0] ? `${nextTasks[0].source}-${nextTasks[0].id}` : null);
      setCategories(payload.categories || []);
      setLoading(false);
    }
    loadTasks();
    return () => {
      active = false;
    };
  }, [params]);

  const selectedTask = tasks.find((task) => `${task.source}-${task.id}` === selectedTaskId) || tasks[0] || null;

  function priceLabel(task: Task) {
    if (task.lowestQuoteTotal) return `From ${formatMoney(task.lowestQuoteTotal)}`;
    if (task.priceMax || task.priceMin) return formatMoney(task.priceMax || task.priceMin);
    return "Open budget";
  }

  return (
    <main className="min-h-screen bg-[#f4f5f9] pt-24">
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-600">Browse jobs</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-blue-950">Find open work near you</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Browse live buyer requests and business work posts. Select a job to inspect the brief before opening the provider workflow.</p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
            {loading ? "Loading..." : `${tasks.length} open task${tasks.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="sticky top-20 z-20 border-y border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_180px_260px_150px_150px_130px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for a task"
                className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
              <option value="">Category</option>
              {categories.map((item) => <option key={item} value={item}>{categoryLabel(item)}</option>)}
            </select>
            <label className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="50km Ajmer RJ 305001"
                className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <select value={price} onChange={(event) => setPrice(event.target.value)} className="h-11 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
              <option value="">Any price</option>
              <option value="0-50">Up to €50</option>
              <option value="50-100">€50 - €100</option>
              <option value="100-250">€100 - €250</option>
              <option value="250-plus">€250+</option>
            </select>
            <button
              type="button"
              onClick={() => setRemote((value) => !value)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold ${remote ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700"}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Remotely
            </button>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
              <option value="newest">Sort</option>
              <option value="price_low">Price low</option>
              <option value="price_high">Price high</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[430px_minmax(0,1fr)]">
          <section className="space-y-3 lg:max-h-[calc(100vh-178px)] lg:overflow-y-auto lg:pr-1">
            {loading ? (
              [1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-lg border border-slate-200 bg-white" />)
            ) : tasks.map((task) => {
              const key = `${task.source}-${task.id}`;
              const active = selectedTask && `${selectedTask.source}-${selectedTask.id}` === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTaskId(key)}
                  className={`w-full rounded-lg border p-4 text-left transition ${active ? "border-blue-200 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-100 hover:bg-slate-50"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {task.workImages?.[0] ? (
                      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <img src={task.workImages[0].image_url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-lg font-bold leading-6 text-blue-950">{task.title}</h2>
                      <div className="mt-3 space-y-1.5 text-sm font-semibold text-slate-500">
                        <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{task.location}</p>
                        <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{task.startsAt ? new Date(task.startsAt).toLocaleDateString() : "Flexible timing"}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-lg font-black text-blue-950">{priceLabel(task)}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{categoryLabel(task.category)}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{task.source === "business" ? "Business" : "Buyer"}</span>
                    <span className="inline-flex items-center gap-1 font-bold text-slate-500">
                      {task.source === "business" ? <BriefcaseBusiness className="h-4 w-4" /> : <Gavel className="h-4 w-4" />}
                      {task.source === "business" ? "Work post" : `${task.quoteCount} offer${task.quoteCount === 1 ? "" : "s"}`}
                    </span>
                    {task.workImages?.length ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {task.workImages.length} photo{task.workImages.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </section>

          <section className="min-h-[620px] rounded-lg border border-slate-200 bg-white p-6 lg:sticky lg:top-40 lg:self-start">
            {selectedTask ? (
              <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-green-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-green-800">Open</span>
                    <span className="rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-blue-700">{selectedTask.source === "business" ? "Business post" : "Buyer request"}</span>
                    {selectedTask.remote ? <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-slate-600">Remote possible</span> : null}
                  </div>
                  <h2 className="mt-7 text-4xl font-black leading-tight tracking-tight text-blue-950">{selectedTask.title}</h2>
                  <div className="mt-7 grid gap-5 md:grid-cols-3">
                    <div className="flex gap-3">
                      <MapPin className="mt-1 h-5 w-5 text-blue-950" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Location</p>
                        <p className="font-semibold text-slate-800">{selectedTask.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Calendar className="mt-1 h-5 w-5 text-blue-950" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">To be done</p>
                        <p className="font-semibold text-slate-800">{selectedTask.startsAt ? new Date(selectedTask.startsAt).toLocaleDateString() : "Flexible"}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Clock className="mt-1 h-5 w-5 text-blue-950" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Activity</p>
                        <p className="font-semibold text-slate-800">{selectedTask.source === "business" ? "Applications open" : `${selectedTask.quoteCount} offer${selectedTask.quoteCount === 1 ? "" : "s"}`}</p>
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-8 text-xl font-black text-blue-950">Details</h3>
                  <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{selectedTask.description || "No extra detail has been added yet."}</p>
                  {selectedTask.workImages?.length ? (
                    <div className="mt-8">
                      <h3 className="text-xl font-black text-blue-950">Job photos</h3>
                      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                        {selectedTask.workImages.map((image, index) => (
                          <a
                            key={image.id}
                            href={image.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                          >
                            <img src={image.image_url} alt={`Job photo ${index + 1}`} className="h-full w-full object-cover transition hover:scale-105" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <aside className="space-y-4">
                  <div className="rounded-lg bg-slate-100 p-6 text-center">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Task budget</p>
                    <p className="mt-2 text-4xl font-black text-blue-950">{priceLabel(selectedTask)}</p>
                    <Link href={selectedTask.href} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
                      Open job
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-5">
                    <p className="text-sm font-black text-blue-950">Before you apply</p>
                    <div className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
                      <p>Exact contact details unlock after paid acceptance.</p>
                      <p>Buyer sees one total offer including AnyJob fee.</p>
                      <p>Use the full job page to make or manage your offer.</p>
                    </div>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="flex h-full min-h-[420px] items-center justify-center text-center">
                <div>
                  <Filter className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-lg font-bold text-slate-950">Select a task</p>
                  <p className="mt-1 text-sm text-slate-500">Choose a job from the list to inspect its details.</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {!loading && tasks.length === 0 ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">No tasks match these filters</p>
            <p className="mt-2 text-sm text-slate-500">Try a wider location, another category, or any price.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
