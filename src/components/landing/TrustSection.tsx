"use client";

import { ShieldCheck, BadgeCheck, Undo2 } from "lucide-react";

const TRUST_ITEMS = [
    {
        icon: ShieldCheck,
        title: "Insurance Coverage",
        description:
            "All tasks booked via Anyjob are covered by our professional liability insurance.",
        gradient: "from-emerald-500 to-teal-500",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        iconColor: "text-emerald-500",
    },
    {
        icon: BadgeCheck,
        title: "Verified Providers",
        description:
            "Each provider is evaluated and verified. Check reviews, ratings and trust badges before booking.",
        gradient: "from-red-500 to-indigo-500",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        iconColor: "text-red-500",
    },
    {
        icon: Undo2,
        title: "Satisfaction Guaranteed",
        description:
            "If the service doesn't meet your expectations, we'll refund you in full. No conditions.",
        gradient: "from-amber-500 to-orange-500",
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
        iconColor: "text-amber-500",
    },
];

export function TrustSection() {
    return (
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-full px-4 py-1.5 mb-4">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Trust & Security
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
                        Book with{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                            confidence
                        </span>
                    </h2>
                    <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                        Your safety and satisfaction are our top priorities
                    </p>
                </div>

                {/* Trust Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {TRUST_ITEMS.map((item, i) => (
                        <div
                            key={item.title}
                            className="relative bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                        >
                            {/* Gradient accent border top */}
                            <div
                                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient}`}
                            />

                            {/* Icon */}
                            <div
                                className={`w-14 h-14 sm:w-16 sm:h-16 ${item.bgColor} rounded-2xl flex items-center justify-center mb-5 sm:mb-6`}
                            >
                                <item.icon
                                    className={`w-7 h-7 sm:w-8 sm:h-8 ${item.iconColor}`}
                                />
                            </div>

                            {/* Content */}
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
