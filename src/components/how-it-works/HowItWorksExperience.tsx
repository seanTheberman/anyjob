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
    CheckCircle2,
    ClipboardList,
    Clock,
    FileCheck,
    Handshake,
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

type AudienceKey = "business" | "provider" | "worker" | "customer";

type Step = {
    title: string;
    text: string;
    icon: LucideIcon;
};

type Audience = {
    key: AudienceKey;
    title: string;
    shortTitle: string;
    headline: string;
    intro: string;
    image: string;
    imageAlt: string;
    href: string;
    cta: string;
    icon: LucideIcon;
    accent: string;
    chip: string;
    stats: [string, string][];
    steps: Step[];
    highlights: string[];
    demoTitle: string;
    demoMeta: string;
    demoPay: string;
};

const AUDIENCES: Audience[] = [
    {
        key: "business",
        title: "Businesses",
        shortTitle: "Hire",
        headline: "Fill shifts, projects, and urgent roles without chasing candidates.",
        intro:
            "Register your company, post the work, compare matched workers, and keep reliable people close for the next job.",
        image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200&auto=format&fit=crop",
        imageAlt: "Business team planning staffing needs",
        href: "/register-business",
        cta: "Register business",
        icon: Building2,
        accent: "from-red-600 to-rose-500",
        chip: "bg-red-50 text-red-700 border-red-100",
        stats: [
            ["3 work types", "Services, day wage, long shifts"],
            ["6 niches", "Healthcare to events"],
            ["1 dashboard", "Posts, workers, applications"],
        ],
        steps: [
            {
                title: "Verify the business",
                text: "Add registration details and documents for admin review.",
                icon: FileCheck,
            },
            {
                title: "Post the exact need",
                text: "Set role, skills, location, headcount, pay, and timing.",
                icon: ClipboardList,
            },
            {
                title: "Review matched workers",
                text: "Compare applications by niche, rate, availability, and profile quality.",
                icon: Users,
            },
            {
                title: "Confirm and manage",
                text: "Track posts, accepted workers, and job progress from your business area.",
                icon: Handshake,
            },
        ],
        highlights: ["Urgent cover", "Recurring shifts", "Verified profiles", "Role matching"],
        demoTitle: "Weekend hospitality cover",
        demoMeta: "4 workers needed · Paris · Saturday",
        demoPay: "€130 day rate",
    },
    {
        key: "provider",
        title: "Service providers",
        shortTitle: "Provide",
        headline: "Turn your skills into booked client work and stronger reviews.",
        intro:
            "Build a verified profile, receive requests, send total bids, unlock chat after confirmation, and grow your reputation.",
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1200&auto=format&fit=crop",
        imageAlt: "Service provider working with tools",
        href: "/seller-register?mode=freelance",
        cta: "Become a provider",
        icon: BadgeCheck,
        accent: "from-emerald-600 to-teal-500",
        chip: "bg-emerald-50 text-emerald-700 border-emerald-100",
        stats: [
            ["50+ categories", "Home, IT, care, tutoring"],
            ["Total bids", "One clear price for buyers"],
            ["Reviews", "Trust grows with every job"],
        ],
        steps: [
            {
                title: "Create the profile",
                text: "Add services, area, experience, documents, and insurance details.",
                icon: UserCheck,
            },
            {
                title: "Set your work style",
                text: "Choose freelance jobs, shift work, or both with your availability.",
                icon: CalendarCheck,
            },
            {
                title: "Bid and coordinate",
                text: "Send a total bid, then chat opens after the customer accepts.",
                icon: MessageCircle,
            },
            {
                title: "Earn repeat trust",
                text: "Reviews, badges, and responsiveness help you stand out.",
                icon: Star,
            },
        ],
        highlights: ["Profile visibility", "Bid requests", "Verified badge", "Customer reviews"],
        demoTitle: "Furniture assembly request",
        demoMeta: "Today · 2 hours · Lyon",
        demoPay: "Total bid €85",
    },
    {
        key: "worker",
        title: "Freelance workers",
        shortTitle: "Work",
        headline: "Find flexible paid work that fits your niche and availability.",
        intro:
            "Choose the roles you can cover, set travel range and availability, apply for shifts, and track accepted work.",
        image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1200&auto=format&fit=crop",
        imageAlt: "Freelance workers preparing for a shift",
        href: "/seller-register?mode=shift",
        cta: "Find freelance work",
        icon: Briefcase,
        accent: "from-sky-600 to-cyan-500",
        chip: "bg-sky-50 text-sky-700 border-sky-100",
        stats: [
            ["6 industries", "Hospitality, retail, logistics"],
            ["Urgent shifts", "Opt in when available"],
            ["Pro area", "Applications and earnings"],
        ],
        steps: [
            {
                title: "Choose your niche",
                text: "Pick industries and roles that match what you can do.",
                icon: Briefcase,
            },
            {
                title: "Set availability",
                text: "Share days, travel radius, urgent shift interest, and target rates.",
                icon: Clock,
            },
            {
                title: "Apply to posts",
                text: "Browse business jobs and apply to the work that fits.",
                icon: ClipboardList,
            },
            {
                title: "Track progress",
                text: "Monitor pending, accepted, completed, reviews, badges, and wallet info.",
                icon: Wallet,
            },
        ],
        highlights: ["Day-wage work", "Long shifts", "Urgent jobs", "Worker profile"],
        demoTitle: "Retail stock assistant",
        demoMeta: "Tomorrow · 8 hours · Lille",
        demoPay: "€16/hour",
    },
    {
        key: "customer",
        title: "Customers",
        shortTitle: "Book",
        headline: "Book trusted local help without guessing who to call.",
        intro:
            "Search a category, compare providers, accept the total bid, unlock chat, and review the finished job.",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
        imageAlt: "Home service provider cleaning a bright room",
        href: "/search",
        cta: "Find a provider",
        icon: Search,
        accent: "from-amber-500 to-orange-500",
        chip: "bg-amber-50 text-amber-800 border-amber-100",
        stats: [
            ["Compare first", "Profiles, reviews, bids"],
            ["Chat unlock", "After confirmation"],
            ["Review after", "Help quality rise"],
        ],
        steps: [
            {
                title: "Search the service",
                text: "Find help for cleaning, moving, repairs, tutoring, IT, care, and more.",
                icon: Search,
            },
            {
                title: "Compare providers",
                text: "Review profile quality, ratings, location, and total bid.",
                icon: Star,
            },
            {
                title: "Confirm the match",
                text: "Accept the total bid to unlock chat and contact details.",
                icon: MessageCircle,
            },
            {
                title: "Review the work",
                text: "Share feedback so the best providers become easier to spot.",
                icon: CheckCircle2,
            },
        ],
        highlights: ["Local providers", "Clear total bid", "Unlocked chat", "Ratings"],
        demoTitle: "Deep clean request",
        demoMeta: "Friday · 3 bedrooms · Bordeaux",
        demoPay: "Total bid €120",
    },
];

const FEATURE_CARDS = [
    {
        title: "Clear before commitment",
        text: "Every path pushes users toward the right details before anyone confirms work.",
        icon: ClipboardList,
    },
    {
        title: "Built-in trust signals",
        text: "Verification, reviews, badges, job history, and admin oversight support safer decisions.",
        icon: ShieldCheck,
    },
    {
        title: "One flow, many work types",
        text: "Customers, businesses, providers, and workers each get a workflow designed for their role.",
        icon: Sparkles,
    },
];

function getAudience(key: AudienceKey) {
    return AUDIENCES.find((audience) => audience.key === key) || AUDIENCES[0];
}

export function HowItWorksExperience() {
    const [activeKey, setActiveKey] = useState<AudienceKey>("business");
    const active = useMemo(() => getAudience(activeKey), [activeKey]);
    const ActiveIcon = active.icon;

    return (
        <main className="overflow-hidden bg-white pt-20 text-gray-950 dark:bg-gray-950 dark:text-white">
            <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-red-700">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            How AnyJob works
                        </span>
                        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                            The fast way to match real work with real people.
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                            AnyJob turns service bookings, business staffing, provider bids, and freelance work into guided flows that feel simple from the first click.
                        </p>

                        <div className="mt-7 grid gap-3 sm:grid-cols-2">
                            {AUDIENCES.map((audience) => {
                                const Icon = audience.icon;
                                const selected = active.key === audience.key;

                                return (
                                    <button
                                        key={audience.key}
                                        type="button"
                                        onClick={() => setActiveKey(audience.key)}
                                        className={`group flex min-h-20 items-center gap-3 rounded-lg border p-3 text-left transition ${
                                            selected
                                                ? "border-red-200 bg-red-50 shadow-sm"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                                        }`}
                                        aria-pressed={selected}
                                    >
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${audience.chip}`}
                                        >
                                            <Icon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-sm font-bold text-gray-950 dark:text-white">
                                                {audience.title}
                                            </span>
                                            <span className="mt-0.5 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                                                {audience.shortTitle} with AnyJob
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>

                    <div className="relative">
                        <motion.div
                            className="absolute -right-10 -top-8 hidden rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-lg lg:block"
                            initial={{ opacity: 0, y: 18, rotate: 4 }}
                            animate={{ opacity: 1, y: 0, rotate: -2 }}
                            transition={{ delay: 0.25, duration: 0.45 }}
                        >
                            Match in minutes
                        </motion.div>
                        <div className="relative min-h-[520px] rounded-lg bg-gray-100 p-3 shadow-xl shadow-gray-950/10 dark:bg-gray-900">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={active.key}
                                    initial={{ opacity: 0, x: 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -24 }}
                                    transition={{ duration: 0.35 }}
                                    className="h-full"
                                >
                                    <div className="relative h-72 overflow-hidden rounded-lg sm:h-80 lg:h-[360px]">
                                        <Image
                                            src={active.image}
                                            alt={active.imageAlt}
                                            fill
                                            priority={active.key === "business"}
                                            className="object-cover"
                                            sizes="(min-width: 1024px) 680px, 100vw"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/65 via-gray-950/10 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <span
                                                className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-bold text-white ${active.accent}`}
                                            >
                                                <ActiveIcon className="h-4 w-4" aria-hidden="true" />
                                                {active.title}
                                            </span>
                                            <h2 className="mt-3 max-w-xl text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                                                {active.headline}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 pt-3 md:grid-cols-3">
                                        {active.stats.map(([value, label]) => (
                                            <div key={value} className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-950">
                                                <p className="text-lg font-extrabold">{value}</p>
                                                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                                    {label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-gray-200 bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
                    {FEATURE_CARDS.map((feature, index) => {
                        const Icon = feature.icon;

                        return (
                            <motion.article
                                key={feature.title}
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.2, delay: index * 0.03 }}
                                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                            >
                                <Icon className="h-6 w-6 text-red-600" aria-hidden="true" />
                                <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{feature.text}</p>
                            </motion.article>
                        );
                    })}
                </div>
            </section>

            <section className="px-4 py-14 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                    <div className="lg:sticky lg:top-28">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active.key}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.28 }}
                            >
                                <span
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${active.chip}`}
                                >
                                    <ActiveIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                    {active.title}
                                </span>
                                <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
                                    {active.headline}
                                </h2>
                                <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">
                                    {active.intro}
                                </p>

                                <div className="mt-6 flex flex-wrap gap-2">
                                    {active.highlights.map((highlight) => (
                                        <span
                                            key={highlight}
                                            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                                        >
                                            {highlight}
                                        </span>
                                    ))}
                                </div>

                                <Link href={active.href} className="mt-7 inline-flex">
                                    <Button className={`h-11 rounded-lg bg-gradient-to-r px-6 text-white ${active.accent}`}>
                                        {active.cta}
                                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </Link>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="grid gap-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active.key}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.28 }}
                                className="grid gap-4 md:grid-cols-2"
                            >
                                {active.steps.map((step, index) => {
                                    const Icon = step.icon;

                                    return (
                                        <motion.article
                                            key={step.title}
                                            initial={{ opacity: 0, y: 14 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.28, delay: index * 0.06 }}
                                            whileHover={{ y: -4 }}
                                            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-950 text-sm font-bold text-white dark:bg-white dark:text-gray-950">
                                                    {index + 1}
                                                </span>
                                                <Icon className="h-5 w-5 text-red-600" aria-hidden="true" />
                                            </div>
                                            <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
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
            </section>

            <section className="bg-gray-950 px-4 py-14 text-white sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.12em] text-red-300">
                            Live flow preview
                        </p>
                        <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
                            Tap a role above. The workflow, image, and job preview adapt instantly.
                        </h2>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
                            The page mirrors how AnyJob works: choose your role, see the right path, and move toward the next action without reading a manual.
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active.key}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-lg border border-white/10 bg-white p-4 text-gray-950 shadow-2xl"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                                        Sample match
                                    </p>
                                    <h3 className="mt-2 text-xl font-extrabold">{active.demoTitle}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{active.demoMeta}</p>
                                </div>
                                <span className={`rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-bold text-white ${active.accent}`}>
                                    {active.demoPay}
                                </span>
                            </div>

                            <div className="mt-5 space-y-3">
                                {active.steps.slice(0, 3).map((step, index) => (
                                    <div key={step.title} className="flex items-center gap-3">
                                        <motion.span
                                            className={`h-2.5 rounded-full bg-gradient-to-r ${active.accent}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${44 + index * 20}%` }}
                                            transition={{ duration: 0.45, delay: index * 0.12 }}
                                        />
                                        <span className="w-24 shrink-0 text-xs font-semibold text-gray-500">
                                            {step.title}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg bg-gray-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Status</p>
                                    <p className="mt-2 flex items-center gap-2 text-sm font-bold">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                                        Ready to confirm
                                    </p>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Next</p>
                                    <p className="mt-2 text-sm font-bold">{active.cta}</p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            <section className="px-4 py-16 text-center sm:px-6 lg:px-8">
                <motion.div className="mx-auto max-w-3xl" whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                    <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                        Start where you are. AnyJob guides the rest.
                    </h2>
                    <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">
                        Book a provider, register your business, offer services, or find flexible paid work.
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link href="/search">
                            <Button className="h-11 w-full rounded-lg bg-red-600 px-6 text-white hover:bg-red-700 sm:w-auto">
                                Find help
                                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                            </Button>
                        </Link>
                        <Link href="/seller-register?mode=both">
                            <Button variant="outline" className="h-11 w-full rounded-lg border-gray-300 px-6 sm:w-auto">
                                Work on AnyJob
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </section>
        </main>
    );
}
