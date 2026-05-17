import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing — Anyjob",
    description: "Discover our subscription plans to get the most out of the Anyjob platform.",
};

const PLANS = [
    {
        name: "Free",
        price: "$0",
        period: "",
        description: "To get started on Anyjob",
        features: [
            "Access to all providers",
            "Book up to 3 tasks/month",
            "Insurance coverage included",
            "In-app messaging",
            "Reviews and ratings",
        ],
        cta: "Start for free",
        popular: false,
        gradient: "from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900",
        buttonClass: "bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800",
    },
    {
        name: "Serenity Pass",
        price: "$9.90",
        period: "/month",
        description: "For regular users",
        features: [
            "Unlimited tasks",
            "Booking token shown before you confirm",
            "Priority matching",
            "Dedicated customer support",
            "Extended coverage",
            "Free cancellation",
            "Premium providers",
        ],
        cta: "Try for free",
        popular: true,
        gradient: "from-red-500 to-indigo-600",
        buttonClass:
            "bg-gradient-to-r from-red-500 to-indigo-600 hover:from-red-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25",
    },
    {
        name: "Annual Serenity Pass",
        price: "$79",
        period: "/year",
        description: "Save 34% compared to monthly",
        features: [
            "Everything in Serenity Pass",
            "Save $39.80/year",
            "Early access to new features",
            "Loyal user badge",
        ],
        cta: "Choose annual",
        popular: false,
        gradient: "from-purple-500 to-pink-500",
        buttonClass:
            "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25",
    },
];

export default function PricingPage() {
    return (
        <div className="pt-20">
            {/* Hero */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Transparent{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-indigo-500">
                            pricing
                        </span>
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Choose the plan that suits you. Start for free and
                        upgrade to Serenity Pass whenever you want.
                    </p>
                </div>
            </section>

            {/* Plans */}
            <section className="pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border ${plan.popular
                                    ? "border-red-200 dark:border-red-800 shadow-xl shadow-blue-500/10 scale-[1.02]"
                                    : "border-gray-100 dark:border-gray-800 shadow-sm"
                                } p-6 sm:p-8 overflow-hidden`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-indigo-600" />
                            )}
                            {plan.popular && (
                                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-indigo-600 text-white border-0 text-[10px]">
                                    <Star className="w-3 h-3 mr-0.5 fill-white" />
                                    Popular
                                </Badge>
                            )}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {plan.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                                {plan.description}
                            </p>
                            <div className="mb-6">
                                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                                    {plan.price}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {plan.period}
                                </span>
                            </div>
                            <Button
                                className={`w-full rounded-xl py-5 font-semibold text-sm mb-6 ${plan.buttonClass}`}
                            >
                                {plan.cta}
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                            <ul className="space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2.5">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
