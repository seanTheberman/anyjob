"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin, Search, ShieldCheck, SlidersHorizontal, Star, Users } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

const FEATURED_PROVIDERS = [
  {
    id: "1",
    slug: "volodymyr-handyman",
    name: "Volodymyr",
    categorySlug: "bricolage",
    category: "Handyman",
    city: "London",
    rate: 24,
    rating: 4.9,
    reviews: 38,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500&auto=format&fit=crop",
    tags: ["Furniture assembly", "Repairs", "Careful work"],
  },
  {
    id: "2",
    slug: "amina-cleaning",
    name: "Amina",
    categorySlug: "menage",
    category: "Cleaning",
    city: "Manchester",
    rate: 19,
    rating: 4.8,
    reviews: 62,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500&auto=format&fit=crop",
    tags: ["Deep cleaning", "Move-out cleans", "Supplies included"],
  },
  {
    id: "3",
    slug: "marc-petsitter",
    name: "Marc",
    categorySlug: "animaux",
    category: "Pet care",
    city: "Birmingham",
    rate: 18,
    rating: 4.7,
    reviews: 27,
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=500&auto=format&fit=crop",
    tags: ["Dog sitting", "Walks", "Calm and patient"],
  },
  {
    id: "4",
    slug: "celestine-babysitter",
    name: "Celestine",
    categorySlug: "enfants",
    category: "Childcare",
    city: "London",
    rate: 22,
    rating: 4.9,
    reviews: 44,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=500&auto=format&fit=crop",
    tags: ["Evening care", "Homework help", "DBS checked"],
  },
  {
    id: "5",
    slug: "sam-gardening",
    name: "Sam",
    categorySlug: "jardinage",
    category: "Gardening",
    city: "Leeds",
    rate: 23,
    rating: 4.8,
    reviews: 31,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=500&auto=format&fit=crop",
    tags: ["Lawn care", "Hedge trimming", "Seasonal tidy-up"],
  },
  {
    id: "6",
    slug: "nadia-tutoring",
    name: "Nadia",
    categorySlug: "cours-particuliers",
    category: "Private tutoring",
    city: "Manchester",
    rate: 28,
    rating: 5.0,
    reviews: 19,
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=500&auto=format&fit=crop",
    tags: ["Maths", "Exam prep", "Online or onsite"],
  },
];

const CITIES = ["All cities", ...Array.from(new Set(FEATURED_PROVIDERS.map((provider) => provider.city)))];

export default function CataloguePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("All cities");

  useEffect(() => {
    const requestedCategory = new URLSearchParams(window.location.search).get("cat");
    if (requestedCategory && CATEGORIES.some((item) => item.slug === requestedCategory)) {
      setCategory(requestedCategory);
    }
  }, []);

  const filteredProviders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return FEATURED_PROVIDERS.filter((provider) => {
      const matchesCategory = category === "all" || provider.categorySlug === category;
      const matchesCity = city === "All cities" || provider.city === city;
      const searchableText = [
        provider.name,
        provider.category,
        provider.city,
        ...provider.tags,
      ].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      return matchesCategory && matchesCity && matchesQuery;
    });
  }, [category, city, query]);

  const selectedCategoryName = category === "all"
    ? "All services"
    : CATEGORIES.find((item) => item.slug === category)?.name || "All services";

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <section className="relative overflow-hidden bg-slate-950">
        <Image
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop"
          alt="Home service providers"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Find a provider for the job you need
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-200">
              Search by service, compare rated providers, and continue into booking once you find the right match.
            </p>
            <p className="mt-3 text-sm font-medium text-slate-300">
              More comfort, more freedom, now with provider filters that actually narrow the catalogue.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="-mt-12 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                placeholder="Search cleaning, handyman, tutor..."
                aria-label="Search providers"
              />
            </label>
            <label className="relative block">
              <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                aria-label="Filter by service"
              >
                <option value="all">All services</option>
                {CATEGORIES.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name}</option>
                ))}
              </select>
            </label>
            <label className="relative block">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                aria-label="Filter by city"
              >
                {CITIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setCity("All cities");
              }}
              className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-red-600">{selectedCategoryName}</p>
            <h2 className="text-2xl font-bold text-slate-950">
              {filteredProviders.length} provider{filteredProviders.length === 1 ? "" : "s"} available
            </h2>
          </div>
          <Link href="/questionnaire?category=custom" className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700">
            Need something custom <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${category === "all" ? "bg-slate-950 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
          >
            All
          </button>
          {CATEGORIES.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => setCategory(item.slug)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${category === item.slug ? "bg-slate-950 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {filteredProviders.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProviders.map((provider) => (
              <Link
                key={provider.id}
                href={`/providers/${provider.slug}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={provider.image}
                    alt={provider.name}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">{provider.name}</h3>
                      <p className="text-sm text-slate-500">{provider.category} in {provider.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-950">£{provider.rate}/h</p>
                      <p className="flex items-center justify-end gap-1 text-xs text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-current" /> {provider.rating}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {provider.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{tag}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                    <span className="text-slate-500">{provider.reviews} reviews</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                      View profile <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">No providers match these filters</h3>
            <p className="mt-2 text-sm text-slate-500">Try another service, city, or search term.</p>
          </div>
        )}

        <section className="mt-12 grid gap-4 border-t border-slate-200 pt-8 md:grid-cols-3">
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <Users className="h-6 w-6 text-slate-700" />
            <h3 className="mt-3 font-bold text-slate-950">Reviewed providers</h3>
            <p className="mt-2 text-sm text-slate-500">Use ratings and reviews to compare local providers quickly.</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-slate-700" />
            <h3 className="mt-3 font-bold text-slate-950">Verification first</h3>
            <p className="mt-2 text-sm text-slate-500">KYC and trust signals are surfaced before a provider can bid freely.</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <Star className="h-6 w-6 text-slate-700" />
            <h3 className="mt-3 font-bold text-slate-950">Book with context</h3>
            <p className="mt-2 text-sm text-slate-500">Continue to a questionnaire when you are ready to describe the job.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
