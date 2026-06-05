"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Search, Settings } from "lucide-react";
import { adminNavItems } from "./admin-data";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function AdminShell({ title, description, children, actions }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-slate-950 text-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link href="/admin" className="text-2xl font-bold tracking-tight">
            AnyJob
          </Link>
          <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-200">
            Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {adminNavItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white",
                  active && "bg-white text-slate-950 hover:bg-white hover:text-slate-950"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-sm font-medium">Live data mode</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Tables read Supabase server-side. Write actions need audited admin mutation endpoints before production use.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link href="/admin" className="text-xl font-bold text-red-600 lg:hidden">
              AnyJob
            </Link>
            <div className="relative hidden flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Search admin"
                placeholder="Search users, providers, jobs, tickets..."
                className="h-10 w-full max-w-xl rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <Link aria-label="Admin settings" href="/admin/settings" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
              <Settings className="h-4 w-4" />
            </Link>
            <Link aria-label="Admin notifications" href="/admin/support" className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
            </Link>
            <Link aria-label="Log out" href="/login" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-red-600">Operations console</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
