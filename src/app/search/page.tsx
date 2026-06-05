"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PhoneCall, ShieldCheck, ThumbsUp, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderCard } from "@/components/ui/provider-card";
import { ProviderSlider } from "@/components/ui/provider-slider";

const ANYJOB_EMERGENCY_PHONE = "+448001234567";
const ANYJOB_EMERGENCY_DISPLAY = "+44 800 123 4567";

const WINTER_SERVICES = [
    {
        title: "Babysitting",
        description: "A moment of play just for them, for as long as they need it",
        image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=enfants&subcategory=babysitting-hiver",
    },
    {
        title: "Weekend and vacation care",
        description: "Peaceful and fulfilling holidays for the whole family",
        image: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=hiver&subcategory=garde-vacances-hiver",
    },
    {
        title: "Dog sitting",
        description: "Their routines and activities, even during the winter holidays",
        image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=animaux&subcategory=dog-sitting-hiver",
    },
];

const SPRING_SERVICES = [
    {
        title: "Spring cleaning",
        description: "Refresh your home before spring",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=menage&subcategory=deep-cleaning-menage",
    },
    {
        title: "Get rid of bulky items",
        description: "Clear the clutter before spring",
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=demenagement&subcategory=help-moving-demenagement",
    },
    {
        title: "Interior painting",
        description: "Create a new atmosphere",
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=bricolage&subcategory=painting-bricolage",
    },
];

const EMERGENCY_SERVICES = [
    {
        title: "Emergency move",
        description: "Last-minute loading, lifting, and urgent moving support.",
        image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=900&auto=format&fit=crop",
    },
    {
        title: "Emergency cleaning",
        description: "Same-day cleanups after spills, guests, moves, or incidents.",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=900&auto=format&fit=crop",
    },
    {
        title: "Emergency repair",
        description: "Urgent handyman help for leaks, fixtures, small repairs, and safety issues.",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=900&auto=format&fit=crop",
    },
];

const MOCK_PROVIDERS = [
    {
        id: "1",
        slug: "volodymyr-handyman",
        name: "Volodymyr",
        category: "Handyman",
        rate: 10,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
        isNew: true,
        tags: ["Honesty and integrity", "Impeccable result", "Careful work"],
    },
    {
        id: "2",
        slug: "maxandre-movers",
        name: "Maxandre",
        category: "Movers",
        rate: 19,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
        isNew: true,
        tags: ["Careful work"],
    },
    {
        id: "3",
        slug: "marc-petsitter",
        name: "Marc",
        category: "Pet-sitter",
        rate: 15,
        image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop",
        isNew: true,
        tags: ["Animal lovers", "Vigilant and attentive", "Calm and patient"],
    },
    {
        id: "4",
        slug: "celestine-babysitter",
        name: "Célestine",
        category: "Babysitter",
        rate: 15,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
        isNew: true,
        tags: ["Vigilant and attentive", "Punctuality and reliability", "Flexible and adaptable"],
    },
];

export default function CataloguePage() {
    return (
        <div className="pt-20 pb-20 min-h-screen bg-white dark:bg-gray-950">
            {/* Hero Container - Wider than the rest, but constrained */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Hero Banner */}
                <section className="relative w-full h-[20rem] sm:h-[24rem] lg:h-[26rem] rounded-3xl overflow-hidden shadow-xl mt-4">
                    <Image
                        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop"
                        alt="Interior inspiration"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                    <div className="absolute inset-y-0 left-0 p-8 sm:p-10 lg:p-12 flex flex-col justify-center max-w-2xl">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                            More comfort, more freedom, explore this month&apos;s inspirations
                        </h1>
                    </div>

                    {/* Floating UI Elements (Simulating the overlapping badges) */}
                    <div className="hidden lg:block absolute top-[15%] right-[10%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        👩‍🍳 Preparing meals
                    </div>
                    <div className="hidden lg:flex absolute top-[35%] right-[15%] bg-red-50/95 backdrop-blur-sm rounded-xl p-2 pr-6 items-center gap-3 shadow-2xl overflow-hidden cursor-default border border-red-100">
                        <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-2xl relative overflow-hidden">
                            <Image src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" alt="avatar" fill className="object-cover" />
                        </div>
                        <span className="font-bold text-red-900 text-sm">Server / Waitress</span>
                    </div>
                    <div className="hidden lg:block absolute bottom-[25%] right-[25%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        🧸 Valentine&apos;s babysitter
                    </div>
                </section>
            </div>

            {/* Main Content Container - Narrower to match Yoojo reference */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 space-y-16 lg:space-y-24">

                {/* Travel Promo Banner */}
                <Link href="/questionnaire?category=aide-domicile&subcategory=accompagnement" className="relative block w-full h-48 sm:h-56 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop"
                        alt="Airplane flying"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-indigo-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center p-8 sm:p-12">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white max-w-3xl drop-shadow-md">
                            Book a service in February and get a chance to win $1,000 for your next trip*
                        </h2>
                    </div>
                </Link>

                {/* Plan your winter holidays */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                        Plan your winter holidays
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {WINTER_SERVICES.map((service, index) => (
                            <Link key={index} href={service.href} className="group cursor-pointer">
                                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-sm">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0"></div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {service.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {service.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Moving Soon Banner */}
                <Link href="/questionnaire?category=demenagement&subcategory=help-moving-demenagement" className="relative block w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1600566753086-00f18efc2253?q=80&w=2000&auto=format&fit=crop"
                        alt="Moving boxes"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 object-center"
                    />
                    <div className="absolute inset-0 bg-red-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent"></div>

                    <div className="absolute inset-0 flex flex-col justify-center p-8 sm:p-12 max-w-2xl">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 drop-shadow-md">
                            Moving soon?
                        </h2>
                        <p className="text-sm sm:text-base text-gray-100 mb-6 font-medium text-red-50">
                            Estimate the volume of your belongings in just a few clicks and find the right van for your move.
                        </p>
                        <Button className="w-fit rounded-full bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 shadow-xl">
                            Discover <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </Link>

                {/* Brighten up your home */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                        Brighten up your home
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {SPRING_SERVICES.map((service, index) => (
                            <Link key={index} href={service.href} className="group cursor-pointer">
                                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-4 shadow-sm">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {service.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {service.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Emergency Jobs */}
                <section className="overflow-hidden rounded-3xl bg-gray-950 text-white shadow-2xl">
                    <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="relative min-h-[320px] p-6 sm:p-8">
                            <Image
                                src="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=1400&auto=format&fit=crop"
                                alt="Emergency home service dispatch"
                                fill
                                className="object-cover opacity-50"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-gray-950/30" />
                            <div className="relative z-10 flex h-full flex-col justify-between">
                                <div>
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-sm font-bold text-red-100 ring-1 ring-red-300/20">
                                        <Zap className="h-4 w-4" />
                                        Emergency jobs
                                    </div>
                                    <h2 className="max-w-md text-3xl font-extrabold leading-tight">
                                        Need someone urgently?
                                    </h2>
                                    <p className="mt-4 max-w-md text-sm leading-6 text-gray-200">
                                        Emergency jobs do not go through the normal questionnaire. Call AnyJob and we dispatch the best suited available provider immediately.
                                    </p>
                                </div>
                                <a
                                    href={`tel:${ANYJOB_EMERGENCY_PHONE}`}
                                    className="mt-8 inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-gray-100"
                                >
                                    <PhoneCall className="h-4 w-4" />
                                    Call {ANYJOB_EMERGENCY_DISPLAY}
                                </a>
                            </div>
                        </div>

                        <div className="bg-gray-950 p-5 sm:p-6">
                            <div className="grid gap-2 sm:grid-cols-3">
                                {[
                                    ["1", "Call AnyJob", "Use the emergency number instead of posting a normal request."],
                                    ["2", "We match fast", "AnyJob finds the best suited available provider for the emergency."],
                                    ["3", "Get contacts", "We share provider contact details so the urgent job can start quickly."],
                                ].map(([number, title, detail]) => (
                                    <div key={number} className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
                                        <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-extrabold text-white">
                                            {number}
                                        </div>
                                        <h3 className="text-xs font-extrabold">{title}</h3>
                                        <p className="mt-1 text-[11px] leading-4 text-gray-300">{detail}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3">
                                {EMERGENCY_SERVICES.map((service) => (
                                    <a key={service.title} href={`tel:${ANYJOB_EMERGENCY_PHONE}`} className="group grid gap-3 overflow-hidden rounded-xl bg-white/10 p-2.5 ring-1 ring-white/10 transition hover:bg-white/15 sm:grid-cols-[104px_1fr_auto] sm:items-center">
                                        <div className="relative h-24 overflow-hidden rounded-lg sm:h-20">
                                            <Image
                                                src={service.image}
                                                alt={service.title}
                                                fill
                                                className="object-cover transition duration-700 group-hover:scale-105"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-extrabold">{service.title}</h3>
                                            <p className="mt-1 text-xs leading-4 text-gray-300">{service.description}</p>
                                        </div>
                                        <span className="inline-flex items-center whitespace-nowrap text-sm font-bold text-red-200">
                                            Call now <PhoneCall className="ml-2 h-4 w-4" />
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Providers Grid */}
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">
                            Our providers are here for you all February
                        </h2>
                    </div>

                    <ProviderSlider>
                        {MOCK_PROVIDERS.map((provider) => (
                            <ProviderCard key={provider.id} provider={provider} />
                        ))}
                    </ProviderSlider>
                </section>

                {/* Selection Criteria / Trust Footer */}
                <section className="pt-16 pb-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                            Selection criteria.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <Users className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Members&apos; opinions</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Consult the verified reviews of other users to choose your ideal home service provider.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ThumbsUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Quality-price badge</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Our dedicated badge makes it easy to identify the best value providers in your area.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Verified identity</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                All providers undergo a complete identity verification process to ensure absolute security.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
