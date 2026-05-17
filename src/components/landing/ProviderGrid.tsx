"use client";

import { Star, MapPin, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/shared/CategoryIcon";

const MOCK_PROVIDERS = [
    {
        id: "1",
        name: "Marie D.",
        avatar: "👩‍🔧",
        rating: 4.98,
        reviewCount: 319,
        category: "menage",
        categoryLabel: "Housekeeper",
        hourlyRate: 22,
        city: "Paris",
        tags: ["Property respect", "Impeccable result", "Dynamic"],
        isTop: true,
        isPro: true,
    },
    {
        id: "2",
        name: "Karim B.",
        avatar: "👨‍🔧",
        rating: 4.96,
        reviewCount: 1898,
        category: "demenagement",
        categoryLabel: "Mover",
        hourlyRate: 25,
        city: "Lyon",
        tags: ["Responsive and flexible", "Fast and reliable"],
        isTop: true,
        isPro: false,
    },
    {
        id: "3",
        name: "Thomas L.",
        avatar: "🧑‍💼",
        rating: 4.95,
        reviewCount: 62,
        category: "jardinage",
        categoryLabel: "Gardener",
        hourlyRate: 18,
        city: "Marseille",
        tags: ["Neat work", "Property respect"],
        isTop: true,
        isPro: false,
    },
    {
        id: "4",
        name: "Aïssa M.",
        avatar: "👨‍🏭",
        rating: 4.96,
        reviewCount: 767,
        category: "bricolage",
        categoryLabel: "Handyman",
        hourlyRate: 21,
        city: "Bordeaux",
        tags: ["Organized and methodical", "Neat work"],
        isTop: true,
        isPro: true,
    },
];

export function ProviderGrid() {
    return (
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-red-50/30 to-transparent dark:via-red-950/10">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-10 sm:mb-14">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                        Our best service providers
                    </h2>
                    <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Verified professionals, rated and recommended by the community
                    </p>
                </div>

                {/* Provider Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                    {MOCK_PROVIDERS.map((provider) => (
                        <div
                            key={provider.id}
                            className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
                        >
                            {/* Top Badge */}
                            {provider.isTop && (
                                <div className="absolute top-3 left-3 z-10">
                                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-[10px] font-semibold px-2 py-0.5 shadow-md">
                                        ⭐ Top provider
                                    </Badge>
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="p-5 sm:p-6">
                                {/* Avatar & Info */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-indigo-100 dark:from-red-900/50 dark:to-indigo-900/50 flex items-center justify-center text-2xl shadow-sm shrink-0">
                                        {provider.avatar}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                                {provider.name}
                                            </h3>
                                            {provider.isPro && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[9px] px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                                                >
                                                    PRO
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <CategoryIcon
                                                slug={provider.category}
                                                className="w-3 h-3 text-gray-400"
                                            />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {provider.categoryLabel}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, j) => (
                                            <Star
                                                key={j}
                                                className={`w-3.5 h-3.5 ${j < Math.floor(provider.rating)
                                                    ? "text-amber-400 fill-amber-400"
                                                    : "text-gray-200 dark:text-gray-700"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {provider.rating}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        ({provider.reviewCount} reviews)
                                    </span>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {provider.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800"
                                        >
                                            ✓ {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Price & Location */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <MapPin className="w-3 h-3" />
                                        <span className="text-xs">{provider.city}</span>
                                    </div>
                                    <div>
                                        <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                                            ${provider.hourlyRate}
                                        </span>
                                        <span className="text-xs text-gray-400">/h</span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                                <Button className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
                                    To book
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* View All */}
                <div className="text-center mt-10 sm:mt-12">
                    <Button
                        variant="outline"
                        className="rounded-full px-8 py-4 border-gray-200 dark:border-gray-700 text-sm font-semibold"
                    >
                        View all service providers
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
