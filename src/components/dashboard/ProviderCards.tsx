"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Sparkles } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  photo: string;
  rate: number;
  currency: string;
  unit: string;
  rating: number;
  reviewCount: number;
  location: string;
  distance: string;
  isNew: boolean;
}

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <Link
      href={`/providers/${provider.id}`}
      className="group block bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all"
    >
      {/* Photo */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={provider.photo}
          alt={provider.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
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
          {provider.rate} {provider.currency}/{provider.unit}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(provider.rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">({provider.reviewCount})</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>{provider.location}</span>
          <span className="text-gray-400">•</span>
          <span>{provider.distance}</span>
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
