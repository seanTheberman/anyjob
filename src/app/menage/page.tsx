import Image from "next/image";
import Link from "next/link";
import { Users, ThumbsUp, ShieldCheck, Sparkles, Home, Droplets } from "lucide-react";
import { EmergencyJobsSection } from "@/components/shared/EmergencyJobsSection";
import { RealProvidersSection } from "@/components/shared/RealProvidersSection";
import { getProviderCards } from "@/lib/real-providers";

export const dynamic = "force-dynamic";

const CLEANING_SUBCATEGORIES = [
    {
        title: "Home & Apartment Cleaning",
        description: "Complete home and apartment cleaning service",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
        questionnaireSlug: "home-cleaning-menage",
    },
    {
        title: "Deep Cleaning",
        description: "Intensive deep cleaning for a spotless home",
        image: "https://images.unsplash.com/photo-1581094794329-6461ffad8d80",
        questionnaireSlug: "deep-cleaning-menage",
    },
    {
        title: "Window Cleaning",
        description: "Professional window and glass cleaning services",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        questionnaireSlug: "window-cleaning-menage",
    },
    {
        title: "Kitchen Cleaning",
        description: "Specialized kitchen cleaning and sanitization",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
        questionnaireSlug: "kitchen-cleaning-menage",
    },
    {
        title: "Bathroom Cleaning",
        description: "Thorough bathroom cleaning and disinfection",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        questionnaireSlug: "bathroom-cleaning-menage",
    },
    {
        title: "Post-Construction Cleaning",
        description: "Cleaning services after renovation or construction",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        questionnaireSlug: "post-construction-menage",
    },
];


export default async function MenagePage() {
    const providers = await getProviderCards("menage");

    return (
        <div className="pt-40 pb-20 min-h-screen bg-white dark:bg-gray-950">
            {/* Hero Container */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Hero Banner */}
                <section className="relative w-full h-[20rem] sm:h-[24rem] lg:h-[26rem] rounded-3xl overflow-hidden shadow-xl mt-4">
                    <Image
                        src="https://images.unsplash.com/photo-1581578731548-c64695cc6952"
                        alt="Cleaning services"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                    <div className="absolute inset-y-0 left-0 p-8 sm:p-10 lg:p-12 flex flex-col justify-center max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="w-8 h-8 text-pink-300" />
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                                Cleaning Services
                            </h1>
                        </div>
                        <p className="text-lg text-white/90 max-w-xl">
                            Cleaning professionals for an impeccable interior
                        </p>
                    </div>

                    {/* Floating UI Elements */}
                    <div className="hidden lg:block absolute top-[15%] right-[10%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        ✨ Cleaning
                    </div>
                    <div className="hidden lg:flex absolute top-[35%] right-[15%] bg-pink-50/95 backdrop-blur-sm rounded-xl p-2 pr-6 items-center gap-3 shadow-2xl overflow-hidden cursor-default border border-pink-100">
                        <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center text-2xl">
                            🧹
                        </div>
                        <span className="font-bold text-pink-900 text-sm">Deep cleaning</span>
                    </div>
                    <div className="hidden lg:block absolute bottom-[25%] right-[25%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        🏠 Maintenance
                    </div>
                </section>
            </div>

            {/* Main Content Container */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 space-y-16 lg:space-y-24">

                {/* Cleaning Promo Banner */}
                <section className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1556909114-f6e7a74002e7"
                        alt="Cleaning special offer"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-pink-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center p-8 sm:p-12">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white max-w-3xl drop-shadow-md">
                            Subscription Plan: Weekly cleaning at -25%*
                        </h2>
                    </div>
                </section>

                {/* Cleaning Services */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                        Available cleaning services
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {CLEANING_SUBCATEGORIES.map((service, index) => (
                            <Link 
                                key={index} 
                                href={`/questionnaire?category=menage&subcategory=${service.questionnaireSlug}`}
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
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-pink-600 transition-colors">
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
                <RealProvidersSection title="Our cleaning professionals are available" providers={providers} />

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
                                Check verified reviews from other users to choose your ideal cleaning professional.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ThumbsUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Value for money badge</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Our dedicated badge makes it easy to identify the best value-for-money professionals in your area.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Certified products</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                All our professionals use certified products and respect hygiene standards.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
