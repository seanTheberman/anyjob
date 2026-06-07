"use client";

import Image from "next/image";

const STEPS = [
    {
        number: "1",
        title: "Choose a Tasker by price, skills, and reviews.",
        bgColor: "bg-indigo-100",
        textColor: "text-indigo-600",
    },
    {
        number: "2",
        title: "Schedule a Tasker as early as today.",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-600",
    },
    {
        number: "3",
        title: "Accept the total bid, unlock chat, then complete the job.",
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-600",
    },
];

export function HowItWorks() {
    return (
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-yellow-50">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Steps */}
                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                            How it works
                        </h2>

                        <div className="space-y-6">
                            {STEPS.map((step) => (
                                <div key={step.number} className="flex items-start gap-4">
                                    {/* Number Circle */}
                                    <div
                                        className={`w-10 h-10 ${step.bgColor} ${step.textColor} rounded-full flex items-center justify-center font-semibold text-sm shrink-0`}
                                    >
                                        {step.number}
                                    </div>
                                    {/* Text */}
                                    <p className="text-gray-700 text-sm leading-relaxed pt-2">
                                        {step.title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right - Image */}
                    <div className="relative">
                        <div className="aspect-[4/3] relative rounded-xl overflow-hidden">
                            <Image
                                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop"
                                alt="How it works"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
