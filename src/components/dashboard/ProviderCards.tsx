"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";

interface Provider {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  rate: number;
  category: string;
  isNew?: boolean;
}

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const initials = provider.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <Link
      href={`/providers/${provider.slug}`}
      className="group block bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all"
    >
      {/* Photo */}
      <div className="relative h-48 overflow-hidden">
        {provider.image ? (
          <Image
            src={provider.image}
            alt={provider.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 text-4xl font-extrabold text-gray-500">
            {initials || provider.name[0]?.toUpperCase() || "P"}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{provider.name}</h3>
          {provider.isNew && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
              <Sparkles className="w-3 h-3" />
              New
            </span>
          )}
        </div>

        {/* Rate */}
        <p className="text-lg font-bold text-gray-900 mb-1">
          ${provider.rate}/h
        </p>

        {/* Category */}
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>{provider.category}</span>
        </div>

        {/* See more button */}
        <button className="mt-3 w-full py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
          See more
        </button>
      </div>
    </Link>
  );
}

interface ProviderSectionProps {
  title: string;
  providers: Provider[];
}

export function ProviderSection({ title, providers }: ProviderSectionProps) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {providers.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
  );
}
