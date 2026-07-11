"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
    ArrowRight,
    BadgeCheck,
    Briefcase,
    Building2,
    CalendarCheck,
    ClipboardList,
    MessageCircle,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    UserCheck,
    Users,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PathKey = "book" | "business" | "shift" | "provider";

type Path = {
    key: PathKey;
    label: string;
    eyebrow: string;
    title: string;
    text: string;
    href: string;
    cta: string;
    image: string;
    imageAlt: string;
    icon: LucideIcon;
    accent: string;
    chip: string;
    stats: [string, string][];
    steps: { title: string; text: string; icon: LucideIcon }[];
    preview: {
        title: string;
        meta: string;
        price: string;
        status: string;
    };
};

const PATHS: Path[] = [
    {
        key: "book",
        label: "Book help",
        eyebrow: "For customers",
        title: "Find a trusted provider without scrolling through strangers.",
        text: "Search the service, compare verified profiles, accept one total bid, and unlock chat after confirmation.",
        href: "/search",
        cta: "Find a provider",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
        imageAlt: "Provider cleaning a bright home",
        icon: Search,
        accent: "from-red-600 to-rose-500",
        chip: "border-red-100 bg-red-50 text-red-700",
        stats: [
            ["4.8/5", "Average satisfaction"],
            ["Chat", "Unlocks after bid acceptance"],
            ["100%", "Tasks covered by insurance"],
        ],
        steps: [
            { title: "Describe the task", text: "Pick a category and share what needs to be done.", icon: ClipboardList },
            { title: "Compare providers", text: "See ratings, skills, service area, and bid details.", icon: Star },
            { title: "Confirm and chat", text: "Accept the total bid, then coordinate directly.", icon: MessageCircle },
        ],
        preview: {
            title: "Apartment deep clean",
            meta: "Friday · Bordeaux · 3 bedrooms",
            price: "€120 total",
            status: "Provider ready to confirm",
        },
    },
    {
        key: "business",
        label: "Post business shifts",
        eyebrow: "For businesses",
        title: "Post shift jobs and fill business roles with matched workers.",
        text: "Register your business, post day-wage jobs, long-duration shifts, or freelance project work, then review applications from workers who match your niche.",
        href: "/register-business",
        cta: "Post shift jobs",
        image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200&auto=format&fit=crop",
        imageAlt: "Business team coordinating staffing needs",
        icon: Building2,
        accent: "from-sky-600 to-cyan-500",
        chip: "border-sky-100 bg-sky-50 text-sky-700",
        stats: [
            ["3 types", "Services, day wage, shifts"],
            ["6 niches", "Healthcare to events"],
            ["1 place", "Posts, workers, applications"],
        ],
        steps: [
            { title: "Verify business", text: "Submit company details and documents for review.", icon: BadgeCheck },
            { title: "Post shifts", text: "Add work type, role, schedule, location, headcount, and pay.", icon: ClipboardList },
            { title: "Choose workers", text: "Review matched applicants and confirm the best fit.", icon: Users },
        ],
        preview: {
            title: "Weekend hospitality cover",
            meta: "Saturday · Dublin · 4 workers",
            price: "€130/day",
            status: "Applications open",
        },
    },
    {
        key: "shift",
        label: "Find shift jobs",
        eyebrow: "For shift workers",
        title: "Find day-wage jobs, urgent shifts, and longer business work.",
        text: "Choose your industry, set availability and travel range, apply to business shift posts, and track accepted work from your pro area.",
        href: "/seller-register?mode=shift",
        cta: "Find shift work",
        image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1200&auto=format&fit=crop",
        imageAlt: "Workers preparing for a shift",
        icon: Briefcase,
        accent: "from-violet-600 to-fuchsia-500",
        chip: "border-violet-100 bg-violet-50 text-violet-700",
        stats: [
            ["Day wage", "Part-time paid work"],
            ["Urgent", "Opt in to fast shifts"],
            ["6 niches", "Healthcare, retail, logistics"],
        ],
        steps: [
            { title: "Pick niche", text: "Choose healthcare, hospitality, cleaning, retail, logistics, or events.", icon: Briefcase },
            { title: "Set availability", text: "Share when you can work, your travel radius, and target rates.", icon: CalendarCheck },
            { title: "Apply to shifts", text: "Track pending, accepted, completed, reviews, and wallet info.", icon: Wallet },
        ],
        preview: {
            title: "Retail stock assistant",
            meta: "Tomorrow · Lille · 8 hours",
            price: "€16/hour",
            status: "Shift accepting applications",
        },
    },
    {
        key: "provider",
        label: "Offer services",
        eyebrow: "For service providers",
        title: "Turn your professional services into booked client work.",
        text: "Create your profile, list services, send bids, unlock chat after confirmation, and grow reviews around your completed work.",
        href: "/seller-register?mode=both",
        cta: "Become a provider",
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1200&auto=format&fit=crop",
        imageAlt: "Service provider working with tools",
        icon: UserCheck,
        accent: "from-emerald-600 to-teal-500",
        chip: "border-emerald-100 bg-emerald-50 text-emerald-700",
        stats: [
            ["50+", "Service categories"],
            ["Badges", "Build visible trust"],
            ["Pro area", "Jobs, reviews, earnings"],
        ],
        steps: [
            { title: "Build profile", text: "Add skills, services, documents, rates, and work area.", icon: UserCheck },
            { title: "Send bids", text: "Respond to customer requests with a clear total price.", icon: ClipboardList },
            { title: "Win the work", text: "Complete jobs, collect reviews, and build visible trust.", icon: Wallet },
        ],
        preview: {
            title: "Furniture assembly",
            meta: "Today · Cork · 2 hours",
            price: "€85 bid",
            status: "New customer request",
        },
    },
];

const BUSINESS_SHIFT_CARDS = [
    {
        title: "Businesses can post shift jobs",
        text: "Hospitals, restaurants, stores, offices, events teams, and warehouses can request day-wage or long-duration workers.",
        href: "/register-business",
        cta: "Register business",
        icon: Building2,
    },
    {
        title: "Workers can find paid shifts",
        text: "Freelancers can choose a niche, set availability, apply to business posts, and track shift work in the pro dashboard.",
        href: "/seller-register?mode=shift",
        cta: "Find shift jobs",
        icon: Briefcase,
    },
];

const TRUST_POINTS = [
    { title: "Verified profiles", text: "Provider KYC, business review, and profile checks help users compare with context.", icon: ShieldCheck },
    { title: "Clear next step", text: "Every role has one obvious action, from search to business posting to seller registration.", icon: ArrowRight },
    { title: "Reviews that compound", text: "Ratings, reviews, badges, and job history make quality easier to recognize over time.", icon: Star },
];

function getPath(key: PathKey) {
    return PATHS.find((path) => path.key === key) || PATHS[0];
}

export function HomeEngagement() {
    const [activeKey, setActiveKey] = useState<PathKey>("book");
    const active = useMemo(() => getPath(activeKey), [activeKey]);
    const ActiveIcon = active.icon;

    return (
        <section className="overflow-hidden bg-white dark:bg-gray-950">
            <div className="border-y border-gray-200 bg-gray-50 px-4 py-14 sm:px-6 lg:px-8 dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-red-700">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            Choose your path
                        </span>
                        <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl lg:text-5xl dark:text-white">
                            AnyJob adapts to what you need next.
                        </h2>
                        <p className="mt-4 max-w-xl text-base leading-7 text-gray-600 dark:text-gray-300">
                            Book a home service, post business shift jobs, find paid shift work, or offer professional services. Tap a path and see the flow change instantly.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {BUSINESS_SHIFT_CARDS.map((card) => {
                                const Icon = card.icon;

                                return (
                                    <Link
                                        key={card.title}
                                        href={card.href}
                                        className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600">
                                                <Icon className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                            <span>
                                                <span className="block text-sm font-extrabold text-gray-950 dark:text-white">
                                                    {card.title}
                                                </span>
                                                <span className="mt-1 block text-xs leading-5 text-gray-600 dark:text-gray-300">
                                                    {card.text}
                                                </span>
                                                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-red-600">
                                                    {card.cta}
                                                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
                                                </span>
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {PATHS.map((path) => {
                                const Icon = path.icon;
                                const selected = active.key === path.key;

                                return (
                                    <button
                                        key={path.key}
                                        type="button"
                                        onClick={() => setActiveKey(path.key)}
                                        aria-pressed={selected}
                                        className={`group flex min-h-20 items-center gap-3 rounded-lg border p-3 text-left transition ${
                                            selected
                                                ? "border-red-200 bg-white shadow-md shadow-red-950/5"
                                                : "border-gray-200 bg-white/70 hover:border-gray-300 hover:bg-white dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
                                        }`}
                                    >
                                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${path.chip}`}>
                                            <Icon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                        <span>
                                            <span className="block text-sm font-bold text-gray-950 dark:text-white">
                                                {path.label}
                                            </span>
                                            <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                                                {path.eyebrow}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active.key}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                                transition={{ duration: 0.32 }}
                                className="grid gap-4 lg:grid-cols-[1fr_0.82fr]"
                            >
                                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl shadow-gray-950/10 dark:border-gray-800 dark:bg-gray-950">
                                    <div className="relative h-72 sm:h-96">
                                        <Image
                                            src={active.image}
                                            alt={active.imageAlt}
                                            fill
                                            className="object-cover"
                                            sizes="(min-width: 1024px) 480px, 100vw"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-gray-950/10 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <span className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-bold text-white ${active.accent}`}>
                                                <ActiveIcon className="h-4 w-4" aria-hidden="true" />
                                                {active.eyebrow}
                                            </span>
                                            <h3 className="mt-3 max-w-lg text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                                                {active.title}
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                                            Live preview
                                        </p>
                                        <h3 className="mt-2 text-xl font-extrabold text-gray-950 dark:text-white">
                                            {active.preview.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {active.preview.meta}
                                        </p>
                                        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                                {active.preview.status}
                                            </span>
                                            <span className={`rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-bold text-white ${active.accent}`}>
                                                {active.preview.price}
                                            </span>
                                        </div>
                                    </div>

                                    {active.stats.map(([value, label]) => (
                                        <motion.div
                                            key={value}
                                            whileHover={{ y: -3 }}
                                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                                        >
                                            <p className="text-lg font-extrabold text-gray-950 dark:text-white">{value}</p>
                                            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{label}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="px-4 py-14 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                    <div className="lg:sticky lg:top-28">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active.key}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -14 }}
                                transition={{ duration: 0.24 }}
                            >
                                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${active.chip}`}>
                                    <ActiveIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                    {active.eyebrow}
                                </span>
                                <h2 className="mt-4 text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl dark:text-white">
                                    {active.title}
                                </h2>
                                <p className="mt-4 max-w-xl text-base leading-7 text-gray-600 dark:text-gray-300">
                                    {active.text}
                                </p>
                                <Link href={active.href} className="mt-7 inline-flex">
                                    <Button className={`h-11 rounded-lg bg-gradient-to-r px-6 text-white ${active.accent}`}>
                                        {active.cta}
                                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </Link>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active.key}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -14 }}
                            transition={{ duration: 0.24 }}
                            className="grid gap-4 md:grid-cols-3"
                        >
                            {active.steps.map((step, index) => {
                                const Icon = step.icon;

                                return (
                                    <motion.article
                                        key={step.title}
                                        whileHover={{ y: -4 }}
                                        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-950 text-sm font-bold text-white dark:bg-white dark:text-gray-950">
                                                {index + 1}
                                            </span>
                                            <Icon className="h-5 w-5 text-red-600" aria-hidden="true" />
                                        </div>
                                        <h3 className="mt-5 text-lg font-bold text-gray-950 dark:text-white">
                                            {step.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                            {step.text}
                                        </p>
                                    </motion.article>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="bg-gray-950 px-4 py-14 text-white sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.12em] text-red-300">
                            Trust built into the flow
                        </p>
                        <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
                            A marketplace feels better when every step has context.
                        </h2>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
                            AnyJob uses profiles, reviews, verification, and confirmation gates to help customers, businesses, providers, and workers move with more confidence.
                        </p>
                    </div>

                    <div className="grid gap-3">
                        {TRUST_POINTS.map((point) => {
                            const Icon = point.icon;

                            return (
                                <motion.article
                                    key={point.title}
                                    whileHover={{ x: 4 }}
                                    className="rounded-lg border border-white/10 bg-white/5 p-5"
                                >
                                    <div className="flex gap-4">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-600">
                                            <Icon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                        <div>
                                            <h3 className="font-bold">{point.title}</h3>
                                            <p className="mt-1 text-sm leading-6 text-gray-300">{point.text}</p>
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
