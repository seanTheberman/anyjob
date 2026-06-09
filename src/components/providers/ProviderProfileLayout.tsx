import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

type ProviderProfileLayoutProps = {
  children: ReactNode;
};

export function ProviderProfileLayout({ children }: ProviderProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Header />
      <main className="pt-16 sm:pt-20">{children}</main>
      <Footer />
    </div>
  );
}
