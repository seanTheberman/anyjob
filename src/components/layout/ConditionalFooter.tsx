"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Footer } from "@/components/layout/Footer";

export function ConditionalFooter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Don't show footer on dashboard routes or when from_dashboard=true
  const isDashboardRoute = pathname?.startsWith('/dashboard') || 
                           pathname?.startsWith('/pro') || 
                           pathname?.startsWith('/admin') ||
                           pathname === '/admin-login' ||
                           searchParams?.get('from_dashboard') === 'true';
  
  if (isDashboardRoute) {
    return null;
  }
  
  return <Footer />;
}
