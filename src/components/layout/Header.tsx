"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
    Menu,
    X,
} from "lucide-react";

const NAV_LINKS = [
    { href: "/search", label: "Find a Provider" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/become-provider", label: "Become a Provider" },
];

export function Header() {
    const pathname = usePathname();
    const isHomePage = pathname === "/";
    const [isScrolled, setIsScrolled] = useState(!isHomePage);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    // Force scrolled state (white background/dark text) on non-home pages
    const showSolidStyle = !isHomePage || isScrolled;

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
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${showSolidStyle
                                    ? "text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                    : "text-white/90 hover:text-white hover:bg-white/10"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link
                            href="/login"
                            className="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/40"
                        >
                            Login
                        </Link>
                    </div>

                    {/* Mobile Menu */}
                    <button
                        id="mobile-menu-trigger"
                        type="button"
                        aria-label="Open menu"
                        aria-expanded={mobileMenuOpen}
                        onPointerDown={() => setMobileMenuOpen(true)}
                        onTouchStart={() => setMobileMenuOpen(true)}
                        onClick={() => setMobileMenuOpen(true)}
                        className="lg:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
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
                        <nav className="flex-1 p-4 space-y-1">
                            {NAV_LINKS.map((link) => (
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
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/40"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
