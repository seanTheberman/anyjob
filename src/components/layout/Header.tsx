"use client";

import Link from "next/link";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    Bell,
    ChevronDown,
    ClipboardList,
    Menu,
    X,
    LayoutDashboard,
    LogOut,
    UserCircle,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
    getTaskrabbitCategoryHref,
    getTaskrabbitServiceHref,
    TASKRABBIT_CATEGORIES,
} from "@/lib/taskrabbit-categories";

const NAV_LINKS = [
    { href: "/tasks", label: "Browse Jobs" },
    { href: "/search", label: "Find a Provider" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/become-provider", label: "Become a Provider" },
    { href: "/register-business", label: "Register as a Business" },
];

type HeaderAccount = {
    id: string;
    email?: string | null;
    role: string;
    displayName: string;
    hasBusinessProfile: boolean;
};

const HEADER_ACCOUNT_CACHE_KEY = "anyjob.headerAccount";
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function getCachedHeaderAccount(): HeaderAccount | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(HEADER_ACCOUNT_CACHE_KEY);
        return raw ? JSON.parse(raw) as HeaderAccount : null;
    } catch {
        return null;
    }
}

function setCachedHeaderAccount(account: HeaderAccount | null) {
    if (typeof window === "undefined") return;
    try {
        if (account) {
            window.localStorage.setItem(HEADER_ACCOUNT_CACHE_KEY, JSON.stringify(account));
        } else {
            window.localStorage.removeItem(HEADER_ACCOUNT_CACHE_KEY);
        }
    } catch {
        // Ignore storage failures; session refresh still works.
    }
}

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const isHomePage = pathname === "/";
    const [isScrolled, setIsScrolled] = useState(!isHomePage);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [categoriesMenuOpen, setCategoriesMenuOpen] = useState(false);
    const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [account, setAccount] = useState<HeaderAccount | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
    const [authResolved, setAuthResolved] = useState(false);
    const categoriesMenuRef = useRef<HTMLDivElement>(null);
    const accountMenuRef = useRef<HTMLDivElement>(null);

    useIsomorphicLayoutEffect(() => {
        const cachedAccount = getCachedHeaderAccount();
        if (!cachedAccount) return;

        setAccount(cachedAccount);
        setUserRole(cachedAccount.role || "client");
        setHasBusinessProfile(Boolean(cachedAccount.hasBusinessProfile));
        setAuthResolved(true);
    }, []);

    useEffect(() => {
        let mounted = true;
        const supabase = createClient();

        async function loadUser() {
            const cachedAccount = getCachedHeaderAccount();
            if (mounted && cachedAccount) {
                setAccount(cachedAccount);
                setUserRole(cachedAccount.role || "client");
                setHasBusinessProfile(Boolean(cachedAccount.hasBusinessProfile));
                setAuthResolved(true);
            }

            const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" }).catch(() => null);
            const sessionPayload = sessionResponse?.ok ? await sessionResponse.json().catch(() => null) : null;
            const serverAccount = (sessionPayload?.user || null) as HeaderAccount | null;

            if (!mounted) return;

            if (serverAccount) {
                setUser(null);
                setAccount(serverAccount);
                setUserRole(serverAccount.role || "client");
                setHasBusinessProfile(Boolean(serverAccount.hasBusinessProfile));
                setCachedHeaderAccount(serverAccount);
                setAuthResolved(true);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            let currentUser = session?.user || null;

            if (!currentUser) {
                const { data: userData } = await supabase.auth.getUser();
                currentUser = userData.user;
            }

            if (!mounted) return;
            setUser(currentUser);
            setAccount(null);

            if (currentUser) {
                const { data: profile } = await supabase
                    .from("eloo_profiles")
                    .select("role, has_business_profile, business_registration_status")
                    .eq("id", currentUser.id)
                    .maybeSingle();
                if (mounted) {
                    setUserRole(profile?.role || currentUser.user_metadata?.role || "client");
                    setHasBusinessProfile(Boolean(profile?.has_business_profile || currentUser.user_metadata?.account_kind === "business"));
                    setCachedHeaderAccount({
                        id: currentUser.id,
                        email: currentUser.email,
                        role: profile?.role || currentUser.user_metadata?.role || "client",
                        displayName: currentUser.user_metadata?.first_name || currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Account",
                        hasBusinessProfile: Boolean(profile?.has_business_profile || currentUser.user_metadata?.account_kind === "business"),
                    });
                    setAuthResolved(true);
                }
            } else {
                setUserRole(null);
                setHasBusinessProfile(false);
                setAccount(null);
                setCachedHeaderAccount(null);
                setAuthResolved(true);
            }
        }

        loadUser();
        window.addEventListener("focus", loadUser);
        document.addEventListener("visibilitychange", loadUser);
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadUser());
        return () => {
            mounted = false;
            window.removeEventListener("focus", loadUser);
            document.removeEventListener("visibilitychange", loadUser);
            subscription.unsubscribe();
        };
    }, [pathname]);

    useEffect(() => {
        if (!isHomePage) {
            return;
        }

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        
        handleScroll();
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isHomePage]);

    useEffect(() => {
        function closeCategoriesMenu(event: MouseEvent) {
            if (
                categoriesMenuRef.current &&
                !categoriesMenuRef.current.contains(event.target as Node)
            ) {
                setCategoriesMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", closeCategoriesMenu);
        return () => document.removeEventListener("mousedown", closeCategoriesMenu);
    }, []);

    useEffect(() => {
        function closeAccountMenu(event: MouseEvent) {
            if (
                accountMenuRef.current &&
                !accountMenuRef.current.contains(event.target as Node)
            ) {
                setAccountMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", closeAccountMenu);
        return () => document.removeEventListener("mousedown", closeAccountMenu);
    }, []);

    // Force scrolled state (white background/dark text) on non-home pages
    const showSolidStyle = !isHomePage || isScrolled;
    const navLinkClass = showSolidStyle
        ? "text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
        : "text-white/90 hover:text-white hover:bg-white/10";
    const isAuthenticated = Boolean(user || account);
    const dashboardHref = userRole === "admin" ? "/admin" : userRole === "provider" || userRole === "seller" ? "/pro" : hasBusinessProfile ? "/dashboard/business" : "/dashboard";
    const isProviderAccount = userRole === "provider" || userRole === "seller";
    const displayName =
        account?.displayName ||
        user?.user_metadata?.first_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Account";
    const visibleNavLinks = NAV_LINKS.filter((link) => {
        if (!authResolved && !isAuthenticated) {
            return link.href === "/search";
        }

        if (link.href === "/tasks") {
            return isAuthenticated && isProviderAccount;
        }

        if (isAuthenticated) {
            return !["/how-it-works", "/become-provider", "/register-business"].includes(link.href);
        }

        return true;
    });

    async function handleLogout() {
        if (loggingOut) return;
        setLoggingOut(true);
        const supabase = createClient();
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        await supabase.auth.signOut().catch(() => null);
        setUser(null);
        setAccount(null);
        setCachedHeaderAccount(null);
        setUserRole(null);
        setAuthResolved(true);
        setAccountMenuOpen(false);
        router.replace("/");
        router.refresh();
    }

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-[100001] transition-all duration-300 ${showSolidStyle
                ? "bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-lg shadow-black/5 border-b"
                : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className={`text-2xl sm:text-3xl font-cursive font-bold transition-colors duration-300 ${showSolidStyle ? 'text-red-500' : 'text-white'}`}>
                            AnyJob
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-1">
                        <div ref={categoriesMenuRef} className="relative">
                            <button
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={categoriesMenuOpen}
                                onClick={() => setCategoriesMenuOpen((open) => !open)}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${navLinkClass}`}
                            >
                                Categories
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${categoriesMenuOpen ? "rotate-180" : ""}`}
                                    aria-hidden="true"
                                />
                            </button>
                            {categoriesMenuOpen && (
                                <div
                                    role="menu"
                                    aria-label="Categories"
                                    className="fixed left-1/2 top-20 z-[100002] max-h-[72vh] w-[min(calc(100vw-2rem),72rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 text-gray-900 shadow-2xl shadow-black/15 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                                >
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                        {TASKRABBIT_CATEGORIES.map((category) => (
                                            <div key={category.slug} className="min-w-0">
                                                <Link
                                                    href={getTaskrabbitCategoryHref(category)}
                                                    onClick={() => setCategoriesMenuOpen(false)}
                                                    className="block rounded-lg px-2 py-1.5 text-sm font-bold text-gray-950 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-white dark:hover:bg-red-950/40"
                                                >
                                                    {category.title}
                                                </Link>
                                                <div className="mt-1 space-y-0.5">
                                                    {category.services.map((service) => (
                                                        <Link
                                                            key={`${category.slug}-${service.slug}`}
                                                            role="menuitem"
                                                            href={getTaskrabbitServiceHref(service)}
                                                            onClick={() => setCategoriesMenuOpen(false)}
                                                            className="block rounded-md px-2 py-1 text-xs leading-5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-gray-900"
                                                        >
                                                            {service.title}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {visibleNavLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${navLinkClass}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                        {!authResolved && !isAuthenticated ? (
                            <div className="h-10 w-24 rounded-full bg-gray-100/80 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800" aria-hidden="true" />
                        ) : isAuthenticated ? (
                            <div ref={accountMenuRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setAccountMenuOpen((open) => !open)}
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg shadow-black/10 ring-1 ring-gray-200 hover:bg-gray-50"
                                >
                                    <UserCircle className="h-5 w-5 text-red-500" />
                                    {displayName}
                                    <ChevronDown className={`h-4 w-4 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
                                </button>
                                {accountMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white text-gray-900 shadow-xl">
                                        <Link href={dashboardHref} onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold hover:bg-red-50 hover:text-red-600">
                                            <LayoutDashboard className="h-4 w-4" />
                                            Dashboard
                                        </Link>
                                        {isProviderAccount ? (
                                            <Link href="/pro/notifications" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                                <Bell className="h-4 w-4" />
                                                Notifications
                                            </Link>
                                        ) : (
                                            <>
                                                <Link href="/dashboard/requests" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                                    <ClipboardList className="h-4 w-4" />
                                                    My requests
                                                </Link>
                                                <Link href="/dashboard/account?tab=notifications" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                                    <Bell className="h-4 w-4" />
                                                    Notifications
                                                </Link>
                                            </>
                                        )}
                                        <button type="button" onClick={handleLogout} disabled={loggingOut} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-wait disabled:opacity-70">
                                            <LogOut className="h-4 w-4" />
                                            {loggingOut ? "Logging out..." : "Logout"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/40"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu */}
                    <button
                        id="mobile-menu-trigger"
                        type="button"
                        aria-label="Open menu"
                        aria-expanded={mobileMenuOpen}
                        onMouseUp={() => setMobileMenuOpen(true)}
                        onTouchEnd={(event) => {
                            event.preventDefault();
                            setMobileMenuOpen(true);
                        }}
                        onClick={() => setMobileMenuOpen(true)}
                        className="lg:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Menu className="w-5 h-5 pointer-events-none" />
                        <span className="sr-only">Open menu</span>
                    </button>
                </div>
            </div>
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[100002] lg:hidden">
                    <button
                        type="button"
                        aria-label="Close menu backdrop"
                        className="absolute inset-0 bg-black/20"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile navigation"
                        className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-2xl dark:bg-gray-950"
                    >
                        <div className="flex items-center justify-between border-b p-6">
                            <span className="text-2xl font-cursive font-bold text-red-600">
                                AnyJob
                            </span>
                            <button
                                type="button"
                                aria-label="Close menu"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                            <button
                                type="button"
                                aria-expanded={mobileCategoriesOpen}
                                onClick={() => setMobileCategoriesOpen((open) => !open)}
                                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-700 transition-all hover:bg-red-50 hover:text-red-600 dark:text-gray-200 dark:hover:bg-red-950/50"
                            >
                                <span>Categories</span>
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${mobileCategoriesOpen ? "rotate-180" : ""}`}
                                    aria-hidden="true"
                                />
                            </button>
                            {mobileCategoriesOpen && (
                                <div className="mb-2 max-h-96 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
                                    {TASKRABBIT_CATEGORIES.map((category) => (
                                        <details key={category.slug} className="group rounded-lg">
                                            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-white dark:text-white dark:hover:bg-gray-800">
                                                {category.title}
                                                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                                            </summary>
                                            <div className="pb-2 pl-3 pr-1">
                                                <Link
                                                    href={getTaskrabbitCategoryHref(category)}
                                                    onClick={() => {
                                                        setMobileMenuOpen(false);
                                                        setMobileCategoriesOpen(false);
                                                    }}
                                                    className="block rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-white dark:hover:bg-gray-800"
                                                >
                                                    View all {category.title}
                                                </Link>
                                                {category.services.map((service) => (
                                                    <Link
                                                        key={`${category.slug}-${service.slug}`}
                                                        href={getTaskrabbitServiceHref(service)}
                                                        onClick={() => {
                                                            setMobileMenuOpen(false);
                                                            setMobileCategoriesOpen(false);
                                                        }}
                                                        className="block rounded-md px-3 py-1.5 text-xs leading-5 text-gray-600 hover:bg-white hover:text-red-600 dark:text-gray-300 dark:hover:bg-gray-800"
                                                    >
                                                        {service.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            )}
                            {visibleNavLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 transition-all"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="p-4 border-t space-y-2">
                            {!authResolved && !isAuthenticated ? (
                                <div className="h-11 w-full rounded-xl bg-gray-100" aria-hidden="true" />
                            ) : isAuthenticated ? (
                                <>
                                    <Link
                                        href={dashboardHref}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-red-500/25"
                                    >
                                        {displayName} dashboard
                                    </Link>
                                    {isProviderAccount ? (
                                        <Link
                                            href="/pro/notifications"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700"
                                        >
                                            Notifications
                                        </Link>
                                    ) : (
                                        <Link
                                            href="/dashboard/requests"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700"
                                        >
                                            My requests
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        disabled={loggingOut}
                                        className="block w-full rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600 disabled:cursor-wait disabled:opacity-70"
                                    >
                                        {loggingOut ? "Logging out..." : "Logout"}
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/40"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
