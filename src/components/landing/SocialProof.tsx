"use client";

import { Users, Star, Shield } from "lucide-react";

const STATS = [
    {
        icon: Users,
        value: "388 000+",
        label: "rated and qualified providers",
        color: "text-red-500",
        bgColor: "bg-red-500/10",
    },
    {
        icon: Star,
        value: "4.8/5",
        label: "average satisfaction score",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
    },
    {
        icon: Shield,
        value: "100%",
        label: "of tasks covered by insurance",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
    },
];

export function SocialProof() {
    return (
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                    {STATS.map((stat, i) => (
                        <div
                            key={stat.label}
                            className="flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm"
                        >
                            <div
                                className={`w-14 h-14 rounded-2xl ${stat.bgColor} ${stat.color} flex items-center justify-center mb-4`}
                            >
                                <stat.icon className="w-7 h-7" />
                            </div>
                            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-1">
                                {stat.value}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
