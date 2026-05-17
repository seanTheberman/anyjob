"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const POPULAR_SERVICES = [
    {
        id: "1",
        name: "Furniture Assembly",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
        startingPrice: 49,
        categorySlug: "bricolage",
        subcategorySlug: "furniture-assembly-bricolage",
    },
    {
        id: "2",
        name: "Mount Art or Shelves",
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
        startingPrice: 65,
        categorySlug: "bricolage",
        subcategorySlug: "mount-art-bricolage",
    },
    {
        id: "3",
        name: "Mount a TV",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
        startingPrice: 69,
        categorySlug: "bricolage",
        subcategorySlug: "mount-tv-bricolage",
    },
    {
        id: "4",
        name: "Help Moving",
        image: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b",
        startingPrice: 67,
        categorySlug: "demenagement",
        subcategorySlug: "help-moving-demenagement",
    },
    {
        id: "5",
        name: "Home & Apartment Cleaning",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
        startingPrice: 49,
        categorySlug: "menage",
        subcategorySlug: "home-cleaning-menage",
    },
    {
        id: "6",
        name: "Minor Plumbing Repairs",
        image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7",
        startingPrice: 74,
        categorySlug: "bricolage",
        subcategorySlug: "plumbing-bricolage",
    },
    {
        id: "7",
        name: "Electrical Help",
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4",
        startingPrice: 69,
        categorySlug: "bricolage",
        subcategorySlug: "electrical-bricolage",
    },
    {
        id: "8",
        name: "Heavy Lifting",
        image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf",
        startingPrice: 61,
        categorySlug: "demenagement",
        subcategorySlug: "heavy-lifting-demenagement",
    },
];

export function PopularServices() {
    const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);

    return (
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <div className="mb-10 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Popular Projects
                    </h2>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {POPULAR_SERVICES.map((service) => (
                        <Link
                            key={service.id}
                            href={`/${service.categorySlug}?subcategory=${service.subcategorySlug}`}
                            onClick={() => setPendingServiceId(service.id)}
                            aria-busy={pendingServiceId === service.id}
                            className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md aria-busy:pointer-events-none aria-busy:opacity-85"
                        >
                            {pendingServiceId === service.id && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    </div>
                                </div>
                            )}
                            {/* Image */}
                            <div className="aspect-[4/3] relative overflow-hidden">
                                <Image
                                    src={service.image}
                                    alt={service.name}
                                    width={400}
                                    height={300}
                                    quality={80}
                                    priority={service.id === "1"}
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                                    {service.name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Projects starting at ${service.startingPrice}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
