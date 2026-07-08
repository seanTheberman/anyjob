"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ResetPasswordClientProps = {
  email: string;
  token: string;
};

export default function ResetPasswordClient({ email, token }: ResetPasswordClientProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Password could not be reset.");
      } else {
        setMessage("Password reset successful. You can now log in.");
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Password reset service is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const invalidLink = !email || !token;

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50/60 via-white to-indigo-50/60 px-4 py-20">
      <Card className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border-gray-100 shadow-xl shadow-black/5">
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-indigo-500 to-purple-500" />
        <CardHeader className="px-8 pt-8 text-center">
          <CardTitle className="text-2xl font-extrabold text-gray-900">Choose a new password</CardTitle>
          <CardDescription>Use at least 8 characters. This reset link can only be used once.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-8 pb-8">
          {invalidLink ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Reset link is missing or invalid. Request a new password reset email.
            </div>
          ) : null}
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
              New password
              <span className="relative mt-2 block">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-xl py-5 pl-10"
                  minLength={8}
                  disabled={invalidLink || Boolean(message)}
                  required
                />
              </span>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Confirm password
              <span className="relative mt-2 block">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="rounded-xl py-5 pl-10"
                  minLength={8}
                  disabled={invalidLink || Boolean(message)}
                  required
                />
              </span>
            </label>

            <Button
              type="submit"
              disabled={loading || invalidLink || Boolean(message)}
              className="w-full rounded-xl bg-red-600 py-5 hover:bg-red-700"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reset password
            </Button>
          </form>

          <div className="flex items-center justify-between gap-3 text-sm">
            <Link href="/forgot-password" className="font-semibold text-red-600 hover:text-red-700">
              Request new link
            </Link>
            <Link href="/login" className="inline-flex items-center font-semibold text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
