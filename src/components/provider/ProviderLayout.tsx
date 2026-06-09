"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Briefcase,
  User,
  Wrench,
  DollarSign,
  Star,
  MessageSquare,
  Bell,
  CheckCircle,
  Clock,
  Calendar,
  BarChart3,
  Award,
  ChevronDown,
  LogOut,
  Settings,
  CreditCard,
  Shield,
  FileText,
  Moon,
  Smartphone,
  Home,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { logoutClientSession } from "@/lib/auth/logout-client";
import { InsuranceNotice } from "@/components/safety/InsuranceNotice";

interface ProviderLayoutProps {
  children: React.ReactNode;
}

// Desktop sidebar items (all items)
const sidebarItems = [
  { icon: Briefcase, label: "Live Jobs", href: "/pro" },
  { icon: Search, label: "Browse Jobs", href: "/pro/jobs" },
  { icon: Calendar, label: "Shift Board", href: "/pro/shifts" },
  { icon: User, label: "Profile", href: "/pro/profile" },
  { icon: Wrench, label: "My Services", href: "/pro/services" },
  { icon: DollarSign, label: "Earnings", href: "/pro/earnings" },
  { icon: Star, label: "Reviews", href: "/pro/reviews" },
  { icon: MessageSquare, label: "Messages", href: "/pro/messages" },
  { icon: Bell, label: "Notifications", href: "/pro/notifications" },
  { icon: CheckCircle, label: "Completed", href: "/pro/completed" },
  { icon: Clock, label: "Pending", href: "/pro/pending" },
  { icon: BarChart3, label: "Analytics", href: "/pro/analytics" },
  { icon: Award, label: "Badges", href: "/pro/badges" },
];

// Mobile bottom nav items (main 5 items only)
const bottomNavItems = [
  { icon: Home, label: "Home", href: "/pro" },
  { icon: Briefcase, label: "Jobs", href: "/pro/jobs" },
  { icon: Calendar, label: "Shifts", href: "/pro/shifts" },
  { icon: MessageSquare, label: "Chat", href: "/pro/messages" },
  { icon: User, label: "Profile", href: "/pro/profile" },
];

// Extended profile menu items for mobile
const profileMenuItems = [
  { icon: User, label: "My Profile", href: "/pro/profile", color: "text-gray-700" },
  { icon: Wrench, label: "My Services", href: "/pro/services", color: "text-gray-700" },
  { icon: DollarSign, label: "Earnings", href: "/pro/earnings", color: "text-gray-700" },
  { icon: Star, label: "Reviews & Ratings", href: "/pro/reviews", color: "text-gray-700" },
  { icon: Bell, label: "Notifications", href: "/pro/notifications", color: "text-gray-700" },
  { icon: Award, label: "Badges & Achievements", href: "/pro/badges", color: "text-gray-700" },
  { icon: BarChart3, label: "Analytics", href: "/pro/analytics", color: "text-gray-700" },
  { icon: CreditCard, label: "Collection Settings", href: "/pro/earnings", color: "text-gray-700" },
  { icon: Shield, label: "Verification", href: "/pro/profile?tab=verification", color: "text-gray-700" },
  { icon: FileText, label: "Help & Support", href: "/pro/help", color: "text-gray-700" },
  { icon: Moon, label: "Dark Mode", href: "#", color: "text-gray-700", isToggle: true },
  { icon: Smartphone, label: "Get the App", href: "#", color: "text-gray-700" },
];

export function ProviderLayout({ children }: ProviderLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const showDashboardInsuranceNotice = !pathname?.includes("/notifications");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" }).catch(() => null);
        const sessionPayload = sessionResponse?.ok ? await sessionResponse.json().catch(() => null) : null;

        if (sessionPayload?.user) {
          setUser({
            id: sessionPayload.user.id,
            email: sessionPayload.user.email,
            user_metadata: {
              first_name: sessionPayload.user.displayName,
              role: sessionPayload.user.role,
            },
          } as unknown as SupabaseUser);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setUser(null);
    await logoutClientSession();
    router.replace('/login');
    router.refresh();
  };

  const toggleDarkMode = () => {
    setDarkMode((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-red-600" />
          <p className="text-sm font-medium text-gray-700">Loading provider workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <Briefcase className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Provider login required</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with a provider account to view jobs, bids, services, and KYC details.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/login" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              Log in
            </Link>
            <Link href="/signup?role=provider" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Create provider account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 lg:block hidden">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/anyjoblogo-wordmark.png"
                alt="AnyJob"
                width={286}
                height={96}
                className="h-10 w-auto"
              />
            </Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              Provider
            </span>
          </div>

          {/* Right side - Notifications & Profile */}
          <div className="flex items-center gap-3">
            <NotificationBell href="/pro/notifications" accent="green" />
            
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-full"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.user_metadata?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'J'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Provider'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {/* Desktop Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/pro/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Account Settings
                  </Link>
                  <Link
                    href="/pro/help"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Help & Support
                  </Link>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/anyjoblogo-wordmark.png"
                alt="AnyJob"
                width={286}
                height={96}
                className="h-9 w-auto"
              />
            </Link>
            <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              Pro
            </span>
          </div>

          {/* Right side - Notifications & Menu */}
          <div className="flex items-center gap-2">
            <NotificationBell href="/pro/notifications" accent="green" />
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              {loading ? (
                <div className="w-6 h-6 bg-gray-300 rounded-full animate-pulse" />
              ) : (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                  {user?.user_metadata?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'J'}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Profile Menu Sheet */}
        {profileDropdownOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setProfileDropdownOpen(false)}
            />
            <div className="absolute top-14 left-0 right-0 bg-white z-50 border-b border-gray-200 lg:hidden max-h-[calc(100vh-14rem)] overflow-y-auto">
              {/* User Info Header */}
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                    {user?.user_metadata?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'J'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Provider'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{user?.email || 'provider@anyjob.com'}</p>
                    <span className="inline-flex items-center px-2 py-0.5 mt-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Verified Pro
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Grid */}
              <div className="p-4 grid grid-cols-3 gap-3 border-b border-gray-100">
                <Link
                  href="/pro/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Profile</span>
                </Link>
                <Link
                  href="/pro/earnings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Earnings</span>
                </Link>
                <button type="button" onClick={toggleDarkMode} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors" aria-pressed={darkMode}>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Moon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{darkMode ? "Light Mode" : "Dark Mode"}</span>
                </button>
              </div>

              {/* Menu List */}
              <div className="py-2">
                {profileMenuItems.slice(0, 6).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    >
                      <Icon className={`w-5 h-5 ${item.color}`} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Logout */}
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium active:bg-red-100"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      <div className="flex min-h-0 flex-1 lg:flex-row flex-col">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="p-4 pt-12 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-red-50 text-red-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-red-600" : "text-gray-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          {showDashboardInsuranceNotice ? (
            <div className="mb-4 lg:mb-6">
              <InsuranceNotice accent="green" />
            </div>
          ) : null}
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden mobile-bottom-nav">
        <div className="grid grid-cols-5 h-16">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors relative",
                  isActive ? "text-green-600" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-8 h-1 bg-green-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
