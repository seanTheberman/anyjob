"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Bell, LogOut, Search, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { adminNavItems } from "./admin-data";
import { logoutClientSession } from "@/lib/auth/logout-client";
import { InsuranceNotice } from "@/components/safety/InsuranceNotice";

function AdminPendingContent({ path }: { path: string }) {
  const target = adminNavItems.find((item) => item.href === path);
  const title = target?.label || "Loading";

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-red-600">Operations console</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Loading latest admin data...</p>
        </div>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-200" />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-9 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 w-full animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 w-full animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function AdminFrame({ children, unreadNotifications }: { children: React.ReactNode; unreadNotifications: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticPath, setOptimisticPath] = useState(pathname);
  const [adminSearch, setAdminSearch] = useState("");

  useEffect(() => {
    setOptimisticPath(pathname);
  }, [pathname]);

  useEffect(() => {
    adminNavItems.forEach((item) => router.prefetch(item.href));
  }, [router]);

  async function handleLogout() {
    await logoutClientSession();
    router.replace("/admin-login");
    router.refresh();
  }

  function handleAdminSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("adminSearch") || adminSearch).trim().toLowerCase();
    if (!query) return;

    const target = query.includes("provider") || query.includes("seller") || query.includes("kyc")
      ? "/admin/providers"
      : query.includes("badge")
        ? "/admin/badges"
        : query.includes("business")
          ? "/admin/businesses"
          : query.includes("blog")
            ? "/admin/blog"
            : query.includes("job") || query.includes("booking")
              ? "/admin/jobs"
              : query.includes("report") || query.includes("export")
                ? "/admin/reports"
                : query.includes("payment") || query.includes("refund")
                  ? "/admin/payments"
                  : query.includes("support") || query.includes("ticket")
                    ? "/admin/support"
                    : query.includes("history") || query.includes("audit")
                      ? "/admin/history"
                      : query.includes("setting") || query.includes("rule")
                        ? "/admin/settings"
                        : query.includes("notification")
                          ? "/admin/notifications"
                          : "/admin/users";

    setOptimisticPath(target);
    window.location.href = target;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-slate-950 text-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link href="/admin" className="flex items-center">
            <Image
              src="/anyjoblogo-wordmark.png"
              alt="AnyJob"
              width={286}
              height={96}
              className="h-10 w-auto brightness-110"
            />
          </Link>
          <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-200">
            Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {adminNavItems.map((item) => {
            const active = optimisticPath === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => setOptimisticPath(item.href)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white",
                  active && "bg-white text-slate-950 hover:bg-white hover:text-slate-950"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {pathname !== optimisticPath && optimisticPath === item.href ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-sm font-medium">Live data mode</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Supabase reads and audited admin write actions are enabled for operations.
            </p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link href="/admin" className="flex items-center lg:hidden">
              <Image
                src="/anyjoblogo-wordmark.png"
                alt="AnyJob"
                width={286}
                height={96}
                className="h-9 w-auto"
              />
            </Link>
            <form onSubmit={handleAdminSearch} className="relative hidden flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Search admin"
                name="adminSearch"
                value={adminSearch}
                onChange={(event) => setAdminSearch(event.target.value)}
                placeholder="Search users, providers, jobs, tickets..."
                className="h-10 w-full max-w-xl rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </form>
            <Link aria-label="Admin settings" href="/admin/settings" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
              <Settings className="h-4 w-4" />
            </Link>
            <Link aria-label="Admin notifications" href="/admin/notifications" className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 ? (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
              ) : null}
            </Link>
            <button type="button" aria-label="Log out" onClick={handleLogout} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div>
          <div className="px-4 pt-6 sm:px-6 lg:px-8">
            <InsuranceNotice accent="slate" />
          </div>
          {pathname !== optimisticPath ? <AdminPendingContent path={optimisticPath} /> : children}
        </div>
      </div>
    </div>
  );
}
