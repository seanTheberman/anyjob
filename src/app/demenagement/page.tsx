"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Phone, ShieldCheck, ThumbsUp, Truck, Users } from "lucide-react";
import { ProviderSlider } from "@/components/ui/provider-slider";
import { ProviderCard } from "@/components/ui/provider-card";

const ANYJOB_EMERGENCY_PHONE = "+448001234567";
const ANYJOB_EMERGENCY_DISPLAY = "+44 800 123 4567";

const MOVING_SUBCATEGORIES = [
    {
        title: "Help Moving",
        description: "Professional help with loading, unloading and transportation",
        image: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?q=80&w=900&auto=format&fit=crop",
        questionnaireSlug: "help-moving-demenagement",
    },
    {
        title: "Heavy Lifting",
        description: "Specialized help for heavy furniture and appliances",
        image: "https://images.unsplash.com/photo-1580709839515-54b8991e2813?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=900",
        questionnaireSlug: "heavy-lifting-demenagement",
    },
    {
        title: "Packing Services",
        description: "Professional packing and unpacking of your belongings",
        image: "https://images.unsplash.com/photo-1580709584417-62cac02078b1?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=900",
        questionnaireSlug: "packing-demenagement",
    },
    {
        title: "Furniture Assembly",
        description: "Assembly and disassembly of furniture for your move",
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=900&auto=format&fit=crop",
        questionnaireSlug: "furniture-assembly-demenagement",
    },
    {
        title: "Local Moving",
        description: "Efficient local moving services within your city",
        image: "https://images.unsplash.com/photo-1585458941243-bacd4fc6f8d0?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=900",
        questionnaireSlug: "local-moving-demenagement",
    },
    {
        title: "Long Distance",
        description: "Professional long-distance moving services",
        image: "https://images.unsplash.com/photo-1742858492775-8f58f645aa12?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=900",
        questionnaireSlug: "long-distance-demenagement",
    },
];

const MOVING_PROVIDERS = [
    {
        id: "1",
        slug: "maxandre-movers",
        name: "Maxandre",
        category: "Movers",
        rate: 22,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        isNew: true,
        tags: ["Strong", "Efficient", "Insured"],
    },
    {
        id: "2",
        slug: "pierre-mover",
        name: "Pierre",
        category: "Heavy Lifting",
        rate: 25,
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
        isNew: true,
        tags: ["Professional", "Careful", "Experienced"],
    },
    {
        id: "3",
        slug: "marie-packers",
        name: "Marie",
        category: "Packing Specialist",
        rate: 20,
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
        isNew: true,
        tags: ["Detail-oriented", "Organized", "Fast"],
    },
    {
        id: "4",
        slug: "lucas-driver",
        name: "Lucas",
        category: "Driver",
        rate: 28,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        isNew: true,
        tags: ["Licensed", "Safe driver", "Reliable"],
    },
];

const EMERGENCY_MOVING_PROVIDERS = [
    {
        name: "Maxandre Movers",
        specialty: "2-person emergency loading team",
        phone: "+33 7 56 21 44 10",
        eta: "20-35 min",
    },
    {
        name: "Lucas Transport",
        specialty: "Van, driver, and same-day transport",
        phone: "+33 6 42 18 77 90",
        eta: "30-45 min",
    },
];

export default function DemenagementPage() {
    return (
        <div className="pt-40 pb-20 min-h-screen bg-white dark:bg-gray-950">
            {/* Hero Container */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Hero Banner */}
                <section className="relative w-full h-[20rem] sm:h-[24rem] lg:h-[26rem] rounded-3xl overflow-hidden shadow-xl mt-4">
                    <Image
                        src="https://images.unsplash.com/photo-1600518464441-9154a4dea21b?q=80&w=1600&auto=format&fit=crop"
                        alt="Moving services"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                    <div className="absolute inset-y-0 left-0 p-8 sm:p-10 lg:p-12 flex flex-col justify-center max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Truck className="w-8 h-8 text-purple-300" />
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                                Moving Services
                            </h1>
                        </div>
                        <p className="text-lg text-white/90 max-w-xl">
                            Professional movers for a stress-free relocation
                        </p>
                    </div>

                    {/* Floating UI Elements */}
                    <div className="hidden lg:block absolute top-[15%] right-[10%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        📦 Loading
                    </div>
                    <div className="hidden lg:flex absolute top-[35%] right-[15%] bg-purple-50/95 backdrop-blur-sm rounded-xl p-2 pr-6 items-center gap-3 shadow-2xl overflow-hidden cursor-default border border-purple-100">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-2xl">
                            🚚
                        </div>
                        <span className="font-bold text-purple-900 text-sm">Transport</span>
                    </div>
                    <div className="hidden lg:block absolute bottom-[25%] right-[25%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        🏠 Installation
                    </div>
                </section>
            </div>

            {/* Main Content Container */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 space-y-16 lg:space-y-24">

                {/* Moving Promo Banner */}
                <section className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1585458941243-bacd4fc6f8d0?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1400"
                        alt="Moving special offer"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-purple-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center p-8 sm:p-12">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white max-w-3xl drop-shadow-md">
                            Weekend Package: Full move with 2 movers -20%*
                        </h2>
                    </div>
                </section>

                {/* Moving Services */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                        Available moving services
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {MOVING_SUBCATEGORIES.map((service, index) => (
                            <Link 
                                key={index} 
                                href={`/questionnaire?category=demenagement&subcategory=${service.questionnaireSlug}`}
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

                {/* Emergency Services Banner */}
                <section className="relative w-full overflow-hidden rounded-3xl shadow-lg">
                    <Image
                        src="https://images.unsplash.com/photo-1742858492775-8f58f645aa12?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1400"
                        alt="Emergency moving services"
                        fill
                        className="object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-red-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent"></div>

                    <div className="relative grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
                        <div className="flex min-h-72 flex-col justify-center">
                            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur">
                                <Clock className="h-4 w-4" />
                                24/7 emergency dispatch
                            </div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 drop-shadow-md">
                                Emergency move?
                            </h2>
                            <p className="text-sm sm:text-base text-gray-100 mb-6 font-medium text-red-50">
                                Call AnyJob. We find the best suited available moving provider and share their contact details immediately.
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <a href={`tel:${ANYJOB_EMERGENCY_PHONE}`} className="inline-flex w-fit items-center justify-center rounded-full bg-white px-7 py-3 font-bold text-gray-900 shadow-xl transition hover:bg-gray-100">
                                    <Phone className="mr-2 h-4 w-4" />
                                    {ANYJOB_EMERGENCY_DISPLAY}
                                </a>
                                <Link href="/questionnaire?category=demenagement&subcategory=help-moving-demenagement&urgency=emergency" className="inline-flex w-fit items-center justify-center rounded-full border border-white/40 bg-white/10 px-7 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20">
                                    Post emergency request <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur">
                            <div className="mb-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-red-600">Best matches now</p>
                                <h3 className="text-lg font-extrabold text-gray-950">Emergency provider contacts</h3>
                            </div>
                            <div className="space-y-3">
                                {EMERGENCY_MOVING_PROVIDERS.map((provider) => (
                                    <div key={provider.phone} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-bold text-gray-950">{provider.name}</p>
                                                <p className="mt-1 text-sm text-gray-600">{provider.specialty}</p>
                                                <p className="mt-2 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                                                    ETA {provider.eta}
                                                </p>
                                            </div>
                                            <a href={`tel:${provider.phone.replaceAll(" ", "")}`} className="shrink-0 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700">
                                                Call
                                            </a>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-gray-900">{provider.phone}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Providers Grid */}
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">
                            Our professional movers are available
                        </h2>
                    </div>

                    <ProviderSlider>
                        {MOVING_PROVIDERS.map((provider) => (
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
                                Check verified reviews from other users to choose your ideal mover.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ThumbsUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Value for money badge</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Our dedicated badge makes it easy to identify the best value-for-money movers in your area.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Transport Insurance</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                All our movers are covered by transport insurance to protect your belongings.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
