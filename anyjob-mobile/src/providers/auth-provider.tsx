import type { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { SplashScreen, useRouter, useSegments } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { api, fetchApiResponse } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { AppUser } from "@/types/domain";

void SplashScreen.preventAutoHideAsync();

type AuthContextValue = {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type LoginResponse = {
  user?: Partial<AppUser> & {
    fullName?: string;
    hasBusinessProfile?: boolean;
    businessRegistrationStatus?: string | null;
    providerWorkMode?: string | null;
    canWorkFreelance?: boolean;
    canWorkShifts?: boolean;
  };
  session?: Session | null;
  error?: string;
};

const PUBLIC_SEGMENTS = new Set([
  "(app)",
  "(auth)",
  "provider",
  "request",
]);

function appUserFromLogin(payload: LoginResponse["user"]): AppUser | null {
  if (!payload?.id) return null;
  const providerWorkMode = payload.providerWorkMode || null;
  return {
    id: payload.id,
    email: payload.email || null,
    role: (payload.role || "client") as AppUser["role"],
    displayName:
      payload.displayName ||
      payload.fullName ||
      payload.email?.split("@")[0] ||
      "Account",
    hasBusinessProfile: Boolean(payload.hasBusinessProfile),
    businessRegistrationStatus: payload.businessRegistrationStatus || null,
    providerWorkMode,
    canWorkFreelance: Boolean(payload.canWorkFreelance),
    canWorkShifts: Boolean(payload.canWorkShifts),
    rating: Number(payload.rating || 0),
    reviewCount: Number(payload.reviewCount || 0),
  };
}

function isPublicRoute(segments: string[]) {
  const root = segments[0];
  if (!root) return true;
  if (!PUBLIC_SEGMENTS.has(root)) return false;
  if (root === "(app)") {
    const child = segments[1];
    return !child || child === "index" || child === "explore" || child === "work";
  }
  if (root === "request") return segments[1] === "new";
  if (root === "provider") return Boolean(segments[1]);
  return true;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const authenticating = useRef(false);

  const refreshUser = useCallback(async (nextSession?: Session | null) => {
    const current = nextSession === undefined ? (await supabase.auth.getSession()).data.session : nextSession;
    if (!current) { setUser(null); return; }
    const payload = await api<{ user: AppUser | null }>("/api/auth/session", {
      headers: { Authorization: `Bearer ${current.access_token}` },
    });
    if (!payload.user) throw new Error("Your AnyJob profile could not be loaded.");
    setUser(payload.user);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await refreshUser().catch(() => setUser(null));
      setLoading(false);
      await SplashScreen.hideAsync();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setUser(null);
      else setTimeout(() => {
        void refreshUser().catch(() => setUser(null));
      }, 0);
    });
    return () => listener.subscription.unsubscribe();
  }, [refreshUser]);

  useEffect(() => {
    if (Platform.OS === "web" || !session) return;
    const verifyAppLock = async () => {
      if (authenticating.current || await AsyncStorage.getItem("anyjob-biometric-lock") !== "true") return;
      authenticating.current = true;
      try {
        const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock AnyJob" });
        if (!result.success) await supabase.auth.signOut();
      } finally {
        authenticating.current = false;
      }
    };
    void verifyAppLock();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void verifyAppLock(); });
    return () => subscription.remove();
  }, [session]);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!session && !isPublicRoute(segments)) router.replace("/(auth)/sign-in");
  }, [loading, router, segments, session, user]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    loading,
    refreshUser,
    signIn: async (email, password) => {
      setUser(null);
      const response = await fetchApiResponse("/api/auth/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as LoginResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Sign in failed.");
      }
      if (!payload.session?.access_token || !payload.session.refresh_token) {
        throw new Error("Sign in succeeded, but no mobile session was returned.");
      }
      const { data, error } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });
      if (error) throw error;
      setSession(data.session || payload.session);
      const nextUser = appUserFromLogin(payload.user);
      if (!nextUser) throw new Error("Your AnyJob profile could not be loaded.");
      setUser(nextUser);
    },
    signOut: async () => { await supabase.auth.signOut(); router.replace("/(auth)/welcome"); },
  }), [loading, refreshUser, router, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function isProviderRole(role?: string | null) {
  return role === "seller" || role === "provider" || role === "contractor";
}
