"use client";

import Link from "next/link";
import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { CATEGORIES as GLOBAL_CATEGORIES, getUserLanguageAndCountry } from "@/lib/categories";
import { useEffect, useState } from "react";

const CATEGORIES = [
    { slug: "hiver", color: "#60A5FA" },
    { slug: "bricolage", color: "#F59E0B" },
    { slug: "jardinage", color: "#22C55E" },
    { slug: "demenagement", color: "#8B5CF6" },
    { slug: "menage", color: "#EC4899" },
    { slug: "enfants", color: "#F97316" },
    { slug: "animaux", color: "#14B8A6" },
    { slug: "informatique", color: "#6366F1" },
    { slug: "aide-domicile", color: "#EF4444" },
    { slug: "cours-particuliers", color: "#0EA5E9" },
];

export function CategoryBar() {
    const [language, setLanguage] = useState("en");
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const { language } = getUserLanguageAndCountry();
        setLanguage(language);

        // Listen for language changes
        const handleLangChange = (e: any) => {
            if (e.detail?.language) {
                setLanguage(e.detail.language);
            } else {
                const { language } = getUserLanguageAndCountry();
                setLanguage(language);
            }
        };
        window.addEventListener('storage', handleLangChange);
        window.addEventListener('languageChanged', handleLangChange);
        return () => {
            window.removeEventListener('storage', handleLangChange);
            window.removeEventListener('languageChanged', handleLangChange);
        };
    }, []);

    const getLocalizedName = (slug: string) => {
        const globalCat = GLOBAL_CATEGORIES.find(c => c.slug === slug);
        if (globalCat) {
            return globalCat.translations[language] || globalCat.name;
        }
        return slug;
    };

    return (
        <section className="relative -mt-10 sm:-mt-14 z-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-gray-100 dark:border-gray-800 p-4 sm:p-6 lg:p-8">
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
                        {CATEGORIES.map((cat, i) => (
                            <Link
                                key={cat.slug}
                                href={`/questionnaire?category=${cat.slug}`}
                                className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <div
                                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center"
                                    style={{
                                        backgroundColor: `${cat.color}15`,
                                        color: cat.color,
                                    }}
                                >
                                    <CategoryIcon
                                        slug={cat.slug}
                                        className="w-5 h-5 sm:w-6 sm:h-6"
                                    />
                                </div>
                                <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white text-center leading-tight transition-colors">
                                    {isClient ? getLocalizedName(cat.slug) : cat.slug}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
