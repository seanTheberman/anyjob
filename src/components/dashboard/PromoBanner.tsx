"use client";

import { X, ArrowRight, Flag } from "lucide-react";
import Link from "next/link";

interface PromoBannerProps {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  bgColor?: string;
  onClose?: () => void;
}

export function PromoBanner({
  title,
  description,
  ctaText,
  ctaHref,
  bgColor = "bg-blue-500",
  onClose,
}: PromoBannerProps) {
  return (
    <div className={`relative ${bgColor} rounded-2xl p-6 mb-8 text-white overflow-hidden`}>
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-md">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-white/90 mb-4">{description}</p>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          {ctaText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Decorative elements */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="w-24 h-24 bg-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Flag className="w-12 h-12 text-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
