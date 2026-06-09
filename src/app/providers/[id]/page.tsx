import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";

import { ProviderPackageCard } from "./ProviderPackageCard";
import { ProviderProfileLayout } from "@/components/providers/ProviderProfileLayout";
import type { ProviderMarketplaceData } from "@/lib/real-providers";
import { getProviderProfileById } from "@/lib/real-providers";

export const dynamic = "force-dynamic";

function formatRating(value: number) {
  return value > 0 ? value.toFixed(1) : "New";
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function MediaTile({ image, label, className = "" }: { image: string | null; label: string; className?: string }) {
  if (!image) {
    return (
      <div className={`relative flex items-center justify-center bg-slate-100 ${className}`} aria-label={label}>
        <Image
          src="/anyjoblogo-removebg-preview.png"
          alt=""
          width={150}
          height={55}
          className="h-14 w-auto opacity-50"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`bg-slate-100 bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url(${image})` }}
    />
  );
}

function formatRate(value: number) {
  if (!value) return "Rate not set";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function RelatedProviderCard({ provider }: { provider: ProviderMarketplaceData }) {
  return (
    <Link href={`/providers/${provider.id}`} className="group block min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <MediaTile image={provider.heroImage} label={`${provider.name} service preview`} className="aspect-[16/10] w-full transition-transform duration-300 group-hover:scale-[1.02]" />
      <div className="p-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-bold text-slate-950">{provider.name}</span>
          {provider.level ? <span className="shrink-0 text-xs font-bold text-slate-600">{provider.level}</span> : null}
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-700">{provider.description || provider.category}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-950">
            <Star className="h-4 w-4 fill-slate-950 text-slate-950" />
            {provider.rating ? provider.rating.toFixed(1) : "New"}
            <span className="font-medium text-slate-500">({provider.reviewCount})</span>
          </span>
          <span className="text-xs text-slate-500">From <strong className="text-sm text-slate-950">{formatRate(provider.rate)}</strong></span>
        </div>
      </div>
    </Link>
  );
}

export default async function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const normalizedId = decodeURIComponent(id).replace(/\.$/, "");
  const provider = await getProviderProfileById(normalizedId);
  const initials = initialsFor(provider.name);
  const bookingHref = `/questionnaire?provider=${encodeURIComponent(provider.id)}&providerName=${encodeURIComponent(provider.name)}&providerCategory=${encodeURIComponent(provider.categorySlug)}`;
  const rating = formatRating(provider.rating);
  const reviewLabel = provider.reviewCount === 1 ? "review" : "reviews";
  const gigTitle = `${provider.category} services by ${provider.name}`;
  const gallery = provider.photos.length ? provider.photos : [provider.heroImage];
  const maxReviewCount = Math.max(...Object.values(provider.reviewDistribution), 0);
  const packageCard = (
    <ProviderPackageCard
      bookingHref={bookingHref}
      providerName={provider.name}
      category={provider.category}
      baseRate={provider.rate}
      responseTime={provider.responseTime}
    />
  );

  return (
    <ProviderProfileLayout>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex min-w-0 items-center gap-2 overflow-hidden text-xs font-semibold text-slate-500">
            <Link href="/search" className="shrink-0 hover:text-slate-950">Find a Provider</Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{provider.category}</span>
          </nav>
        </div>
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,46rem)_24rem] lg:gap-16 lg:px-8 lg:py-8">
        <div className="lg:hidden">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <MediaTile image={provider.heroImage} label={`${provider.name} service preview`} className="aspect-[4/3] w-full" />
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="mt-5 text-[1.75rem] font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:mt-0">
            {gigTitle}
          </h1>

          <div className="mt-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <Link href="#seller" className="flex min-w-0 items-center gap-2">
              {provider.avatar ? (
                <span
                  className="h-9 w-9 shrink-0 rounded-full bg-slate-100 bg-cover bg-center"
                  style={{ backgroundImage: `url(${provider.avatar})` }}
                  aria-label={provider.name}
                />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                  {initials || "P"}
                </span>
              )}
              <span className="min-w-0 truncate font-bold text-slate-950">{provider.name}</span>
            </Link>
            <span className="hidden h-4 w-px bg-slate-300 sm:block" />
            {provider.level ? (
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
              {provider.level}
            </span>
            ) : null}
            <span className="hidden h-4 w-px bg-slate-300 sm:block" />
            <span className="inline-flex items-center gap-1 font-bold text-slate-950">
              <Star className="h-4 w-4 fill-slate-950 text-slate-950" />
              {rating}
              <span className="font-medium text-slate-500">({provider.reviewCount} {reviewLabel})</span>
            </span>
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-lg border border-slate-200 lg:block">
            <MediaTile image={provider.heroImage} label={`${provider.name} service preview`} className="aspect-video w-full" />
          </div>

          <div className="mt-3 hidden grid-cols-5 gap-3 lg:grid">
            {gallery.slice(0, 5).map((photo, index) => (
              <MediaTile
                key={`${photo}-${index}`}
                image={photo}
                label={`${provider.name} gallery ${index + 1}`}
                className="aspect-video rounded border border-slate-200"
              />
            ))}
          </div>

          <div className="mt-6 lg:hidden">{packageCard}</div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            {packageCard}
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-slate-950">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Booking starts safely
              </div>
              <p className="mt-2 leading-5">Share your job details first. You only confirm after the scope is clear.</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,46rem)_24rem] lg:gap-16 lg:px-8">
        <div className="min-w-0 space-y-10">
          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-950">About this gig</h2>
            {provider.biography ? (
              <p className="mt-4 text-base leading-7 text-slate-700">{provider.biography}</p>
            ) : (
              <p className="mt-4 text-base leading-7 text-slate-500">No public bio has been added yet.</p>
            )}
            {provider.highlights.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {provider.highlights.map((item) => (
                <div key={item} className="flex gap-2 text-sm font-semibold text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            ) : null}
          </section>

          {provider.services.length ? (
          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-950">What this provider offers</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {provider.services.map((service) => (
                <span key={service} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                  {service}
                </span>
              ))}
            </div>
          </section>
          ) : null}

          <section id="seller" className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-950">About the seller</h2>
            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex gap-4">
                {provider.avatar ? (
                  <span
                    className="h-20 w-20 shrink-0 rounded-full bg-slate-100 bg-cover bg-center"
                    style={{ backgroundImage: `url(${provider.avatar})` }}
                    aria-label={provider.name}
                  />
                ) : (
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xl font-bold text-white">
                    {initials || "P"}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-slate-950">{provider.name}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-600">{provider.category}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-slate-950 text-slate-950" />
                      {rating}
                    </span>
                    <span>{provider.completedJobs} completed jobs</span>
                    {provider.experience ? <span>{provider.experience}</span> : null}
                  </div>
                  <Link
                    href={`/dashboard/mail?provider=${encodeURIComponent(provider.name)}`}
                    className="mt-4 inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-50"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contact me
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-500">From</p>
                  <p className="mt-1 font-bold text-slate-950">{provider.location}</p>
                </div>
                {provider.responseTime ? (
                <div>
                  <p className="font-semibold text-slate-500">Avg. response time</p>
                  <p className="mt-1 font-bold text-slate-950">{provider.responseTime}</p>
                </div>
                ) : null}
                {provider.availability ? (
                <div>
                  <p className="font-semibold text-slate-500">Availability</p>
                  <p className="mt-1 font-bold text-slate-950">{provider.availability}</p>
                </div>
                ) : null}
                <div>
                  <p className="font-semibold text-slate-500">Starting rate</p>
                  <p className="mt-1 font-bold text-slate-950">{provider.hourlyRate}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-950">FAQ</h2>
            <div className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
              {[
                ["How do I book this provider?", "Choose a package, continue to the request flow, and share the job details before confirming."],
                ["Can I contact the provider first?", "Yes. Use the contact button to ask questions before sending a booking request."],
                ["Are reviews verified?", "Reviews come from completed AnyJob bookings tied to real client requests."],
              ].map(([question, answer]) => (
                <details key={question} className="group p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-950">
                    {question}
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-950">Reviews</h2>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-950">
                <Star className="h-4 w-4 fill-slate-950 text-slate-950" />
                {rating}
              </span>
            </div>
            <div className="mt-5 grid gap-6 sm:grid-cols-[10rem_1fr]">
              <div>
                <p className="text-5xl font-bold text-slate-950">{rating}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{provider.reviewCount} {reviewLabel}</p>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                    <span className="w-10">{stars} star</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-slate-950"
                        style={{ width: maxReviewCount ? `${((provider.reviewDistribution[stars] || 0) / maxReviewCount) * 100}%` : "0%" }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 space-y-5">
              {provider.writtenReviews.length ? provider.writtenReviews.map((review) => (
                <article key={review.id} className="border-t border-slate-200 pt-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                      {review.reviewerInitials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="text-sm font-bold text-slate-950">{review.reviewerName}</h3>
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-950">
                          <Star className="h-4 w-4 fill-slate-950 text-slate-950" />
                          {review.rating.toFixed(1)}
                        </span>
                        <span className="text-xs font-medium text-slate-500">{review.createdAt}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{review.comment}</p>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  No written reviews have been added in Supabase yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              {provider.location}
            </div>
            {provider.responseTime ? (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              {provider.responseTime}
            </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-slate-400" />
              Save this provider from the marketplace list.
            </div>
          </div>
        </aside>
      </section>

      {provider.relatedProviders.length ? (
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">More providers for {provider.category}</h2>
                <p className="mt-1 text-sm text-slate-600">Possible matches doing similar work.</p>
              </div>
              <Link href={`/search?cat=${provider.categorySlug}`} className="hidden text-sm font-bold text-slate-950 underline-offset-4 hover:underline sm:inline">
                See more
              </Link>
            </div>
            <div className="-mx-4 flex max-w-[100vw] gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:max-w-none sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
              {provider.relatedProviders.map((relatedProvider) => (
                <div key={relatedProvider.id} className="w-72 shrink-0 sm:w-auto">
                  <RelatedProviderCard provider={relatedProvider} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </ProviderProfileLayout>
  );
}
