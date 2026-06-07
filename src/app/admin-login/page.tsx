"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.user) {
      setError(payload.error || "Invalid admin credentials.");
      setLoading(false);
      return;
    }

    const role = String(payload.user.role || "").toLowerCase();
    if (role !== "admin") {
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
      setError("This account is not authorized for the admin console.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl md:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-slate-900 p-8 text-white sm:p-10">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-8 text-3xl font-black tracking-tight">Admin console</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Secure access for AnyJob operations only. Admin accounts are checked after authentication before the console is opened.
            </p>
            <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Email/password access only. OAuth and magic links are disabled for admin entry.
            </div>
          </div>

          <div className="p-8 text-slate-950 sm:p-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-red-600">Restricted area</p>
              <h2 className="mt-2 text-2xl font-black">Admin login</h2>
            </div>

            {error ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="admin-email" className="text-sm font-semibold text-slate-700">
                  Admin email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  placeholder="admin@anyjob.eu"
                />
              </div>

              <div>
                <label htmlFor="admin-password" className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-slate-200 px-10 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    placeholder="Admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? "Checking access..." : "Enter admin console"}
              </button>
            </form>

            <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-slate-500 hover:text-slate-900">
              Use regular user login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
