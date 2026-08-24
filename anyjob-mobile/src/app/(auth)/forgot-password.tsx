import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Button, Field, Screen } from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { colors } from "@/theme/tokens";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async () => {
    try {
      setBusy(true);
      setFailed(false);
      setMessage("");
      const payload = await api<{ message?: string }>("/api/auth/forgot-password", {
        method: "POST",
        ...jsonBody({
          email: email.trim().toLowerCase(),
        }),
      });
      setMessage(payload.message || "If an AnyJob account exists for this email, a reset link has been sent.");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Password reset email could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  return <Screen style={styles.screen}><Text style={styles.title}>Reset password</Text><Text style={styles.body}>We’ll email a secure reset link to your account.</Text><Field label="Email" value={email} autoCapitalize="none" keyboardType="email-address" onChangeText={(value) => { setEmail(value); setMessage(""); }} />{message ? <Text accessibilityRole="alert" style={failed ? styles.error : styles.success}>{message}</Text> : null}<Button title="Send reset link" onPress={submit} loading={busy} disabled={!validEmail} /></Screen>;
}
const styles = StyleSheet.create({ screen: { justifyContent: "center", minHeight: 600 }, title: { fontSize: 28, fontWeight: "800", color: colors.ink }, body: { color: colors.muted }, error: { color: colors.danger, fontWeight: "700" }, success: { color: colors.success, fontWeight: "700" } });
