"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, FileText, Shield, CreditCard, Calendar, Banknote } from "lucide-react";

const CITIES = [
    "Paris", "Lyon", "Marseille", "Bordeaux", "Lille", "Nantes", "Strasbourg", "Montpellier"
];

const CATEGORIES = [
    { name: "Help Moving", rate: 45 },
    { name: "Furniture Assembly", rate: 42 },
    { name: "Home Cleaning", rate: 38 },
    { name: "Handyman", rate: 50 },
    { name: "Gardening", rate: 35 },
    { name: "Painting", rate: 48 },
];

const FEATURES = [
    {
        icon: "⏰",
        title: "Be your own boss",
        description: "Work how, when, and where you want. Offer services in 50+ categories and set a flexible schedule and work area."
    },
    {
        icon: "💰",
        title: "Set your own rates",
        description: "You set your job payout. Anyjob adds its fee into the buyer's total bid, and the buyer sees one total amount."
    },
    {
        icon: "📈",
        title: "Grow your business",
        description: "We connect you with clients in your area, and ways to market yourself — so you can focus on what you do best."
    }
];

const STEPS = [
    {
        icon: Plus,
        number: "1",
        title: "Sign up",
        description: "Create your account. Then download the Anyjob app to continue registration."
    },
    {
        icon: FileText,
        number: "2",
        title: "Build your profile",
        description: "Select what services you want to offer and where."
    },
    {
        icon: Shield,
        number: "3",
        title: "Verify your eligibility",
        description: "Confirm your identity and submit business verifications, as required."
    },
    {
        icon: CreditCard,
        number: "4",
        title: "Understand AnyJob fees",
        description: "Anyjob adds €20 or 20%, whichever is higher, into the buyer's total bid. You still collect your job payout yourself."
    },
    {
        icon: Calendar,
        number: "5",
        title: "Set your schedule and work area",
        description: "Set your weekly availability and opt in to receive same-day jobs."
    },
    {
        icon: Banknote,
        number: "6",
        title: "Start getting jobs",
        description: "Grow your business on your own terms."
    }
];

const FAQS = [
    {
        question: "What's required to become a provider?",
        answer: "You must be at least 18 years old, have a valid ID, and pass our background check. Some categories may require additional verifications."
    },
    {
        question: "Do I need experience to provide services?",
        answer: "While experience is helpful for certain categories, it's not always required. You can start with basic tasks and build your reputation over time."
    },
    {
        question: "How do I get jobs?",
        answer: "Once your profile is approved, clients in your area can find you through our platform. You'll receive notifications for jobs that match your skills and availability."
    },
    {
        question: "How do I get paid?",
        answer: "You collect your quoted amount directly from the client at the job location. Anyjob does not process your full job payment or send seller payouts."
    },
    {
        question: "Where does Anyjob operate?",
        answer: "Anyjob currently operates in major cities across France including Paris, Lyon, Marseille, Bordeaux, and more."
    },
    {
        question: "What categories can I work in?",
        answer: "We offer 50+ categories including cleaning, handyman services, moving help, furniture assembly, gardening, painting, and much more."
    },
    {
        question: "How long does registration take?",
        answer: "Most registrations are processed within 24-48 hours. Background checks may take additional time depending on your location."
    }
];

function AppDownloadButton({ store, children }: { store: string; children: ReactNode }) {
    return (
        <button
            type="button"
            disabled
            aria-label={`${store} app not available in this test build`}
            title="Mobile app download is not available in this test build"
            className="bg-black/60 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed"
        >
            {children}
            <span className="sr-only"> app not available in this test build</span>
        </button>
    );
}

export default function BecomeProviderPage() {
    const router = useRouter();
    const [selectedCity, setSelectedCity] = useState("Paris");
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [accountType, setAccountType] = useState<"individual" | "contractor">("individual");
    const [workModes, setWorkModes] = useState<Array<"freelance" | "shift">>(["freelance", "shift"]);
    const handleCategoryChange = (value: string) => {
        const cat = CATEGORIES.find(c => c.name === value);
        if (cat) setSelectedCategory(cat);
    };
    const toggleWorkMode = (mode: "freelance" | "shift") => {
        setWorkModes((current) => (
            current.includes(mode)
                ? current.filter((item) => item !== mode)
                : [...current, mode]
        ));
    };
    const startRegistration = () => {
        const mode = accountType === "contractor"
            ? "freelance"
            : workModes.includes("freelance") && workModes.includes("shift")
            ? "both"
            : workModes.includes("shift")
                ? "shift"
                : "freelance";
        const providerType = accountType === "contractor" ? "business" : "individual";
        router.push(`/seller-register?mode=${mode}&accountType=${providerType}`);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="bg-[#f5f5f5] pt-24 pb-16 sm:pt-28 lg:pt-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,0.95fr)] lg:items-start lg:gap-12 xl:gap-16">
                        {/* Left - Image */}
                        <div className="relative order-2 lg:order-1 lg:pt-10">
                            <div className="relative min-h-[360px] overflow-hidden rounded-lg shadow-sm sm:min-h-[460px] lg:min-h-[620px]">
                                <Image
                                    src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=800&auto=format&fit=crop"
                                    alt="Happy service provider"
                                    fill
                                    sizes="(min-width: 1280px) 600px, (min-width: 1024px) 52vw, 100vw"
                                    className="object-cover object-[48%_center]"
                                    priority
                                />
                            </div>
                        </div>

                        {/* Right - Content */}
                        <div className="order-1 lg:order-2 lg:max-w-[560px]">
                            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                                Earn money your way
                            </h1>
                            <p className="text-gray-600 mb-6">
                                See how much you can make providing services on Anyjob
                            </p>

                            {/* Earnings Calculator */}
                            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Select your area
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedCity}
                                                onChange={(e) => setSelectedCity(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006340]"
                                            >
                                                {CITIES.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Choose a Category
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedCategory.name}
                                                onChange={(e) => handleCategoryChange(e.target.value)}
                                                onInput={(e) => handleCategoryChange(e.currentTarget.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006340]"
                                            >
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Rate Display */}
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-gray-900">€{selectedCategory.rate}</span>
                                        <span className="text-gray-600">per hour</span>
                                    </div>
                                </div>
                            </div>

                            {/* Registration Choice */}
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-gray-900">First, choose what you are registering as</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setAccountType("individual")}
                                        className={`rounded-lg border px-4 py-4 text-left transition-colors ${accountType === "individual" ? "border-[#006340] bg-[#006340] text-white ring-2 ring-green-100" : "border-gray-200 bg-white text-gray-950 hover:border-[#006340] hover:bg-green-50"}`}
                                    >
                                        <span className="block text-sm font-bold">I am an individual provider</span>
                                        <span className={`mt-1 block text-xs leading-5 ${accountType === "individual" ? "text-white/80" : "text-gray-600"}`}>I personally want to work and get screened as a provider.</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAccountType("contractor")}
                                        className={`rounded-lg border px-4 py-4 text-left transition-colors ${accountType === "contractor" ? "border-blue-600 bg-blue-600 text-white ring-2 ring-blue-100" : "border-gray-200 bg-white text-gray-950 hover:border-blue-500 hover:bg-blue-50"}`}
                                    >
                                        <span className="block text-sm font-bold">We are a contractor</span>
                                        <span className={`mt-1 block text-xs leading-5 ${accountType === "contractor" ? "text-white/80" : "text-gray-600"}`}>Register a business or team that provides services to customers.</span>
                                    </button>
                                </div>
                            </div>

                            {accountType === "individual" ? (
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => toggleWorkMode("freelance")}
                                    className={`rounded-lg border px-4 py-4 text-left transition-colors ${workModes.includes("freelance") ? "border-[#006340] bg-green-50 ring-2 ring-green-100" : "border-[#006340]/20 bg-white hover:border-[#006340] hover:bg-green-50"}`}
                                >
                                    <span className="block text-sm font-bold text-gray-950">I want to work freelance</span>
                                    <span className="mt-1 block text-xs leading-5 text-gray-600">Quote normal AnyJob service requests and set your own project price.</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleWorkMode("shift")}
                                    className={`rounded-lg border px-4 py-4 text-left transition-colors ${workModes.includes("shift") ? "border-[#006340] bg-green-50 text-gray-950 ring-2 ring-green-100" : "border-[#006340]/20 bg-white text-gray-950 hover:border-[#006340] hover:bg-green-50"}`}
                                >
                                    <span className="block text-sm font-bold">I want to work in shifts</span>
                                    <span className="mt-1 block text-xs leading-5 text-gray-600">Join the business worker pool for day-wage and shift work.</span>
                                </button>
                              </div>
                            ) : null}

                            <button
                                type="button"
                                onClick={startRegistration}
                                disabled={accountType === "individual" && workModes.length === 0}
                                className="mt-4 w-full rounded-lg bg-[#006340] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#005230] disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {accountType === "contractor" ? "Start contractor registration" : "Start provider registration"}
                            </button>

                            {/* Sign In Link */}
                            <p className="mt-4 text-center text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link href="/login" className="text-[#006340] font-semibold hover:underline">
                                    Sign in
                                </Link>
                            </p>

                            {/* App Download */}
                            <div className="mt-6">
                                <p className="text-sm text-gray-600 mb-3">Get started faster. Download our app</p>
                                <div className="flex gap-3">
                                    <AppDownloadButton store="App Store">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                                        </svg>
                                        App Store
                                    </AppDownloadButton>
                                    <AppDownloadButton store="Google Play">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                                        </svg>
                                        Google Play
                                    </AppDownloadButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Flexible Work Section */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Flexible work, at your fingertips
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Find local jobs that fit your skills and schedule. With Anyjob, you have the freedom and support to be your own boss.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {FEATURES.map((feature, index) => (
                            <div key={index} className="text-center">
                                <div className="w-16 h-16 bg-[#FFF8E1] rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* What is Anyjob Section */}
            <section className="py-16 sm:py-20 bg-[#f5f5f5]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200">
                            <Image
                                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop"
                                alt="What is Anyjob"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                                    <svg className="w-6 h-6 text-[#006340] ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">What is Anyjob?</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Anyjob connects busy people in need of help with trusted local service providers who can lend a hand with everything from home repairs to errands. As a provider, you can get paid to do what you love, when and where you want — all while saving the day for someone in your city.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Getting Started Section */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Getting Started</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {STEPS.map((step, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="w-12 h-12 bg-[#FFF8E1] rounded-full flex items-center justify-center shrink-0">
                                    <step.icon className="w-5 h-5 text-[#F5A623]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">{step.number}. {step.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial Section */}
            <section className="py-16 bg-[#f5f5f5]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden">
                        <Image
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
                            alt="Testimonial"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <blockquote className="text-xl text-gray-700 italic mb-4">
                        &ldquo;I love Anyjob! I was able to get out of debt, tackle bills, provide for my family, and still have enough room to save for future goals.&rdquo;
                    </blockquote>
                    <p className="font-semibold text-gray-900">Karsheem W., Paris, France</p>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Your questions, answered</h2>
                    
                    <div className="space-y-4">
                        {FAQS.map((faq, index) => (
                            <div key={index} className="border-b border-gray-200 pb-4">
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full flex items-center justify-between text-left py-2"
                                >
                                    <span className="font-semibold text-gray-900">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                                </button>
                                {openFaq === index && (
                                    <p className="text-gray-600 mt-2 pr-8">{faq.answer}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="py-16 bg-[#006340]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-8">Ready to make money your way?</h2>
                    <button
                        type="button"
                        onClick={() => router.push('/seller-register')}
                        className="bg-white text-[#006340] font-semibold py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors mb-6"
                    >
                        Get started
                    </button>
                    <div className="flex justify-center gap-4">
                        <AppDownloadButton store="App Store">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                            </svg>
                            App Store
                        </AppDownloadButton>
                        <AppDownloadButton store="Google Play">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                            </svg>
                            Google Play
                        </AppDownloadButton>
                    </div>
                </div>
            </section>
        </div>
    );
}
