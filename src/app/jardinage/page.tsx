"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users, ThumbsUp, ShieldCheck, TreePine, Flower2, Scissors, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderSlider } from "@/components/ui/provider-slider";
import { ProviderCard } from "@/components/ui/provider-card";

const GARDENING_SUBCATEGORIES = [
    {
        title: "Lawn Mowing",
        description: "Professional lawn care and maintenance for a perfect green space",
        image: "https://images.unsplash.com/photo-1585435557342-76b6bde65e06",
        questionnaireSlug: "lawn-mowing-jardinage",
    },
    {
        title: "Garden Design",
        description: "Transform your outdoor space with professional garden design",
        image: "https://images.unsplash.com/photo-1593696140826-c58b021acf8b",
        questionnaireSlug: "garden-design-jardinage",
    },
    {
        title: "Tree Pruning",
        description: "Expert tree care and pruning for healthy growth",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
        questionnaireSlug: "tree-pruning-jardinage",
    },
    {
        title: "Hedge Trimming",
        description: "Perfect hedge maintenance for clean, beautiful boundaries",
        image: "https://images.unsplash.com/photo-1585435557342-76b6bde65e06",
        questionnaireSlug: "hedge-trimming-jardinage",
    },
    {
        title: "Planting & Flowers",
        description: "Seasonal planting and flower bed maintenance",
        image: "https://images.unsplash.com/photo-1585435557342-76b6bde65e06",
        questionnaireSlug: "planting-flowers-jardinage",
    },
    {
        title: "Garden Cleanup",
        description: "Seasonal garden cleanup and waste removal",
        image: "https://images.unsplash.com/photo-1593696140826-c58b021acf8b",
        questionnaireSlug: "garden-cleanup-jardinage",
    },
];

const GARDENING_PROVIDERS = [
    {
        id: "1",
        slug: "marc-gardener",
        name: "Marc",
        category: "Gardener",
        rate: 18,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        isNew: true,
        tags: ["10 years experience", "Organic methods", "Seasonal expert"],
    },
    {
        id: "2",
        slug: "sophie-landscaper",
        name: "Sophie",
        category: "Landscaper",
        rate: 25,
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
        isNew: true,
        tags: ["Design specialist", "Creative solutions", "Sustainable"],
    },
    {
        id: "3",
        slug: "pierre-arborist",
        name: "Pierre",
        category: "Arborist",
        rate: 30,
        image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
        isNew: true,
        tags: ["Tree expert", "Certified", "Safety first"],
    },
    {
        id: "4",
        slug: "marie-gardener",
        name: "Marie",
        category: "Garden Maintenance",
        rate: 16,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        isNew: true,
        tags: ["Detail-oriented", "Reliable", "Eco-friendly"],
    },
];

export default function JardinagePage() {
    return (
        <div className="pt-40 pb-20 min-h-screen bg-white dark:bg-gray-950">
            {/* Hero Container */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Hero Banner */}
                <section className="relative w-full h-[20rem] sm:h-[24rem] lg:h-[26rem] rounded-3xl overflow-hidden shadow-xl mt-4">
                    <Image
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2"
                        alt="Gardening services"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                    <div className="absolute inset-y-0 left-0 p-8 sm:p-10 lg:p-12 flex flex-col justify-center max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <TreePine className="w-8 h-8 text-green-300" />
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                                Gardening Services
                            </h1>
                        </div>
                        <p className="text-lg text-white/90 max-w-xl">
                            Garden experts to transform and maintain your outdoor space
                        </p>
                    </div>

                    {/* Floating UI Elements */}
                    <div className="hidden lg:block absolute top-[15%] right-[10%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        🌿 Mowing
                    </div>
                    <div className="hidden lg:flex absolute top-[35%] right-[15%] bg-green-50/95 backdrop-blur-sm rounded-xl p-2 pr-6 items-center gap-3 shadow-2xl overflow-hidden cursor-default border border-green-100">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-2xl">
                            🌳
                        </div>
                        <span className="font-bold text-green-900 text-sm">Pruning</span>
                    </div>
                    <div className="hidden lg:block absolute bottom-[25%] right-[25%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        🌺 Gardening
                    </div>
                </section>
            </div>

            {/* Main Content Container */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 space-y-16 lg:space-y-24">

                {/* Gardening Promo Banner */}
                <section className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2"
                        alt="Gardening special offer"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-green-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center p-8 sm:p-12">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white max-w-3xl drop-shadow-md">
                            Spring Package: Full garden cleanup + planting at -15%*
                        </h2>
                    </div>
                </section>

                {/* Gardening Services */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                        Available gardening services
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {GARDENING_SUBCATEGORIES.map((service, index) => (
                            <Link 
                                key={index} 
                                href={`/questionnaire?category=jardinage&subcategory=${service.questionnaireSlug}`}
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
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-green-600 transition-colors">
                                    {service.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {service.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Emergency Services Banner */}
                <section className="relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1593696140826-c58b021acf8b"
                        alt="Emergency garden services"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 object-center"
                    />
                    <div className="absolute inset-0 bg-red-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent"></div>

                    <div className="absolute inset-0 flex flex-col justify-center p-8 sm:p-12 max-w-2xl">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 drop-shadow-md">
                            Post-storm emergency?
                        </h2>
                        <p className="text-sm sm:text-base text-gray-100 mb-6 font-medium text-red-50">
                            Quick intervention to clean and secure your garden after severe weather.
                        </p>
                        <Button className="w-fit rounded-full bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 shadow-xl">
                            Contact emergency <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </section>

                {/* Providers Grid */}
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">
                            Our professional gardeners are available
                        </h2>
                    </div>

                    <ProviderSlider>
                        {GARDENING_PROVIDERS.map((provider) => (
                            <ProviderCard key={provider.id} provider={provider} />
                        ))}
                    </ProviderSlider>
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
                                Check verified reviews from other users to choose your ideal gardener.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ThumbsUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Value for money badge</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Our dedicated badge makes it easy to identify the best value-for-money gardeners in your area.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Professional Equipment</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                All our gardeners use professional equipment and respect safety standards.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
