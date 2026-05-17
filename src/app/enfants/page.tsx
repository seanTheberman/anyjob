"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users, ThumbsUp, ShieldCheck, Baby, Heart, BookOpen, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderSlider } from "@/components/ui/provider-slider";
import { ProviderCard } from "@/components/ui/provider-card";

const CHILDREN_SUBCATEGORIES = [
    {
        title: "Babysitting",
        description: "Professional childcare for your peace of mind",
        image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74",
        questionnaireSlug: "babysitting-enfants",
    },
    {
        title: "Tutoring",
        description: "Educational support and homework help",
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
        questionnaireSlug: "tutoring-enfants",
    },
    {
        title: "After School Care",
        description: "Supervised care after school hours",
        image: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e",
        questionnaireSlug: "after-school-enfants",
    },
    {
        title: "Weekend Care",
        description: "Reliable weekend childcare services",
        image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b",
        questionnaireSlug: "weekend-enfants",
    },
    {
        title: "Holiday Care",
        description: "Full-day care during school holidays",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        questionnaireSlug: "holiday-enfants",
    },
    {
        title: "Educational Activities",
        description: "Fun and educational activities for children",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
        questionnaireSlug: "activities-enfants",
    },
];

const CHILDREN_PROVIDERS = [
    {
        id: "1",
        slug: "marie-babysitter",
        name: "Marie",
        category: "Babysitter",
        rate: 15,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        isNew: true,
        tags: ["First aid certified", "5 years experience", "Creative activities"],
    },
    {
        id: "2",
        slug: "sophie-tutor",
        name: "Sophie",
        category: "Tutor",
        rate: 20,
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
        isNew: true,
        tags: ["Education degree", "Patient", "Bilingual"],
    },
    {
        id: "3",
        slug: "pierre-caregiver",
        name: "Pierre",
        category: "Childcare Specialist",
        rate: 18,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        isNew: true,
        tags: ["Background checked", "Energetic", "Responsible"],
    },
    {
        id: "4",
        slug: "lucie-educator",
        name: "Lucie",
        category: "Educator",
        rate: 22,
        image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
        isNew: true,
        tags: ["Early childhood", "Creative", "Structured"],
    },
];

export default function EnfantsPage() {
    return (
        <div className="pt-20 pb-20 min-h-screen bg-white dark:bg-gray-950">
            {/* Hero Container */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Hero Banner */}
                <section className="relative w-full h-[20rem] sm:h-[24rem] lg:h-[26rem] rounded-3xl overflow-hidden shadow-xl mt-4">
                    <Image
                        src="https://images.unsplash.com/photo-1516627145497-ae6968895b74"
                        alt="Children services"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                    <div className="absolute inset-y-0 left-0 p-8 sm:p-10 lg:p-12 flex flex-col justify-center max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Baby className="w-8 h-8 text-yellow-300" />
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                                Children Services
                            </h1>
                        </div>
                        <p className="text-lg text-white/90 max-w-xl">
                            Qualified professionals for the care and education of your children
                        </p>
                    </div>

                    {/* Floating UI Elements */}
                    <div className="hidden lg:block absolute top-[15%] right-[10%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        👶 Care
                    </div>
                    <div className="hidden lg:flex absolute top-[35%] right-[15%] bg-yellow-50/95 backdrop-blur-sm rounded-xl p-2 pr-6 items-center gap-3 shadow-2xl overflow-hidden cursor-default border border-yellow-100">
                        <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center text-2xl">
                            📚
                        </div>
                        <span className="font-bold text-yellow-900 text-sm">Tutoring</span>
                    </div>
                    <div className="hidden lg:block absolute bottom-[25%] right-[25%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        🎮 Activities
                    </div>
                </section>
            </div>

            {/* Main Content Container */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 space-y-16 lg:space-y-24">

                {/* Children Promo Banner */}
                <section className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b"
                        alt="Children special offer"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-yellow-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center p-8 sm:p-12">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white max-w-3xl drop-shadow-md">
                            Subscription Plan: Regular care at -20%*
                        </h2>
                    </div>
                </section>

                {/* Children Services */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                        Available children services
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {CHILDREN_SUBCATEGORIES.map((service, index) => (
                            <Link 
                                key={index} 
                                href={`/questionnaire?category=enfants&subcategory=${service.questionnaireSlug}`}
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
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-yellow-600 transition-colors">
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
                        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                        alt="Emergency childcare services"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 object-center"
                    />
                    <div className="absolute inset-0 bg-red-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent"></div>

                    <div className="absolute inset-0 flex flex-col justify-center p-8 sm:p-12 max-w-2xl">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 drop-shadow-md">
                            Emergency care?
                        </h2>
                        <p className="text-sm sm:text-base text-gray-100 mb-6 font-medium text-red-50">
                            Quick intervention for your last-minute childcare needs.
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
                            Our early childhood professionals are available
                        </h2>
                    </div>

                    <ProviderSlider>
                        {CHILDREN_PROVIDERS.map((provider) => (
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
                                Check verified reviews from other users to choose your ideal professional.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ThumbsUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Value for money badge</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Our dedicated badge makes it easy to identify the best value-for-money professionals.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Full Verification</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                All our professionals undergo background checks and first aid training.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
