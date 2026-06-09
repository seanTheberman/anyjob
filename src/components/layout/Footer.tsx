import Link from "next/link";
import Image from "next/image";

const CATEGORY_LINKS = [
    { href: "/search?cat=menage", label: "Cleaning" },
    { href: "/search?cat=bricolage", label: "Handyman" },
    { href: "/search?cat=jardinage", label: "Gardening" },
    { href: "/search?cat=demenagement", label: "Moving" },
    { href: "/search?cat=enfants", label: "Childcare" },
    { href: "/search?cat=animaux", label: "Pet care" },
    { href: "/search?cat=informatique", label: "IT Support" },
    { href: "/search?cat=aide-domicile", label: "Home Help" },
    { href: "/search?cat=cours-particuliers", label: "Private Tutoring" },
];

const COMPANY_LINKS = [
    { href: "/how-it-works", label: "How it works" },
    { href: "/become-provider", label: "Become a provider" },
    { href: "/pricing", label: "Pricing" },
    { href: "/how-it-works#about", label: "About" },
    { href: "/dashboard/assistance/new?topic=press", label: "Press" },
];

const SUPPORT_LINKS = [
    { href: "/dashboard/help", label: "Help Center" },
    { href: "/how-it-works#trust", label: "Trust & Safety" },
    { href: "/pricing#terms", label: "Terms of Service" },
    { href: "/pricing#privacy", label: "Privacy Policy" },
];

const SOCIAL_LINKS = [
    { href: "https://twitter.com", label: "twitter" },
    { href: "https://facebook.com", label: "facebook" },
    { href: "https://instagram.com", label: "instagram" },
    { href: "https://linkedin.com", label: "linkedin" },
];

export function Footer() {
    return (
        <footer className="bg-gray-950 text-gray-300">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Image
                                src="/anyjoblogo-removebg-preview.png"
                                alt="AnyJob"
                                width={126}
                                height={46}
                                className="h-11 w-auto brightness-110"
                            />
                        </Link>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                            Find and book rated and qualified home service 
                            providers anywhere.
                        </p>
                        <div className="flex gap-3 pt-2">
                            {/* Social icons */}
                            {SOCIAL_LINKS.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-9 h-9 rounded-full bg-gray-800 hover:bg-red-600 flex items-center justify-center transition-colors duration-200"
                                    aria-label={social.label}
                                >
                                    <span className="text-xs font-bold text-gray-400 hover:text-white uppercase">
                                        {social.label[0]}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                            Services
                        </h3>
                        <ul className="space-y-2.5">
                            {CATEGORY_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                            Company
                        </h3>
                        <ul className="space-y-2.5">
                            {COMPANY_LINKS.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                            Support
                        </h3>
                        <ul className="space-y-2.5">
                            {SUPPORT_LINKS.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        {/* App Badges */}
                        <div className="mt-6 flex flex-col gap-3">
                            <a
                                href="https://www.apple.com/app-store/"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 cursor-pointer transition-colors duration-200 group"
                            >
                                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                </svg>
                                <div>
                                    <p className="text-[10px] text-gray-400 leading-none">Download on the</p>
                                    <p className="text-sm font-semibold text-white">App Store</p>
                                </div>
                            </a>
                            <a
                                href="https://play.google.com/store"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 cursor-pointer transition-colors duration-200 group"
                            >
                                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                                </svg>
                                <div>
                                    <p className="text-[10px] text-gray-400 leading-none">Get it on</p>
                                    <p className="text-sm font-semibold text-white">Google Play</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} AnyJob. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-500">
                        Made with ❤️
                    </p>
                </div>
            </div>
        </footer>
    );
}
