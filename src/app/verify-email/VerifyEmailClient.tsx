"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type VerifyEmailClientProps = {
  email: string;
  token: string;
};

export default function VerifyEmailClient({ email, token }: VerifyEmailClientProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    let mounted = true;

    async function verify() {
      if (!email || !token) {
        setStatus("error");
        setMessage("Verification link is missing or invalid.");
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!mounted) return;

        if (!response.ok) {
          setStatus("error");
          setMessage(payload.error || "Email could not be verified.");
        } else {
          setStatus("success");
          setMessage(payload.message || "Email verified successfully.");
        }
      } catch {
        if (!mounted) return;
        setStatus("error");
        setMessage("Email verification service is unavailable.");
      }
    }

    verify();
    return () => {
      mounted = false;
    };
  }, [email, token]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50/60 via-white to-indigo-50/60 px-4 py-20">
      <Card className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border-gray-100 shadow-xl shadow-black/5">
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-indigo-500 to-purple-500" />
        <CardHeader className="px-8 pt-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            {status === "loading" ? <Loader2 className="h-6 w-6 animate-spin text-red-600" /> : null}
            {status === "success" ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : null}
            {status === "error" ? <XCircle className="h-6 w-6 text-red-600" /> : null}
          </div>
          <CardTitle className="text-2xl font-extrabold text-gray-900">
            {status === "success" ? "Email verified" : status === "error" ? "Verification failed" : "Checking link"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 text-center">
          <Link href="/login" className="text-sm font-semibold text-red-600 hover:text-red-700">
            Go to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
