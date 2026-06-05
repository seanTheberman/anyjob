"use client";

import Image from "next/image";
import Link from "next/link";
import { Users, ThumbsUp, ShieldCheck, Snowflake, Home, Car, Heart, TreePine } from "lucide-react";
import { EmergencyJobsSection } from "@/components/shared/EmergencyJobsSection";

const WINTER_SUBCATEGORIES = [
    {
        title: "Babysitting",
        description: "A moment of play just for them, for as long as they need it",
        image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74",
        questionnaireSlug: "babysitting-hiver",
    },
    {
        title: "Weekend and vacation care",
        description: "Peaceful and fulfilling holidays for the whole family",
        image: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e",
        questionnaireSlug: "vacation-care-hiver",
    },
    {
        title: "Dog sitting",
        description: "Their routines and activities, even during the winter holidays",
        image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b",
        questionnaireSlug: "dog-sitting-hiver",
    },
    {
        title: "House sitting",
        description: "Take care of your home while you're away on vacation",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
        questionnaireSlug: "house-sitting-hiver",
    },
    {
        title: "Snow removal",
        description: "Clear driveways and walkways for safe winter access",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
        questionnaireSlug: "snow-removal-hiver",
    },
    {
        title: "Winter decorating",
        description: "Transform your space with festive winter decorations",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
        questionnaireSlug: "winter-decorating-hiver",
    },
];

const WINTER_PROVIDERS = [
    {
        id: "1",
        slug: "marie-babysitter",
        name: "Marie",
        category: "Babysitter",
        rate: 15,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
        isNew: true,
        tags: ["Childcare certified", "Patient", "Creative activities"],
    },
    {
        id: "2",
        slug: "pierre-petsitter",
        name: "Pierre",
        category: "Pet-sitter",
        rate: 18,
        image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop",
        isNew: true,
        tags: ["Animal lover", "Experienced", "First aid trained"],
    },
    {
        id: "3",
        slug: "sophie-housekeeper",
        name: "Sophie",
        category: "Housekeeper",
        rate: 20,
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
        isNew: true,
        tags: ["Trustworthy", "Detail-oriented", "Flexible"],
    },
    {
        id: "4",
        slug: "lucas-handyman",
        name: "Lucas",
        category: "Handyman",
        rate: 25,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
        isNew: true,
        tags: ["Winter maintenance", "Quick response", "Reliable"],
    },
];

export default function HiverPage() {
    return (
        <div className="pt-20 pb-20 min-h-screen bg-white dark:bg-gray-950">
            {/* Hero Container - Wider than the rest, but constrained */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Hero Banner */}
                <section className="relative w-full h-[20rem] sm:h-[24rem] lg:h-[26rem] rounded-3xl overflow-hidden shadow-xl mt-4">
                    <Image
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2"
                        alt="Winter services"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                    <div className="absolute inset-y-0 left-0 p-8 sm:p-10 lg:p-12 flex flex-col justify-center max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Snowflake className="w-8 h-8 text-blue-300" />
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                                Winter Services
                            </h1>
                        </div>
                        <p className="text-lg text-white/90 max-w-xl">
                            Enjoy winter with peace of mind with our specialized services
                        </p>
                    </div>

                    {/* Floating UI Elements */}
                    <div className="hidden lg:block absolute top-[15%] right-[10%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        ❄️ Snow Removal
                    </div>
                    <div className="hidden lg:flex absolute top-[35%] right-[15%] bg-blue-50/95 backdrop-blur-sm rounded-xl p-2 pr-6 items-center gap-3 shadow-2xl overflow-hidden cursor-default border border-blue-100">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-2xl">
                            👶
                        </div>
                        <span className="font-bold text-blue-900 text-sm">Childcare</span>
                    </div>
                    <div className="hidden lg:block absolute bottom-[25%] right-[25%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        🏡 House sitting
                    </div>
                </section>
            </div>

            {/* Main Content Container - Narrower to match search page */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 space-y-16 lg:space-y-24">

                {/* Winter Promo Banner */}
                <section className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2"
                        alt="Winter special"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-blue-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center p-8 sm:p-12">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white max-w-3xl drop-shadow-md">
                            Special winter services: -20% on your first booking*
                        </h2>
                    </div>
                </section>

                {/* Winter Services */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                        Available winter services
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {WINTER_SUBCATEGORIES.map((service, index) => (
                            <Link 
                                key={index} 
                                href={`/questionnaire?category=hiver&subcategory=${service.questionnaireSlug}`}
                                className="group cursor-pointer"
                            >
                                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-sm">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                                    {service.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {service.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
                <EmergencyJobsSection />

                {/* Providers Grid */}
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">
                            Our winter providers are ready to help
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {WINTER_PROVIDERS.map((provider) => (
                            <Link
                                key={provider.id}
                                href={`/providers/${provider.slug}`}
                                className="group cursor-pointer flex flex-col border border-transparent hover:border-gray-200 rounded-2xl p-1 transition-colors"
                            >
                                <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 shadow-sm">
                                    <Image
                                        src={provider.image}
                                        alt={provider.name}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0"></div>
                                </div>

                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {provider.name}
                                    </h3>
                                    <span className="font-bold text-gray-900 dark:text-white text-lg">
                                        {provider.rate} $<span className="text-xs font-normal text-gray-500">/h</span>
                                    </span>
                                </div>

                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{provider.category}</p>

                                {provider.isNew && (
                                    <div className="mb-3">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold font-mono tracking-wider">
                                            ✨ New
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center flex-wrap gap-1.5 mt-auto">
                                    {provider.tags.map((tag, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800/80 dark:text-gray-300 text-[11px] font-medium whitespace-nowrap">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Selection Criteria / Trust Footer */}
                <section className="pt-16 pb-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                            Selection Criteria.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <Users className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Member reviews</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Check verified reviews from other users to choose your ideal winter service provider.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ThumbsUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Value for money badge</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Our dedicated badge makes it easy to identify the best value-for-money providers in your area.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Verified Identity</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                All our providers undergo a full identity verification process to guarantee absolute safety.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
