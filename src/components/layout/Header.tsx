"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Menu,
    Search,
    User,
    Sparkles,
    Hammer,
    Shovel,
    Truck,
    Baby,
    PawPrint,
} from "lucide-react";

const NAV_LINKS = [
    { href: "/search", label: "Find a Provider" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/become-provider", label: "Become a Provider" },
];

export function Header() {
    const pathname = usePathname();
    const isHomePage = pathname === "/";
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        if (!isHomePage) {
            setIsScrolled(true);
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
                        <Link href="/login">
                            <Button className="rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 px-6">
                                Login
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger
                            id="mobile-menu-trigger"
                            aria-label="Open menu"
                            className="lg:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                            <span className="sr-only">Open menu</span>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80 p-0">
                            <div className="flex flex-col h-full">
                                <div className="p-6 border-b">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-cursive font-bold text-red-600">
                                            AnyJob
                                        </span>
                                    </div>
                                </div>
                                <nav className="flex-1 p-4 space-y-1">
                                    {NAV_LINKS.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 transition-all"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                                <div className="p-4 border-t space-y-2">
                                    <Link href="/login" className="block">
                                        <Button className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300">
                                            Login
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
