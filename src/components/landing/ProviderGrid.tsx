"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProviderCard } from "@/components/ui/provider-card";
import type { ProviderCardData } from "@/lib/real-providers";

export function ProviderGrid() {
    const [providers, setProviders] = useState<ProviderCardData[]>([]);

    useEffect(() => {
        let isMounted = true;

        fetch("/api/providers")
            .then((response) => (response.ok ? response.json() : { providers: [] }))
            .then((data) => {
                if (isMounted) setProviders(Array.isArray(data.providers) ? data.providers.slice(0, 4) : []);
            })
            .catch(() => {
                if (isMounted) setProviders([]);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (providers.length === 0) return null;

    return (
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-red-50/30 to-transparent dark:via-red-950/10">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10 sm:mb-14">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                        Our best service providers
                    </h2>
                    <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Approved professionals from real AnyJob provider profiles
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                    {providers.map((provider) => (
                        <ProviderCard key={provider.id} provider={provider} />
                    ))}
                </div>

                <div className="text-center mt-10 sm:mt-12">
                    <Link
                        href="/search"
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 px-8 py-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-900"
                    >
                        View all service providers
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
