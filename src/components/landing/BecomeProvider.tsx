"use client";

import { ArrowRight, TrendingUp, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BecomeProvider() {
    return (
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] bg-red-600 p-8 sm:p-12 lg:p-16 shadow-2xl shadow-red-600/20">
                    {/* Decorative shapes */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(127,29,29,0.42),transparent_42%)]" />
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-red-700/25" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-900/20 rounded-full translate-y-1/2 -translate-x-1/4" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        {/* Text side */}
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6">
                                <TrendingUp className="w-3.5 h-3.5 text-green-300" />
                                <span className="text-xs sm:text-sm text-white/90 font-medium">
                                    Earn $1,500/month on average
                                </span>
                            </div>

                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                                Become a provider on{" "}
                                <span className="text-red-100">
                                    Anyjob
                                </span>
                            </h2>

                            <p className="text-base sm:text-lg text-white/70 mb-8 max-w-lg">
                                Sign up for free, create your profile, and start 
                                receiving requests from clients in your area.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <Button className="bg-white text-red-700 hover:bg-red-50 rounded-xl px-8 py-6 text-sm sm:text-base font-bold shadow-lg group">
                                    Become a provider
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-white/85 hover:text-white hover:bg-white/10 rounded-xl px-8 py-6 text-sm sm:text-base font-medium border border-white/25"
                                >
                                    Learn more
                                </Button>
                            </div>
                        </div>

                        {/* Stats side */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                {
                                    icon: Users,
                                    value: "388K+",
                                    label: "Active providers",
                                },
                                {
                                    icon: TrendingUp,
                                    value: "1.2M+",
                                    label: "Completed tasks",
                                },
                                {
                                    icon: Clock,
                                    value: "< 2h",
                                    label: "Average response time",
                                },
                                {
                                    icon: ArrowRight,
                                    value: "0€",
                                    label: "Sign up fees",
                                },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="bg-white/12 backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 text-center"
                                >
                                    <stat.icon className="w-5 h-5 text-white/50 mx-auto mb-2" />
                                    <p className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                                        {stat.value}
                                    </p>
                                    <p className="text-[11px] sm:text-xs text-white/50">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
