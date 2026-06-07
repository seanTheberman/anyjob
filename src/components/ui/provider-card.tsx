"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";

// Define the props for the ProviderCard component
interface ProviderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  provider: {
    id: string;
    slug: string;
    name: string;
    category: string;
    rate: number;
    image?: string | null;
    isNew?: boolean;
    tags: string[];
  };
}

const ProviderCard = React.forwardRef<HTMLDivElement, ProviderCardProps>(
  ({ className, provider, ...props }, ref) => {
    const themeColor = "220 20% 35%"; // A nice blue-gray color that matches the Anyjob theme
    const initials = provider.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
    
    return (
      <div
        ref={ref}
        style={{
          // @ts-ignore - CSS custom properties are valid
          "--theme-color": themeColor,
        } as React.CSSProperties}
        className={cn("group w-full h-full", className)}
        {...props}
      >
        <Link
          href={`/providers/${provider.slug}`}
          className="relative block w-full h-full rounded-2xl overflow-hidden shadow-lg 
                     transition-all duration-500 ease-in-out 
                     group-hover:scale-105 group-hover:shadow-[0_0_60px_-15px_hsl(var(--theme-color)/0.6)]"
          aria-label={`View details for ${provider.name}`}
          style={{
             boxShadow: `0 0 40px -15px hsl(var(--theme-color) / 0.5)` 
          }}
        >
          {/* Background Image with Parallax Zoom */}
          {provider.image ? (
            <div
              className="absolute inset-0 bg-cover bg-center 
                         transition-transform duration-500 ease-in-out group-hover:scale-110"
              style={{ backgroundImage: `url(${provider.image})` }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 via-gray-800 to-gray-950 text-6xl font-extrabold text-white/30">
              {initials || provider.name[0]?.toUpperCase() || "P"}
            </div>
          )}

          {/* Themed Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, hsl(var(--theme-color) / 0.95), hsl(var(--theme-color) / 0.7) 30%, transparent 60%)`,
            }}
          />
          
          {/* Content */}
          <div className="relative flex flex-col justify-end h-full p-5 text-white">
            {/* Name and Rate Row */}
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-2xl font-bold tracking-tight truncate pr-2">
                {provider.name}
              </h3>
              <span className="text-xl font-bold whitespace-nowrap">
                ${provider.rate}<span className="text-sm font-normal text-white/70">/h</span>
              </span>
            </div>
            
            {/* Category */}
            <p className="text-sm text-white/80 font-medium mb-3">{provider.category}</p>

            {/* New Badge if applicable */}
            {provider.isNew && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-orange-500/80 text-white text-xs font-bold">
                  <Star className="w-3 h-3" />
                  New
                </span>
              </div>
            )}

            {/* Tags - show first 2 tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {provider.tags.slice(0, 2).map((tag, i) => (
                <span 
                  key={i} 
                  className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm"
                >
                  {tag.length > 15 ? tag.substring(0, 15) + '...' : tag}
                </span>
              ))}
            </div>

            {/* Explore Button */}
            <div className="flex items-center justify-between bg-[hsl(var(--theme-color)/0.2)] backdrop-blur-md border border-[hsl(var(--theme-color)/0.3)] 
                           rounded-lg px-4 py-3 
                           transition-all duration-300 
                           group-hover:bg-[hsl(var(--theme-color)/0.4)] group-hover:border-[hsl(var(--theme-color)/0.5)]">
              <span className="text-sm font-semibold tracking-wide">View Profile</span>
              <ArrowRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>
    );
  }
);
ProviderCard.displayName = "ProviderCard";

export { ProviderCard };
