import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Field, Screen } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { registered, redirectTo } = useLocalSearchParams<{
    registered?: string;
    redirectTo?: string;
  }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)");
  };

  const submit = async () => {
    try {
      setBusy(true);
      setErrorMessage("");
      await signIn(email, password);
      router.replace((redirectTo ? String(redirectTo) : "/(app)") as never);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Check your details.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to AnyJob"
        onPress={goBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <ChevronLeft color={colors.ink} size={22} />
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.logo}>AnyJob</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.body}>Sign in with your AnyJob account.</Text>
      </View>
      {registered === "1" ? (
        <Text accessibilityRole="alert" style={styles.success}>
          Account created. Check your email if verification is required, then
          sign in.
        </Text>
      ) : null}
      <Field
        label="Email"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={(value) => {
          setEmail(value);
          setErrorMessage("");
        }}
      />
      <Field
        label="Password"
        value={password}
        secureTextEntry
        onChangeText={(value) => {
          setPassword(value);
          setErrorMessage("");
        }}
      />
      {errorMessage ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
      <Button
        title="Sign in"
        onPress={submit}
        loading={busy}
        disabled={!validEmail || !password}
      />
      <Link href="/(auth)/forgot-password" style={styles.link}>
        Forgot password?
      </Link>
      <Link
        href={{
          pathname: "/(auth)/register",
          params: { redirectTo: redirectTo || "" },
        }}
        style={styles.link}
      >
        Create an account
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "center", minHeight: 650 },
  backButton: {
    position: "absolute",
    left: 0,
    top: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  header: { gap: 6, marginBottom: 10 },
  logo: { color: colors.brand, fontWeight: "900", fontSize: 34 },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink },
  body: { color: colors.muted, marginBottom: 10 },
  error: { color: colors.danger, fontWeight: "700" },
  success: { color: colors.success, fontWeight: "700", lineHeight: 20 },
  link: {
    color: colors.brand,
    fontWeight: "700",
    textAlign: "center",
    padding: 8,
  },
});
