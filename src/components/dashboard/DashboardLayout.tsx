"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  ClipboardList,
  Mail,
  UserCircle,
  HelpCircle,
  MessageSquare,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  CreditCard,
  MapPin,
  Shield,
  FileText,
  Moon,
  Smartphone,
  Heart,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Desktop sidebar items (all items)
const sidebarItems = [
  { icon: LayoutGrid, label: "Reception", href: "/dashboard" },
  { icon: ClipboardList, label: "My requests", href: "/dashboard/requests" },
  { icon: Building2, label: "Business", href: "/dashboard/business" },
  { icon: Mail, label: "Mail", href: "/dashboard/mail" },
  { icon: UserCircle, label: "Account", href: "/dashboard/account" },
  { icon: MessageSquare, label: "Assistance", href: "/dashboard/assistance" },
  { icon: HelpCircle, label: "Help", href: "/dashboard/help" },
];

// Mobile bottom nav items (main 5 items only)
const bottomNavItems = [
  { icon: LayoutGrid, label: "Home", href: "/dashboard" },
  { icon: ClipboardList, label: "Requests", href: "/dashboard/requests" },
  { icon: Building2, label: "Business", href: "/dashboard/business" },
  { icon: UserCircle, label: "Profile", href: "/dashboard/account" },
  { icon: Heart, label: "Saved", href: "/dashboard/saved" },
];

// Extended profile menu items for mobile
const profileMenuItems = [
  { icon: Settings, label: "Account Settings", href: "/dashboard/account", color: "text-gray-700" },
  { icon: MapPin, label: "Addresses", href: "/dashboard/account?tab=addresses", color: "text-gray-700" },
  { icon: CreditCard, label: "Booking Token Payment", href: "/dashboard/account?tab=payment", color: "text-gray-700" },
  { icon: Bell, label: "Notifications", href: "/dashboard/account?tab=notifications", color: "text-gray-700" },
  { icon: Shield, label: "Security & Privacy", href: "/dashboard/account?tab=security", color: "text-gray-700" },
  { icon: FileText, label: "Terms & Policies", href: "/dashboard/help", color: "text-gray-700" },
  { icon: Moon, label: "Dark Mode", href: "#", color: "text-gray-700", isToggle: true },
  { icon: Smartphone, label: "Get the App", href: "#", color: "text-gray-700" },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* Top Navigation - Desktop Only Header */}
      <header className="fixed left-0 right-0 top-0 z-50 bg-white border-b border-gray-200 lg:block hidden">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl sm:text-3xl font-cursive font-bold transition-colors duration-300 text-red-600 hover:text-red-700">
                AnyJob
              </span>
            </Link>
          </div>

          {/* Center - Request a service button */}
          <div className="hidden md:block">
            <Link
              href="/questionnaire?from_dashboard=true"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-red-700 transition-colors"
            >
              <span className="w-2 h-2 bg-white rounded-full" />
              Request a service
            </Link>
          </div>

          {/* Right side - Notifications & Profile */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard/account?tab=notifications" aria-label="Notifications" className="relative p-2 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Link>
            
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              {loading ? (
                <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
              ) : user ? (
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-full"
                >
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user.user_metadata?.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.user_metadata?.first_name || user.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              ) : (
                <Link href="/login" className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-full">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    ?
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">Login</span>
                </Link>
              )}
              
              {/* Desktop Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/dashboard/account"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </Link>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
      <header className="fixed left-0 right-0 top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-cursive font-bold text-red-600">
              AnyJob
            </span>
          </Link>

          {/* Right side - Notifications & Menu */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard/account?tab=notifications" aria-label="Notifications" className="relative p-2 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Link>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              {loading ? (
                <div className="w-6 h-6 bg-gray-300 rounded-full animate-pulse" />
              ) : user ? (
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                  {user.user_metadata?.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              ) : (
                <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium text-xs">?</div>
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
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                    {user?.user_metadata?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu Grid */}
              <div className="p-4 grid grid-cols-3 gap-3 border-b border-gray-100">
                <Link
                  href="/dashboard/account"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Settings className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Settings</span>
                </Link>
                <Link
                  href="/questionnaire"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <LayoutGrid className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">New Request</span>
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
                {profileMenuItems.slice(0, 5).map((item) => {
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

      <div className="flex flex-1 flex-col pt-14 lg:flex-row lg:pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block fixed left-0 top-16 bottom-0 z-40 w-64 bg-white border-r border-gray-200 overflow-y-auto">
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
        <main className="flex-1 min-h-[calc(100vh-8rem)] lg:ml-64 lg:min-h-[calc(100vh-4rem)] p-4 lg:p-6 pb-24 lg:pb-6">
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
                  isActive ? "text-red-600" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-8 h-1 bg-red-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
