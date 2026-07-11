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
  Search,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { logoutClientSession } from "@/lib/auth/logout-client";
import { InsuranceNotice } from "@/components/safety/InsuranceNotice";

interface ProviderLayoutProps {
  children: React.ReactNode;
}

type ProviderWorkMode = "freelance" | "shift" | "both" | string | null | undefined;

type ProviderNavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  requiresShifts?: boolean;
};

type ProviderSessionUser = {
  id: string;
  email?: string;
  displayName?: string;
  role?: string;
  providerWorkMode?: ProviderWorkMode;
  canWorkShifts?: boolean | null;
};

function allowsShiftWork(canWorkShifts: boolean | null | undefined, providerWorkMode: ProviderWorkMode) {
  return Boolean(canWorkShifts || providerWorkMode === "shift" || providerWorkMode === "both");
}

// Desktop sidebar items (all items)
const sidebarItems: ProviderNavItem[] = [
  { icon: Briefcase, label: "Live Jobs", href: "/pro" },
  { icon: Search, label: "Browse Jobs", href: "/pro/jobs" },
  { icon: Calendar, label: "Work shifts", href: "/pro/shifts", requiresShifts: true },
  { icon: User, label: "Profile", href: "/pro/profile" },
  { icon: Wrench, label: "My Services", href: "/pro/services" },
  { icon: DollarSign, label: "Earnings", href: "/pro/earnings" },
  { icon: Star, label: "Reviews", href: "/pro/reviews" },
  { icon: MessageSquare, label: "Messages", href: "/pro/messages" },
  { icon: Bell, label: "Notifications", href: "/pro/notifications" },
  { icon: CheckCircle, label: "Completed", href: "/pro/completed" },
  { icon: Clock, label: "Pending", href: "/pro/pending" },
  { icon: BarChart3, label: "Analytics", href: "/pro/analytics" },
  { icon: Award, label: "Milestones", href: "/pro/milestones" },
  { icon: FileText, label: "Help & Support", href: "/pro/help" },
];

// Mobile bottom nav items (main 5 items only)
const bottomNavItems: ProviderNavItem[] = [
  { icon: Home, label: "Home", href: "/pro" },
  { icon: Briefcase, label: "Jobs", href: "/pro/jobs" },
  { icon: Calendar, label: "Work shifts", href: "/pro/shifts", requiresShifts: true },
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
  { icon: Award, label: "Milestones & Badges", href: "/pro/milestones", color: "text-gray-700" },
  { icon: BarChart3, label: "Analytics", href: "/pro/analytics", color: "text-gray-700" },
  { icon: CreditCard, label: "Collection Settings", href: "/pro/earnings", color: "text-gray-700" },
  { icon: Shield, label: "Verification", href: "/pro/profile?tab=verification", color: "text-gray-700" },
  { icon: FileText, label: "Help & Support", href: "/pro/help", color: "text-gray-700" },
  { icon: Moon, label: "Dark Mode", href: "#", color: "text-gray-700", isToggle: true },
  { icon: Smartphone, label: "Get the App", href: "#", color: "text-gray-700" },
];

function pathOnly(href: string) {
  return href.split("?")[0] || href;
}

function matchesNavPath(activePath: string | null | undefined, href: string, rootHref: string) {
  const itemPath = pathOnly(href);
  if (!activePath) return false;
  if (itemPath === rootHref) return activePath === rootHref;
  return activePath === itemPath || activePath.startsWith(`${itemPath}/`);
}

function ProviderNavigationPending({ label }: { label: string }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="h-1 w-full overflow-hidden rounded-full bg-green-100">
        <div className="h-full w-1/3 rounded-full bg-green-600 motion-safe:animate-pulse" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-green-700">Opening {label}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="h-24 rounded-lg bg-gray-100 motion-safe:animate-pulse" />
          <div className="h-24 rounded-lg bg-gray-100 motion-safe:animate-pulse" />
          <div className="h-24 rounded-lg bg-gray-100 motion-safe:animate-pulse" />
          <div className="h-24 rounded-lg bg-gray-100 motion-safe:animate-pulse" />
        </div>
        <div className="mt-5 h-56 rounded-lg bg-gray-100 motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

export function ProviderLayout({ children }: ProviderLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [canSeeShiftBoard, setCanSeeShiftBoard] = useState(false);
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const activePath = optimisticPath || pathname;
  const showDashboardInsuranceNotice = !pathname?.includes("/notifications");
  const visibleSidebarItems = useMemo(
    () => sidebarItems.filter((item) => !item.requiresShifts || canSeeShiftBoard),
    [canSeeShiftBoard]
  );
  const visibleBottomNavItems = useMemo(
    () => bottomNavItems.filter((item) => !item.requiresShifts || canSeeShiftBoard),
    [canSeeShiftBoard]
  );
  const pendingNavigationLabel = useMemo(() => {
    const pendingItem = [...visibleSidebarItems, ...visibleBottomNavItems, ...profileMenuItems]
      .find((item) => pathOnly(item.href) === optimisticPath);
    return pendingItem?.label || "page";
  }, [optimisticPath, visibleBottomNavItems, visibleSidebarItems]);
  const isPendingNavigation = Boolean(optimisticPath && optimisticPath !== pathname);

  const markNavigation = (href: string, event?: React.MouseEvent<HTMLAnchorElement>) => {
    if (href === "#") return;
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return;
    const nextPath = pathOnly(href);
    setOptimisticPath(nextPath);
    router.prefetch(nextPath);
  };

  const isNavActive = (href: string) => matchesNavPath(activePath, href, "/pro");

  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  useEffect(() => {
    const hrefs = [...visibleSidebarItems, ...visibleBottomNavItems, ...profileMenuItems]
      .map((item) => pathOnly(item.href))
      .filter((href) => href && href !== "#");

    for (const href of Array.from(new Set(hrefs))) {
      router.prefetch(href);
    }
  }, [router, visibleBottomNavItems, visibleSidebarItems]);

  useEffect(() => {
    let cancelled = false;
    const loadingFallback = window.setTimeout(() => {
      if (!cancelled) {
        console.warn("Provider workspace session check timed out.");
        setCanSeeShiftBoard(false);
        setLoading(false);
      }
    }, 8000);

    const fetchUser = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 6000);
      try {
        const sessionResponse = await fetch("/api/auth/session", { cache: "no-store", signal: controller.signal }).catch(() => null);
        const sessionPayload = sessionResponse?.ok ? await sessionResponse.json().catch(() => null) : null;

        if (sessionPayload?.user) {
          if (cancelled) return;
          const sessionUser = sessionPayload.user as ProviderSessionUser;
          setUser({
            id: sessionUser.id,
            email: sessionUser.email,
            user_metadata: {
              first_name: sessionUser.displayName,
              role: sessionUser.role,
            },
          } as unknown as SupabaseUser);
          setCanSeeShiftBoard(allowsShiftWork(sessionUser.canWorkShifts, sessionUser.providerWorkMode));
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        setUser(user);
        if (user) {
          const { data: seller } = await supabase
            .from("sellers")
            .select("provider_work_mode, can_work_shifts")
            .eq("id", user.id)
            .maybeSingle();

          setCanSeeShiftBoard(allowsShiftWork(seller?.can_work_shifts, seller?.provider_work_mode));
        } else {
          setCanSeeShiftBoard(false);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        window.clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setCanSeeShiftBoard(false);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(loadingFallback);
      subscription.unsubscribe();
    };
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
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-clip pt-14 lg:pt-16">
      {/* Desktop Header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-white border-b border-gray-200 lg:block hidden">
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
            <NotificationBell href="/pro/notifications" accent="green" showInsuranceNotice />
            
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
                    onClick={(event) => {
                      markNavigation("/pro/profile", event);
                      setProfileDropdownOpen(false);
                    }}
                  >
                    <User className="w-4 h-4" />
                    Account Settings
                  </Link>
                  <Link
                    href="/pro/help"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={(event) => {
                      markNavigation("/pro/help", event);
                      setProfileDropdownOpen(false);
                    }}
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
      <header className="fixed inset-x-0 top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
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
            <NotificationBell href="/pro/notifications" accent="green" showInsuranceNotice />
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
                  onClick={(event) => {
                    markNavigation("/pro/profile", event);
                    setProfileDropdownOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Profile</span>
                </Link>
                <Link
                  href="/pro/earnings"
                  onClick={(event) => {
                    markNavigation("/pro/earnings", event);
                    setProfileDropdownOpen(false);
                  }}
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
                      onClick={(event) => {
                        markNavigation(item.href, event);
                        setProfileDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 active:bg-gray-100",
                        isNavActive(item.href) ? "bg-green-50 text-green-700" : "text-gray-700"
                      )}
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

      <div className="flex flex-1 flex-col lg:block">
        {/* Desktop Sidebar */}
        <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-64 border-r border-gray-200 bg-white lg:block">
          <nav className="h-full overflow-y-auto px-4 py-5 space-y-1">
            {visibleSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onMouseEnter={() => router.prefetch(item.href)}
                  onFocus={() => router.prefetch(item.href)}
                  onClick={(event) => markNavigation(item.href, event)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors active:scale-[0.99]",
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
        <main className="w-full flex-1 min-h-[calc(100vh-8rem)] overflow-visible p-4 pb-24 lg:ml-64 lg:w-[calc(100%-16rem)] lg:p-6 lg:pb-6">
          {showDashboardInsuranceNotice ? (
            <div className="mb-4 lg:mb-6">
              <InsuranceNotice accent="green" />
            </div>
          ) : null}
          {isPendingNavigation ? <ProviderNavigationPending label={pendingNavigationLabel} /> : children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden mobile-bottom-nav">
        <div
          className="grid h-16"
          style={{ gridTemplateColumns: `repeat(${visibleBottomNavItems.length}, minmax(0, 1fr))` }}
        >
          {visibleBottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                onClick={(event) => markNavigation(item.href, event)}
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
