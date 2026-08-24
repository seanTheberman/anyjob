import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { Button, Field, Screen } from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme/tokens";

function recoveryParams(url: string) {
  const parsed = new URL(url.replace("#", "?"));
  return {
    accessToken: parsed.searchParams.get("access_token"),
    refreshToken: parsed.searchParams.get("refresh_token"),
    code: parsed.searchParams.get("code"),
    email: parsed.searchParams.get("email"),
    token: parsed.searchParams.get("token"),
  };
}

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; token?: string }>();
  const incomingUrl = Linking.useURL();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [ready, setReady] = useState(false);
  const [webReset, setWebReset] = useState<{ email: string; token: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const prepare = async () => {
      try {
        const urlParams = incomingUrl ? recoveryParams(incomingUrl) : null;
        const email = paramValue(params.email) || urlParams?.email || "";
        const token = paramValue(params.token) || urlParams?.token || "";
        if (email && token) {
          if (active) {
            setWebReset({ email, token });
            setReady(true);
          }
          return;
        }

        const existing = await supabase.auth.getSession();
        if (existing.data.session) { if (active) setReady(true); return; }
        if (!incomingUrl) throw new Error("Open the password reset link from your email.");
        const recovery = recoveryParams(incomingUrl);
        if (recovery.accessToken && recovery.refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: recovery.accessToken, refresh_token: recovery.refreshToken });
          if (error) throw error;
        } else if (recovery.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(recovery.code);
          if (error) throw error;
        } else {
          throw new Error("This reset link is missing its recovery credentials.");
        }
        if (active) setReady(true);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "This reset link is invalid or expired.");
      }
    };
    void prepare();
    return () => { active = false; };
  }, [incomingUrl, params.email, params.token]);

  const valid = password.length >= 8 && password === confirmation;
  const submit = async () => {
    try {
      setBusy(true); setMessage("");
      if (webReset) {
        await api("/api/auth/reset-password", {
          method: "POST",
          ...jsonBody({
            email: webReset.email,
            token: webReset.token,
            password,
          }),
        });
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await supabase.auth.signOut();
      }
      router.replace("/(auth)/sign-in");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update your password.");
    } finally {
      setBusy(false);
    }
  };

  return <Screen style={styles.screen}><Text style={styles.title}>Choose a new password</Text><Text style={styles.body}>Use at least eight characters, then sign in with your new password.</Text><Field label="New password" value={password} secureTextEntry onChangeText={(value) => { setPassword(value); setMessage(""); }} /><Field label="Confirm password" value={confirmation} secureTextEntry onChangeText={(value) => { setConfirmation(value); setMessage(""); }} />{confirmation && password !== confirmation ? <Text accessibilityRole="alert" style={styles.error}>Passwords do not match.</Text> : null}{message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}<Button title="Update password" onPress={submit} loading={busy} disabled={!ready || !valid} /></Screen>;
}

const styles = StyleSheet.create({ screen: { justifyContent: "center", minHeight: 620 }, title: { color: colors.ink, fontSize: 28, fontWeight: "800" }, body: { color: colors.muted, lineHeight: 21 }, error: { color: colors.danger, fontWeight: "700" } });
