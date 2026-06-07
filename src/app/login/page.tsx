"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User, Briefcase } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        // Get user role from profile or sellers table
        let userRole = 'client'; // default
        
        // Check eloo_profiles first
        const { data: profile } = await supabase
            .from('eloo_profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();
        
        if (profile?.role) {
            userRole = profile.role.toLowerCase();
        } else {
            // Check if user is a seller
            const { data: seller } = await supabase
                .from('sellers')
                .select('status')
                .eq('id', authData.user.id)
                .single();
            
            if (seller) {
                userRole = 'seller';
            }
        }

        // Redirect based on user role
        if (userRole === 'provider' || userRole === 'seller') {
            router.push("/pro");
        } else if (userRole === 'admin') {
            await supabase.auth.signOut();
            router.push("/admin-login");
        } else {
            // Default to client dashboard
            router.push("/dashboard");
        }
        router.refresh();
    }

    async function handleGoogleLogin() {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    }

    async function handleMagicLink() {
        if (!email) {
            setError("Please enter your email first");
            return;
        }
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setMagicLinkSent(true);
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-red-50/50 via-white to-indigo-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <Card className="relative w-full max-w-md border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
                {/* Gradient top bar */}
                <div className="h-1.5 bg-gradient-to-r from-red-500 via-indigo-500 to-purple-500" />

                <CardHeader className="text-center pt-8 pb-4 px-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <span className="text-white font-black text-xl">E</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-extrabold text-gray-900 dark:text-white">
                        Welcome back! 👋
                    </CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                        Login to your Anyjob account
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-8 space-y-5">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    {/* Magic Link Success */}
                    {magicLinkSent && (
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-xl px-4 py-3">
                            ✅ A login link has been sent to <strong>{email}</strong>. Check your inbox.
                        </div>
                    )}

                    {/* Google OAuth Button */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleLogin}
                        className="w-full rounded-xl py-5 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </Button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <Separator className="flex-1" />
                        <span className="text-xs text-gray-400 font-medium">or</span>
                        <Separator className="flex-1" />
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="pl-10 py-5 rounded-xl border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-red-500/20"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password input */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={handleMagicLink}
                                    disabled={loading}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-60"
                                >
                                    Forgot?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10 py-5 rounded-xl border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-red-500/20"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</>
                            ) : (
                                <>Log in <ArrowRight className="w-4 h-4 ml-1" /></>
                            )}
                        </button>
                    </form>

                    {/* Magic Link */}
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleMagicLink}
                        disabled={loading}
                        className="w-full rounded-xl py-5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                        ✨ Login with magic link
                    </Button>

                    {/* Role Selection for New Users */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">New to AnyJob?</CardTitle>
                            <CardDescription>
                                Choose how you want to use the platform
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/signup?role=client">
                                <Button variant="outline" className="w-full h-12 justify-start">
                                    <User className="w-5 h-5 mr-3 text-blue-600" />
                                    <div className="text-left">
                                        <div className="font-medium">I'm a Client</div>
                                        <div className="text-sm text-gray-500">Book services from providers</div>
                                    </div>
                                </Button>
                            </Link>
                            <Link href="/signup?role=provider">
                                <Button variant="outline" className="w-full h-12 justify-start">
                                    <Briefcase className="w-5 h-5 mr-3 text-green-600" />
                                    <div className="text-left">
                                        <div className="font-medium">I'm a Provider</div>
                                        <div className="text-sm text-gray-500">Offer services to clients</div>
                                    </div>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Register link */}
                    <p className="text-center text-sm text-gray-500">
                        Don't have an account yet?{" "}
                        <Link href="/register" className="text-red-600 hover:text-red-700 font-semibold">
                            Create an account
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
