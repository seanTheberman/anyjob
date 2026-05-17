"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Briefcase, Globe, ArrowRight } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/categories";

type SearchResult = {
    type: "category" | "subcategory";
    slug: string;
    name: string;
    color: string;
    categorySlug?: string;
};

export function SearchBar() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredCategories, setFilteredCategories] = useState<SearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [showLanguageSelector, setShowLanguageSelector] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

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

    // Search categories and subcategories from database
    useEffect(() => {
        if (!isClient || !searchQuery.trim()) {
            setFilteredCategories([]);
            setShowDropdown(false);
            return;
        }

        const searchDatabase = async () => {
            try {
                const response = await fetch(
                    `/api/search-categories?q=${encodeURIComponent(searchQuery)}&lang=${selectedLanguage}`
                );
                const data = await response.json() as { results?: SearchResult[] };
                const results = data.results || [];
                setFilteredCategories(results);
                setShowDropdown(results.length > 0);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Search error:', error);
                setFilteredCategories([]);
            }
        };

        const debounceTimer = setTimeout(searchDatabase, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, selectedLanguage, isClient]);

    function handleCategorySelect(result: SearchResult) {
        setSearchQuery(result.name);
        setShowDropdown(false);
        setSelectedIndex(-1);

        if (result.type === 'subcategory') {
            window.location.href = `/${result.categorySlug}?subcategory=${result.slug}`;
        } else {
            window.location.href = `/questionnaire?category=${result.slug}`;
        }
    }

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!showDropdown) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((prev: number) => 
                        prev < filteredCategories.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((prev: number) => 
                        prev > 0 ? prev - 1 : filteredCategories.length - 1
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < filteredCategories.length) {
                        handleCategorySelect(filteredCategories[selectedIndex]);
                    }
                    break;
                case "Escape":
                    setShowDropdown(false);
                    setSelectedIndex(-1);
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [showDropdown, selectedIndex, filteredCategories]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
                setSelectedIndex(-1);
                setShowLanguageSelector(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = () => {
        if (filteredCategories.length > 0) {
            handleCategorySelect(filteredCategories[0]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setShowDropdown(true);
    };

    const handleLanguageChange = (languageCode: string) => {
        setSelectedLanguage(languageCode);
        localStorage.setItem('user_language', languageCode);
        
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: languageCode } }));
        
        // Sync with GTranslate widget
        try {
            const gtSelect = document.querySelector('.gtranslate_wrapper select') as HTMLSelectElement;
            if (gtSelect) {
                gtSelect.value = `en|${languageCode}`;
                gtSelect.dispatchEvent(new Event('change'));
            } else {
                // Try the <a> link method if select is not found (some GTranslate styles use links)
                const gtLink = document.querySelector(`.gtranslate_wrapper a[data-gt-lang="${languageCode}"]`) as HTMLElement;
                if (gtLink) gtLink.click();
            }
        } catch (err) {
            console.error('GTranslate sync error:', err);
        }
        
        setShowLanguageSelector(false);
        setSearchQuery("");
        setFilteredCategories([]);
    };

    const getLocalizedPlaceholder = () => {
        const placeholders: Record<string, string> = {
            fr: "Femme de ménage, bricoleur...",
            en: "Cleaning, handyman...",
            es: "Limpieza, fontanería...",
            de: "Reinigung, Handwerker...",
            it: "Pulizie, fai da te...",
            pt: "Limpeza, serviços gerais...",
            nl: "Schoonmaken, klusjesman...",
            ar: "تنظيف، أعمال يدوية...",
            zh: "清洁，维修...",
            ja: "清掃、修理...",
            hi: "सफाई, ठेकेदार..."
        };
        return placeholders[selectedLanguage] || placeholders.fr;
    };

    const getNoResultsText = () => {
        const texts: Record<string, string> = {
            fr: "Aucune catégorie trouvée",
            en: "No category found",
            es: "No se encontró categoría",
            de: "Keine Kategorie gefunden",
            it: "Nessuna categoria trovata",
            pt: "Nenhuma categoria encontrada",
            nl: "Geen categorie gevonden",
            ar: "لم يتم العثور على فئة",
            zh: "未找到类别",
            ja: "カテゴリーが見つかりません",
            hi: "कोई श्रेणी नहीं मिली"
        };
        return texts[selectedLanguage] || texts.fr;
    };



    return (
        <>
        <div className="absolute left-1/2 top-[58%] z-[9999] w-full max-w-2xl -translate-x-1/2 px-4 sm:top-1/2 sm:translate-y-30" ref={searchRef}>
            <div className="relative flex min-h-16 items-center gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:min-h-0 sm:gap-0 sm:overflow-hidden sm:p-0">
                <Search className="ml-2 h-5 w-5 shrink-0 text-gray-400 sm:ml-5" />
                <input
                    type="text"
                    value={isClient ? searchQuery : ""}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (isClient && searchQuery.trim()) {
                            setShowDropdown(true);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !showDropdown && isClient) {
                            handleSearch();
                        }
                    }}
                    className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-200 sm:px-4 sm:py-5"
                    placeholder={isClient ? getLocalizedPlaceholder() : "Cleaning, handyman..."}
                    aria-label="Search services"
                />
                <button
                    onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                    className="flex h-11 shrink-0 items-center justify-center gap-1 rounded-xl px-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 sm:h-auto sm:px-3 sm:py-2"
                    aria-label="Choose language"
                >
                    <Globe className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="hidden uppercase sm:inline">{isClient ? selectedLanguage : "en"}</span>
                </button>
                <button 
                    onClick={handleSearch}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white transition-colors hover:bg-red-700 sm:m-2 sm:h-auto sm:w-auto sm:px-8 sm:py-4 sm:text-base sm:font-semibold"
                    aria-label="Search"
                >
                    <Search className="h-5 w-5 sm:hidden" />
                    <span className="hidden sm:inline">Search</span>
                </button>
            </div>

            {/* Language Selector Dropdown */}
            {isClient && showLanguageSelector && (
                <div className="absolute top-full right-0 mt-3 z-[99999] w-72 bg-white dark:bg-gray-950 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                        <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Select Language
                        </div>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`w-full px-4 py-3 flex items-center gap-3 text-left rounded-xl transition-all duration-200 ${
                                    selectedLanguage === lang.code 
                                    ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" 
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    selectedLanguage === lang.code ? "bg-red-100 dark:bg-red-900/50" : "bg-gray-100 dark:bg-gray-800"
                                }`}>
                                    <Globe className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm tracking-tight">
                                        {lang.name}
                                    </div>
                                    <div className="text-[10px] opacity-60 uppercase font-medium">
                                        {lang.code}
                                    </div>
                                </div>
                                {selectedLanguage === lang.code && (
                                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Predictive Dropdown */}
            {isClient && showDropdown && (
                <div className="absolute top-full left-0 w-full mt-2 z-[99998]">
                    {filteredCategories.length > 0 ? (
                        <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                                <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Suggestions
                                </div>
                                {filteredCategories.slice(0, 10).map((category, index) => (
                                    <button
                                        key={`${category.type}-${category.slug}-${index}`}
                                        onClick={() => handleCategorySelect(category)}
                                        className={`w-full px-4 py-3 flex items-center gap-3 text-left rounded-xl transition-all duration-200 ${
                                            index === selectedIndex 
                                            ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" 
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                                        }`}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ 
                                                backgroundColor: index === selectedIndex ? "transparent" : `${category.color}15`, 
                                                color: category.color 
                                            }}
                                        >
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm tracking-tight">
                                                {category.name}
                                            </div>
                                            {category.type === 'subcategory' && (
                                                <div className="text-[10px] opacity-60 uppercase font-medium">
                                                    in {category.categorySlug}
                                                </div>
                                            )}
                                        </div>
                                        <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${index === selectedIndex ? "translate-x-1 opacity-100" : "opacity-0"}`} />
                                    </button>
                                ))}
                            </div>
                            {filteredCategories.length > 10 && (
                                <div className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                                    +{filteredCategories.length - 10} more results
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden px-6 py-4 animate-in fade-in zoom-in duration-200">
                            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                {getNoResultsText()}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        </>
    );
}
