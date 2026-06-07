import Image from "next/image";
import Link from "next/link";
import { Users, ThumbsUp, ShieldCheck, Home, Heart, HandHelping, Utensils } from "lucide-react";
import { EmergencyJobsSection } from "@/components/shared/EmergencyJobsSection";
import { RealProvidersSection } from "@/components/shared/RealProvidersSection";
import { getProviderCards } from "@/lib/real-providers";

export const dynamic = "force-dynamic";

const HOME_HELP_SUBCATEGORIES = [
    {
        title: "Elderly Care",
        description: "Compassionate care and support for elderly individuals",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        questionnaireSlug: "elderly-care-aide-domicile",
    },
    {
        title: "Meal Preparation",
        description: "Healthy meal preparation and kitchen assistance",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
        questionnaireSlug: "meal-preparation-aide-domicile",
    },
    {
        title: "Companionship",
        description: "Friendly companionship and emotional support",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        questionnaireSlug: "companionship-aide-domicile",
    },
    {
        title: "Shopping Assistance",
        description: "Help with grocery shopping and errands",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e",
        questionnaireSlug: "shopping-aide-domicile",
    },
    {
        title: "Light Housekeeping",
        description: "Basic home maintenance and organization",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
        questionnaireSlug: "housekeeping-aide-domicile",
    },
    {
        title: "Medication Reminders",
        description: "Help with medication schedules and reminders",
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56",
        questionnaireSlug: "medication-aide-domicile",
    },
];


export default async function AideDomicilePage() {
    const providers = await getProviderCards("aide-domicile");

    return (
        <div className="pt-40 pb-20 min-h-screen bg-white dark:bg-gray-950">
            {/* Hero Container */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Hero Banner */}
                <section className="relative w-full h-[20rem] sm:h-[24rem] lg:h-[26rem] rounded-3xl overflow-hidden shadow-xl mt-4">
                    <Image
                        src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"
                        alt="Home help services"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                    <div className="absolute inset-y-0 left-0 p-8 sm:p-10 lg:p-12 flex flex-col justify-center max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Heart className="w-8 h-8 text-purple-300" />
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                                Home Help
                            </h1>
                        </div>
                        <p className="text-lg text-white/90 max-w-xl">
                            Dedicated home helpers for quality daily support
                        </p>
                    </div>

                    {/* Floating UI Elements */}
                    <div className="hidden lg:block absolute top-[15%] right-[10%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        🏠 Support
                    </div>
                    <div className="hidden lg:flex absolute top-[35%] right-[15%] bg-purple-50/95 backdrop-blur-sm rounded-xl p-2 pr-6 items-center gap-3 shadow-2xl overflow-hidden cursor-default border border-purple-100">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-2xl">
                            🍳
                        </div>
                        <span className="font-bold text-purple-900 text-sm">Meals</span>
                    </div>
                    <div className="hidden lg:block absolute bottom-[25%] right-[25%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        💜 Companionship
                    </div>
                </section>
            </div>

            {/* Main Content Container */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 space-y-16 lg:space-y-24">

                {/* Home Help Promo Banner */}
                <section className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"
                        alt="Home help special offer"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-purple-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center p-8 sm:p-12">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white max-w-3xl drop-shadow-md">
                            Subscription Plan: Regular help at -25%*
                        </h2>
                    </div>
                </section>

                {/* Home Help Services */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                        Available home help services
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {HOME_HELP_SUBCATEGORIES.map((service, index) => (
                            <Link 
                                key={index} 
                                href={`/questionnaire?category=aide-domicile&subcategory=${service.questionnaireSlug}`}
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
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 transition-colors">
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
                <RealProvidersSection title="Our home helpers are available" providers={providers} />

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
                                Check verified reviews from other users to choose your ideal home helper.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ThumbsUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Value for money badge</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Our dedicated badge makes it easy to identify the best value-for-money helpers.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Full Training</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                All our helpers are trained in first aid and support services.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
