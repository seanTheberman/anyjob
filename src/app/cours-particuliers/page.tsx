"use client";

import Image from "next/image";
import Link from "next/link";
import { Users, ThumbsUp, ShieldCheck, BookOpen, GraduationCap } from "lucide-react";
import { EmergencyJobsSection } from "@/components/shared/EmergencyJobsSection";
import { ProviderSlider } from "@/components/ui/provider-slider";
import { ProviderCard } from "@/components/ui/provider-card";

const TUTORING_SUBCATEGORIES = [
    {
        title: "Math Tutoring",
        description: "Professional math tutoring for all levels",
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
        questionnaireSlug: "math-tutoring-cours-particuliers",
    },
    {
        title: "Language Lessons",
        description: "Learn new languages with experienced teachers",
        image: "https://images.unsplash.com/photo-1521791136064-7986c2920216",
        questionnaireSlug: "language-lessons-cours-particuliers",
    },
    {
        title: "Music Lessons",
        description: "Professional music instruction for various instruments",
        image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952",
        questionnaireSlug: "music-lessons-cours-particuliers",
    },
    {
        title: "Art Classes",
        description: "Creative art lessons for all skill levels",
        image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952",
        questionnaireSlug: "art-classes-cours-particuliers",
    },
    {
        title: "Science Tutoring",
        description: "Expert help in physics, chemistry, and biology",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d",
        questionnaireSlug: "science-tutoring-cours-particuliers",
    },
    {
        title: "Computer Skills",
        description: "Learn essential computer and digital skills",
        image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952",
        questionnaireSlug: "computer-skills-cours-particuliers",
    },
];

const TUTORING_PROVIDERS = [
    {
        id: "1",
        slug: "marie-math-tutor",
        name: "Marie",
        category: "Math Tutor",
        rate: 25,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        isNew: true,
        tags: ["Math degree", "10 years experience", "Patient"],
    },
    {
        id: "2",
        slug: "sophie-language-teacher",
        name: "Sophie",
        category: "Language Teacher",
        rate: 30,
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
        isNew: true,
        tags: ["Native speaker", "5 languages", "Interactive method"],
    },
    {
        id: "3",
        slug: "pierre-music-teacher",
        name: "Pierre",
        category: "Music Teacher",
        rate: 35,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        isNew: true,
        tags: ["Conservatory graduate", "Multiple instruments", "Performance"],
    },
    {
        id: "4",
        slug: "lucie-art-teacher",
        name: "Lucie",
        category: "Art Teacher",
        rate: 28,
        image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
        isNew: true,
        tags: ["Fine arts degree", "Creative", "All levels"],
    },
];

export default function CoursParticuliersPage() {
    return (
        <div className="pt-20 pb-20 min-h-screen bg-white dark:bg-gray-950">
            {/* Hero Container */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Hero Banner */}
                <section className="relative w-full h-[20rem] sm:h-[24rem] lg:h-[26rem] rounded-3xl overflow-hidden shadow-xl mt-4">
                    <Image
                        src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b"
                        alt="Tutoring services"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                    <div className="absolute inset-y-0 left-0 p-8 sm:p-10 lg:p-12 flex flex-col justify-center max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <GraduationCap className="w-8 h-8 text-indigo-300" />
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                                Private Tutoring
                            </h1>
                        </div>
                        <p className="text-lg text-white/90 max-w-xl">
                            Qualified teachers for personalized and effective learning
                        </p>
                    </div>

                    {/* Floating UI Elements */}
                    <div className="hidden lg:block absolute top-[15%] right-[10%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        📚 Support
                    </div>
                    <div className="hidden lg:flex absolute top-[35%] right-[15%] bg-indigo-50/95 backdrop-blur-sm rounded-xl p-2 pr-6 items-center gap-3 shadow-2xl overflow-hidden cursor-default border border-indigo-100">
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-2xl">
                            🎵
                        </div>
                        <span className="font-bold text-indigo-900 text-sm">Music</span>
                    </div>
                    <div className="hidden lg:block absolute bottom-[25%] right-[25%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        🎨 Arts
                    </div>
                </section>
            </div>

            {/* Main Content Container */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 space-y-16 lg:space-y-24">

                {/* Tutoring Promo Banner */}
                <section className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1521791136064-7986c2920216"
                        alt="Tutoring special offer"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-indigo-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center p-8 sm:p-12">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white max-w-3xl drop-shadow-md">
                            Subscription Plan: Weekly lessons at -20%*
                        </h2>
                    </div>
                </section>

                {/* Tutoring Services */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                        Available private tutoring
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {TUTORING_SUBCATEGORIES.map((service, index) => (
                            <Link 
                                key={index} 
                                href={`/questionnaire?category=cours-particuliers&subcategory=${service.questionnaireSlug}`}
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
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">
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
                            Our private tutors are available
                        </h2>
                    </div>

                    <ProviderSlider>
                        {TUTORING_PROVIDERS.map((provider) => (
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
                                Check verified reviews from other users to choose your ideal teacher.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ThumbsUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Value for money badge</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Our dedicated badge makes it easy to identify the best value-for-money teachers.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Verified Qualifications</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                All our teachers hold verified degrees and proven experience.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
