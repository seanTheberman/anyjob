"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Password reset email could not be sent.");
      } else {
        setMessage(payload.message || "If an account exists for this email, a reset link has been sent.");
      }
    } catch {
      setError("Password reset service is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50/60 via-white to-indigo-50/60 px-4 py-20">
      <Card className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border-gray-100 shadow-xl shadow-black/5">
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-indigo-500 to-purple-500" />
        <CardHeader className="px-8 pt-8 text-center">
          <CardTitle className="text-2xl font-extrabold text-gray-900">Reset your password</CardTitle>
          <CardDescription>Enter your AnyJob email and we will send a secure reset link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-8 pb-8">
          {message ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-sm font-medium text-gray-700">
              Email
              <span className="relative mt-2 block">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="rounded-xl py-5 pl-10"
                  required
                />
              </span>
            </label>

            <Button type="submit" disabled={loading} className="w-full rounded-xl bg-red-600 py-5 hover:bg-red-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send reset link
            </Button>
          </form>

          <Link href="/login" className="inline-flex items-center text-sm font-semibold text-red-600 hover:text-red-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
