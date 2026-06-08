"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import { CATEGORIES } from "@/lib/categories";
import type { ProviderMarketplaceData } from "@/lib/real-providers";
import { cn } from "@/lib/utils";

const availabilityOptions = ["Today", "This week", "Weekends", "Evenings", "Remote"];
const levelOptions = ["Top Pro", "Level 2", "Level 1", "New"];
const badgeOptions = ["Verified ID", "Top Rated", "Proven Expert", "Value Choice", "Skilled", "Rising Talent"];

type SortOption = "recommended" | "rating" | "reviews" | "price-low" | "price-high";

type BuyerProviderMarketplaceProps = {
  providers: ProviderMarketplaceData[];
  buyerName?: string;
};

type FilterControlsProps = {
  category: string;
  city: string;
  availability: string;
  level: string;
  badge: string;
  minRating: string;
  maxRate: string;
  cities: string[];
  setCategory: (value: string) => void;
  setCity: (value: string) => void;
  setAvailability: (value: string) => void;
  setLevel: (value: string) => void;
  setBadge: (value: string) => void;
  setMinRating: (value: string) => void;
  setMaxRate: (value: string) => void;
  clearFilters: () => void;
};

function formatRate(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function categoryLabel(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug)?.name || "Service";
}

function cardAccent(provider: ProviderMarketplaceData) {
  if (provider.level === "Top Pro") return "bg-red-50 text-red-700 ring-red-100";
  if (provider.level === "Level 2") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (provider.level === "Level 1") return "bg-blue-50 text-blue-700 ring-blue-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function BuyerProviderMarketplace({ providers, buyerName = "there" }: BuyerProviderMarketplaceProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [level, setLevel] = useState("all");
  const [badge, setBadge] = useState("all");
  const [minRating, setMinRating] = useState("0");
  const [maxRate, setMaxRate] = useState("all");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const cities = useMemo(() => {
    return Array.from(new Set(providers.map((provider) => provider.city).filter(Boolean))).sort();
  }, [providers]);

  const filteredProviders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const maxRateValue = maxRate === "all" ? Infinity : Number(maxRate);
    const minRatingValue = Number(minRating);

    return providers
      .filter((provider) => {
        const matchesQuery = !normalizedQuery || provider.searchText.includes(normalizedQuery);
        const matchesCategory = category === "all" || provider.categorySlug === category;
        const matchesCity = city === "all" || provider.city === city;
        const matchesAvailability = availability === "all" || provider.availability === availability;
        const matchesLevel = level === "all" || provider.level === level;
        const matchesBadge = badge === "all" || provider.badges.includes(badge);
        const matchesRating = provider.rating >= minRatingValue || (minRatingValue === 0 && provider.rating === 0);
        const matchesRate = provider.rate <= maxRateValue;

        return matchesQuery && matchesCategory && matchesCity && matchesAvailability && matchesLevel && matchesBadge && matchesRating && matchesRate;
      })
      .sort((a, b) => {
        if (sort === "rating") return b.rating - a.rating;
        if (sort === "reviews") return b.reviewCount - a.reviewCount;
        if (sort === "price-low") return a.rate - b.rate;
        if (sort === "price-high") return b.rate - a.rate;

        const aScore = a.rating * 20 + a.reviewCount + (a.level === "Top Pro" ? 30 : 0) + (a.badges.includes("Verified ID") ? 10 : 0);
        const bScore = b.rating * 20 + b.reviewCount + (b.level === "Top Pro" ? 30 : 0) + (b.badges.includes("Verified ID") ? 10 : 0);
        return bScore - aScore;
      });
  }, [availability, badge, category, city, level, maxRate, minRating, providers, query, sort]);

  const topPicks = useMemo(() => filteredProviders.slice(0, 5), [filteredProviders]);
  const expressProviders = useMemo(() => providers.filter((provider) => provider.availability === "Today" || provider.availability === "This week").slice(0, 5), [providers]);
  const activeFilterCount = [category, city, availability, level, badge, minRating, maxRate].filter((value) => value !== "all" && value !== "0").length;

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setCity("all");
    setAvailability("all");
    setLevel("all");
    setBadge("all");
    setMinRating("0");
    setMaxRate("all");
    setSort("recommended");
  }

  function toggleSaved(id: string) {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-white pt-20 text-slate-950">
      <section className="w-full max-w-full overflow-x-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-600">Welcome back, {buyerName}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Find a provider and book directly</h1>
            </div>

            <form
              className="flex w-full min-w-0 max-w-2xl rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-slate-900"
              onSubmit={(event) => event.preventDefault()}
            >
              <label htmlFor="provider-search" className="sr-only">Search providers</label>
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="provider-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search cleaning, babysitter, plumber, video editor..."
                  className="h-12 w-full min-w-0 rounded-l-lg border-0 pl-12 pr-3 text-sm outline-none"
                />
              </div>
              <button type="submit" className="inline-flex h-12 shrink-0 items-center justify-center rounded-r-lg bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800">
                Search
              </button>
            </form>
          </div>

          <div className="-mx-4 mt-5 flex max-w-[100vw] gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:max-w-full lg:px-0">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors", category === "all" ? "bg-slate-950 text-white" : "border border-slate-200 text-slate-700 hover:border-slate-400")}
            >
              Trending
            </button>
            {CATEGORIES.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setCategory(item.slug)}
                className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors", category === item.slug ? "bg-slate-950 text-white" : "border border-slate-200 text-slate-700 hover:border-slate-400")}
              >
                {item.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm hover:bg-slate-50 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
          </button>
        </div>
      </section>

      <section className="w-full max-w-full overflow-x-hidden bg-gradient-to-r from-red-50 via-white to-emerald-50">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recommended for you</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <Sparkles className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-950">Skip the job post</h2>
                  <p className="mt-1 text-sm text-slate-600">Search live profiles, compare providers, and open the profile you want.</p>
                </div>
              </div>
              <button type="button" onClick={() => setFiltersOpen(true)} className="hidden rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 sm:inline-flex">
                Refine
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Marketplace strength</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-2xl font-bold text-slate-950">{providers.length}</p>
                <p className="text-xs text-slate-500">approved providers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-950">{providers.filter((provider) => provider.badges.includes("Verified ID")).length}</p>
                <p className="text-xs text-slate-500">verified profiles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-950">{providers.filter((provider) => provider.level === "Top Pro").length}</p>
                <p className="text-xs text-slate-500">top pros</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Top matches for your next booking</h2>
            <p className="mt-1 text-sm text-slate-600">Browse provider profiles directly, just like services in a marketplace.</p>
          </div>
          <button type="button" className="hidden items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 lg:inline-flex" onClick={() => setFiltersOpen((open) => !open)}>
            <SlidersHorizontal className="h-4 w-4" />
            Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
          </button>
        </div>

        {topPicks.length ? (
          <div className="grid grid-cols-1 gap-5 sm:-mx-6 sm:flex sm:max-w-[100vw] sm:gap-4 sm:overflow-x-auto sm:px-6 sm:pb-4 lg:mx-0 lg:max-w-full lg:px-0">
            {topPicks.map((provider) => (
              <ProviderGigCard key={`top-${provider.id}`} provider={provider} saved={savedIds.has(provider.id)} onSave={() => toggleSaved(provider.id)} compact />
            ))}
          </div>
        ) : (
          <EmptyState onClear={clearFilters} />
        )}
      </section>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[100010] lg:hidden" role="dialog" aria-modal="true" aria-label="Provider filters">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div
            className="absolute inset-x-0 max-h-[min(82dvh,44rem)] overflow-hidden rounded-t-2xl bg-white shadow-2xl"
            style={{ bottom: "max(env(safe-area-inset-bottom), 12px)" }}
          >
            <div className="flex max-h-[min(82dvh,44rem)] flex-col">
              <div className="shrink-0 px-4 pb-3 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Advanced filters</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{filteredProviders.length} providers match</p>
                  </div>
                  <button type="button" onClick={() => setFiltersOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close filters">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
                <FilterControls
                  category={category}
                  city={city}
                  availability={availability}
                  level={level}
                  badge={badge}
                  minRating={minRating}
                  maxRate={maxRate}
                  cities={cities}
                  setCategory={setCategory}
                  setCity={setCity}
                  setAvailability={setAvailability}
                  setLevel={setLevel}
                  setBadge={setBadge}
                  setMinRating={setMinRating}
                  setMaxRate={setMaxRate}
                  clearFilters={clearFilters}
                />
              </div>
              <div
                className="shrink-0 border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-[0_-12px_24px_rgba(15,23,42,0.08)]"
                style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
              >
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-red-600"
                >
                  Show {filteredProviders.length} provider{filteredProviders.length === 1 ? "" : "s"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mx-auto grid w-full max-w-7xl gap-8 overflow-x-hidden px-4 pb-16 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-950">Advanced filters</h2>
            </div>
            <FilterControls
              category={category}
              city={city}
              availability={availability}
              level={level}
              badge={badge}
              minRating={minRating}
              maxRate={maxRate}
              cities={cities}
              setCategory={setCategory}
              setCity={setCity}
              setAvailability={setAvailability}
              setLevel={setLevel}
              setBadge={setBadge}
              setMinRating={setMinRating}
              setMaxRate={setMaxRate}
              clearFilters={clearFilters}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {filteredProviders.length} provider{filteredProviders.length === 1 ? "" : "s"} found
              {category !== "all" ? ` in ${categoryLabel(category)}` : ""}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 lg:hidden" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
              <label className="sr-only" htmlFor="sort">Sort providers</label>
              <div className="relative">
                <select
                  id="sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortOption)}
                  className="h-10 appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-slate-900"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest rated</option>
                  <option value="reviews">Most reviewed</option>
                  <option value="price-low">Lowest rate</option>
                  <option value="price-high">Highest rate</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          </div>

          {filteredProviders.length ? (
            <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProviders.map((provider) => (
                <ProviderGigCard key={provider.id} provider={provider} saved={savedIds.has(provider.id)} onSave={() => toggleSaved(provider.id)} />
              ))}
            </div>
          ) : (
            <EmptyState onClear={clearFilters} />
          )}

          {expressProviders.length ? (
            <div className="mt-12 border-t border-slate-200 pt-8">
              <div className="mb-5 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-950">Available soon</h2>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:-mx-6 sm:flex sm:max-w-[100vw] sm:gap-4 sm:overflow-x-auto sm:px-6 sm:pb-4 lg:mx-0 lg:max-w-full lg:px-0">
                {expressProviders.map((provider) => (
                  <ProviderGigCard key={`express-${provider.id}`} provider={provider} saved={savedIds.has(provider.id)} onSave={() => toggleSaved(provider.id)} compact />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function FilterControls({
  category,
  city,
  availability,
  level,
  badge,
  minRating,
  maxRate,
  cities,
  setCategory,
  setCity,
  setAvailability,
  setLevel,
  setBadge,
  setMinRating,
  setMaxRate,
  clearFilters,
}: FilterControlsProps) {
  return (
    <>
      <FilterSelect label="Category" value={category} onChange={setCategory}>
        <option value="all">All categories</option>
        {CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
      </FilterSelect>

      <FilterSelect label="Area" value={city} onChange={setCity}>
        <option value="all">Any area</option>
        {cities.map((item) => <option key={item} value={item}>{item}</option>)}
      </FilterSelect>

      <FilterSelect label="Availability" value={availability} onChange={setAvailability}>
        <option value="all">Any time</option>
        {availabilityOptions.map((item) => <option key={item} value={item}>{item}</option>)}
      </FilterSelect>

      <FilterSelect label="Seller level" value={level} onChange={setLevel}>
        <option value="all">Any level</option>
        {levelOptions.map((item) => <option key={item} value={item}>{item}</option>)}
      </FilterSelect>

      <FilterSelect label="Badges" value={badge} onChange={setBadge}>
        <option value="all">Any badge</option>
        {badgeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
      </FilterSelect>

      <FilterSelect label="Minimum rating" value={minRating} onChange={setMinRating}>
        <option value="0">Any rating</option>
        <option value="4.8">4.8 and up</option>
        <option value="4.5">4.5 and up</option>
        <option value="4">4.0 and up</option>
      </FilterSelect>

      <FilterSelect label="Budget" value={maxRate} onChange={setMaxRate}>
        <option value="all">Any budget</option>
        <option value="25">Up to $25/hr</option>
        <option value="50">Up to $50/hr</option>
        <option value="100">Up to $100/hr</option>
      </FilterSelect>

      <button type="button" onClick={clearFilters} className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50">
        Clear all
      </button>
    </>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-slate-900"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </span>
    </label>
  );
}

function ProviderGigCard({ provider, saved, onSave, compact = false }: { provider: ProviderMarketplaceData; saved: boolean; onSave: () => void; compact?: boolean }) {
  return (
    <article className={cn("group w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg", compact && "sm:w-[min(18rem,calc(100vw-2rem))] sm:shrink-0")}>
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <Link href={`/providers/${provider.slug}`} aria-label={`View ${provider.name}`}>
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${provider.heroImage})` }}
          />
        </Link>
        <button
          type="button"
          onClick={onSave}
          aria-label={saved ? `Remove ${provider.name} from saved providers` : `Save ${provider.name}`}
          aria-pressed={saved}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
        >
          <Heart className={cn("h-5 w-5", saved && "fill-red-500 text-red-500")} />
        </button>
        <span className={cn("absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ring-1", cardAccent(provider))}>
          {provider.level}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link href={`/providers/${provider.slug}`} className="truncate text-sm font-bold text-slate-950 hover:text-red-600">
              {provider.name}
            </Link>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{provider.category}</p>
          </div>
          <span className="shrink-0 text-sm font-bold text-slate-950">{formatRate(provider.rate)}<span className="text-xs font-medium text-slate-500">/hr</span></span>
        </div>

        <Link href={`/providers/${provider.slug}`} className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-700 hover:text-slate-950">
          {provider.description}
        </Link>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {provider.badges.slice(0, compact ? 2 : 3).map((item) => (
            <span key={item} className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {item === "Verified ID" ? <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" /> : <Award className="h-3 w-3 shrink-0 text-red-600" />}
              <span className="truncate">{item}</span>
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Star className="h-4 w-4 shrink-0 fill-slate-950 text-slate-950" />
            {provider.rating ? provider.rating.toFixed(1) : "New"} ({provider.reviewCount})
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{provider.city}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0 text-blue-500" />
            <span className="truncate">{provider.availability}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <BriefcaseBusiness className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{provider.completedJobs} jobs</span>
          </span>
        </div>

        <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{provider.responseTime}</span>
          </span>
          <Link href={`/providers/${provider.slug}`} className="shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-red-600">
            View profile
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
      <BadgeCheck className="mx-auto h-10 w-10 text-slate-300" />
      <h2 className="mt-3 text-lg font-bold text-slate-950">No providers match those filters</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">Try a broader keyword, another area, or clear advanced filters to see more profiles.</p>
      <button type="button" onClick={onClear} className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-red-600">
        Clear filters
      </button>
    </div>
  );
}
