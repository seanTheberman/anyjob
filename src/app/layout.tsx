import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ConditionalHeader } from "@/components/layout/ConditionalHeader";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { GTranslateWidget } from "@/components/shared/GTranslateWidget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cursive = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-cursive",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AnyJob — Book the ideal service provider",
  description:
    "Find and book rated and qualified home service providers. Cleaning, DIY, gardening, moving and more.",
  keywords: [
    "home services",
    "cleaning",
    "handyman",
    "gardening",
    "moving",
    "provider",
    "AnyJob",
  ],
  openGraph: {
    title: "AnyJob — Book the ideal service provider",
    description:
      "Find and book rated and qualified home service providers.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cursive.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={null}>
          <ConditionalHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Suspense fallback={null}>
          <ConditionalFooter />
        </Suspense>
        <GTranslateWidget />
      </body>
    </html>
  );
}
