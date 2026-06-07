import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrustSection } from "@/components/landing/TrustSection";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "How it works — Anyjob",
    description: "Discover how to book a trusted provider in 3 simple steps on Anyjob.",
};

export default function HowItWorksPage() {
    return (
        <div className="pt-20">
            {/* Hero */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-red-50/50 to-transparent dark:from-red-950/20">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-4">
                        How it{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-indigo-500">
                            works?
                        </span>
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Anyjob connects customers with the best home service providers. Here&apos;s how to benefit.
                    </p>
                </div>
            </section>

            <HowItWorks />

            {/* For Clients Section */}
            <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-red-50/30 to-transparent dark:via-red-950/10">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
                        For Customers
                    </h2>
                    <div className="grid gap-4">
                        {[
                            "Post your need in seconds",
                            "Receive personalized offers from verified providers",
                            "Check reviews, ratings, and portfolios",
                            "Accept the total bid to confirm your provider",
                            "Chat and contact details unlock after confirmation",
                            "Benefit from included insurance coverage",
                            "Leave your review after the mission",
                        ].map((item) => (
                            <div key={item} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <TrustSection />

            {/* CTA */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 text-center">
                <Link href="/search">
                    <Button className="rounded-full px-10 py-6 bg-gradient-to-r from-red-500 to-indigo-600 hover:from-red-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 text-base group">
                        Find a provider
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                </Link>
            </section>
        </div>
    );
}
