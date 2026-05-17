"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { X, Menu, Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface ProviderProfileLayoutProps {
  children: React.ReactNode;
}

export function ProviderProfileLayout({ children }: ProviderProfileLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Check user role from metadata or profiles
          const role = user.user_metadata?.role || 'client';
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setUser(session?.user || null);
      if (session?.user) {
        const role = session.user.user_metadata?.role || 'client';
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // If not logged in, use main site layout with header and footer
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="flex-1 pt-20">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // If logged in as provider, use provider dashboard layout
  if (!loading && userRole === 'provider' || userRole === 'seller') {
    return (
      <ProviderLayout>
        {children}
      </ProviderLayout>
    );
  }

  // If logged in as client, use client dashboard layout
  if (!loading && userRole === 'client') {
    return (
      <DashboardLayout>
        {children}
      </DashboardLayout>
    );
  }

  // Loading state or fallback
  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to main site layout with header and footer
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
