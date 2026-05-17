"use client";

import { useState, useEffect } from "react";
import { CATEGORIES } from "@/lib/categories";

export function Hero() {
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [isClient, setIsClient] = useState(false);

    // Set isClient flag after mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Detect language based on geolocation (timezone)
    useEffect(() => {
        if (isClient) {
            const savedLang = localStorage.getItem('user_language');
            if (savedLang) {
                setSelectedLanguage(savedLang);
                return;
            }

            const detectLanguage = () => {
                try {
                    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    
                    if (timezone === 'Europe/Paris' || timezone === 'Europe/Monaco') {
                        setSelectedLanguage('fr');
                        return;
                    }
                    
                    const browserLang = navigator.language.split('-')[0];
                    const navCountry = navigator.language.split('-')[1]?.toUpperCase();
                    
                    if (navCountry === 'FR' || browserLang === 'fr') {
                        setSelectedLanguage('fr');
                    } else {
                        setSelectedLanguage(browserLang || 'en');
                    }
                } catch (error) {
                    console.warn('Error detecting language:', error);
                    setSelectedLanguage('en');
                }
            };
            detectLanguage();
        }
    }, [isClient]);

    // Listen for language changes from SearchBar
    useEffect(() => {
        const handleLanguageChange = (e: CustomEvent) => {
            setSelectedLanguage(e.detail.language);
        };
        
        window.addEventListener('languageChanged', handleLanguageChange as EventListener);
        return () => window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    }, []);

    const getLocalizedPopularText = () => {
        const popularTexts: Record<string, string> = {
            fr: "Populaire :",
            en: "Popular:",
            es: "Popular:",
            de: "Beliebt:",
            it: "Popolare:",
            pt: "Popular:",
            nl: "Populair:",
            ar: "شائع:",
            zh: "热门:",
            ja: "人気:",
            hi: "लोकप्रिय:"
        };
        return popularTexts[selectedLanguage] || popularTexts.fr;
    };

    const getPopularCategories = () => {
        const popularMaps: Record<string, string[]> = {
            fr: ["Ménage", "Bricolage", "Jardinage", "Déménagement"],
            en: ["Cleaning", "Handyman", "Gardening", "Moving"],
            es: ["Limpieza", "Fontanería", "Jardinería", "Mudanza"],
            de: ["Reinigung", "Handwerker", "Gartenarbeit", "Umzug"],
            it: ["Pulizie", "Fai da te", "Giardinaggio", "Trasloco"],
            pt: ["Limpeza", "Serviços gerais", "Jardinagem", "Mudança"],
            nl: ["Schoonmaken", "Klusjesman", "Tuinieren", "Verhuizing"],
            ar: ["تنظيف", "أعمال يدوية", "بستنة", "نقل"],
            zh: ["清洁", "维修", "园艺", "搬家"],
            ja: ["清掃", "修理", "園芸", "引っ越し"],
            hi: ["सफाई", "ठेकेदार", "बागवानी", "बदली"]
        };
        return popularMaps[selectedLanguage] || popularMaps.fr;
    };

    return (
        <section className="relative min-h-[600px] sm:min-h-[700px] flex items-center justify-center overflow-visible">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/hero-bg.png')" }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/50 to-gray-900/80" />

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pt-24 pb-16">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6 sm:mb-8">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs sm:text-sm text-white/90 font-medium">
                        388,000+ qualified providers
                    </span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-4 sm:mb-6">
                    Book the <span className="text-red-400">ideal service</span> <br className="hidden sm:block" />
                    <span className="text-red-400">provider</span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-16 sm:mb-20">
                    Trusted home services: cleaning, DIY, gardening, moving and much
                    more.
                </p>

                {/* Popular searches */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-20 sm:mt-24">
                    <span className="text-xs text-white/50">{isClient ? getLocalizedPopularText() : "Popular:"}</span>
                    {(isClient ? getPopularCategories() : ["Cleaning", "Handyman", "Gardening", "Moving"]).map((term) => {
                        const category = CATEGORIES.find(cat => 
                            cat.translations[selectedLanguage] === term || cat.name === term
                        );
                        const categorySlug = category?.slug || term.toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/\s+/g, "-");
                        return (
                            <a
                                key={term}
                                href={`/questionnaire?category=${categorySlug}`}
                                className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 transition-colors"
                            >
                                {term}
                            </a>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
