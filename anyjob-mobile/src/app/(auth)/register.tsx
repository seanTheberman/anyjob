import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Field, Screen } from "@/components/ui";
import { fetchApiResponse } from "@/lib/api";
import { colors } from "@/theme/tokens";
import { useMarketLocation } from "@/providers/market-location-provider";

type Kind = "buyer" | "seller";
type WorkMode = "freelance" | "shift" | "both";
type WorkChoice = "one-off" | "projects" | "shift";
type AccountType = "individual" | "business";

const workChoiceLabels: Record<WorkChoice, string> = {
  "one-off": "One-off jobs",
  projects: "Quote for projects",
  shift: "Shift work",
};

export default function RegisterScreen() {
  const router = useRouter();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const [kind, setKind] = useState<Kind>("buyer");
  const [busy, setBusy] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [workChoices, setWorkChoices] = useState<WorkChoice[]>(["one-off", "projects", "shift"]);
  const [errorMessage, setErrorMessage] = useState("");
  const marketLocation = useMarketLocation();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    city: "",
    postalCode: "",
    birthDate: "",
    businessName: "",
    serviceCategory: "",
    shiftNiches: "",
    shiftRoles: "",
    hourlyRate: "25",
  });

  const hasFreelanceWork = workChoices.includes("one-off") || workChoices.includes("projects");
  const hasShiftWork = workChoices.includes("shift");
  const workMode: WorkMode = hasFreelanceWork && hasShiftWork
    ? "both"
    : hasShiftWork
      ? "shift"
      : "freelance";

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (!marketLocation.location) return;
    setForm((current) => ({
      ...current,
      city: marketLocation.location?.city || "",
      postalCode: marketLocation.location?.postalCode || "",
    }));
  }, [marketLocation.location]);
  const needsShiftProfile = kind === "seller" && hasShiftWork;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const complete = Boolean(
    form.firstName &&
      form.lastName &&
      validEmail &&
      form.password.length >= 8 &&
      form.address &&
      form.city &&
      marketLocation.token &&
      (kind === "buyer" ||
        (form.phone &&
          form.birthDate &&
          form.serviceCategory &&
          workChoices.length > 0 &&
          (accountType === "individual" || form.businessName) &&
          (!needsShiftProfile ||
            (form.shiftNiches &&
              form.shiftRoles &&
              Number(form.hourlyRate) > 0)))),
  );

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)");
  };

  const submit = async () => {
    try {
      setBusy(true);
      setErrorMessage("");
      const endpoint =
        kind === "buyer" ? "/api/auth/register-buyer" : "/api/auth/register-seller";
      const body =
        kind === "buyer"
          ? { ...form, locationToken: marketLocation.token, newsletterSubscribed: false }
          : {
              ...form,
              locationToken: marketLocation.token,
              accountType,
              workMode,
              workChoices,
              termsAccepted: true,
              shiftNiches: form.shiftNiches
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              shiftRoles: form.shiftRoles
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              preferredHourlyRate: Number(form.hourlyRate),
              openToFreelanceJobs: hasFreelanceWork,
              openToUrgentShifts: true,
              openToRecurringShifts: true,
            };
      const response = await fetchApiResponse(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Registration failed");
      router.replace({
        pathname: "/(auth)/sign-in",
        params: { registered: "1", redirectTo: redirectTo || "" },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not create account. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to AnyJob"
        onPress={goBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <ChevronLeft color={colors.ink} size={22} />
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.title}>Create your AnyJob account</Text>
        <Text style={styles.body}>
          Use the same account for web and mobile.
        </Text>
      </View>
      <View style={styles.segment}>
        <Pressable
          onPress={() => setKind("buyer")}
          style={[styles.segmentButton, kind === "buyer" && styles.active]}
        >
          <Text style={[styles.segmentText, kind === "buyer" && styles.activeText]}>
            Hire services
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setKind("seller")}
          style={[styles.segmentButton, kind === "seller" && styles.active]}
        >
          <Text style={[styles.segmentText, kind === "seller" && styles.activeText]}>
            Find work
          </Text>
        </Pressable>
      </View>
      <Field label="First name" value={form.firstName} onChangeText={set("firstName")} />
      <Field label="Last name" value={form.lastName} onChangeText={set("lastName")} />
      <Field
        label="Email"
        value={form.email}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={set("email")}
      />
      <Field label="Phone" value={form.phone} keyboardType="phone-pad" onChangeText={set("phone")} />
      <Field label="Address" value={form.address} onChangeText={set("address")} />
      <Field label="City" value={form.city || "Waiting for location"} editable={false} />
      <Field label="State / region" value={marketLocation.location?.region || "Not available"} editable={false} />
      <Field label="Postal code" value={form.postalCode || "Not available"} editable={false} />
      <Field label="Country" value={marketLocation.location?.country || "Waiting for location"} editable={false} />
      {marketLocation.error ? <Text style={styles.error}>{marketLocation.error}</Text> : null}
      <Button
        title={
          marketLocation.needsSettings
            ? "Open location settings"
            : marketLocation.location
              ? "Refresh location"
              : "Verify location"
        }
        variant="secondary"
        loading={marketLocation.loading}
        onPress={() => {
          if (marketLocation.needsSettings) void marketLocation.openSettings();
          else void marketLocation.refresh();
        }}
      />
      {kind === "seller" ? (
        <>
          <Field label="Date of birth (YYYY-MM-DD)" value={form.birthDate} onChangeText={set("birthDate")} />
          <Field label="Main service category" value={form.serviceCategory} onChangeText={set("serviceCategory")} />
          <Text style={styles.label}>Which best describes you?</Text>
          <View style={styles.segment}>
            <Pressable
              onPress={() => setAccountType("individual")}
              style={[styles.segmentButton, accountType === "individual" && styles.active]}
            >
              <Text style={[styles.segmentText, accountType === "individual" && styles.activeText]}>
                I’m an Individual Jobber
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAccountType("business")}
              style={[styles.segmentButton, accountType === "business" && styles.active]}
            >
              <Text style={[styles.segmentText, accountType === "business" && styles.activeText]}>
                We’re a Business or Team
              </Text>
            </Pressable>
          </View>
          {accountType === "business" ? (
            <Field label="Business or team name" value={form.businessName} onChangeText={set("businessName")} />
          ) : null}
          <Text style={styles.label}>How would you like to work?</Text>
          <View style={styles.workChoiceList}>
            {(["one-off", "projects", "shift"] as WorkChoice[]).map((choice) => {
              const selected = workChoices.includes(choice);
              return (
              <Pressable
                key={choice}
                onPress={() => setWorkChoices((current) => selected
                  ? current.filter((item) => item !== choice)
                  : [...current, choice])}
                style={[styles.workChoiceButton, selected && styles.active]}
              >
                <Text style={[styles.segmentText, selected && styles.activeText]}>
                  {workChoiceLabels[choice]}
                </Text>
              </Pressable>
              );
            })}
          </View>
          {needsShiftProfile ? (
            <>
              <Field label="Shift niches (comma-separated)" value={form.shiftNiches} onChangeText={set("shiftNiches")} />
              <Field label="Preferred shift roles (comma-separated)" value={form.shiftRoles} onChangeText={set("shiftRoles")} />
              <Field label="Preferred hourly rate (€)" keyboardType="decimal-pad" value={form.hourlyRate} onChangeText={set("hourlyRate")} />
            </>
          ) : null}
        </>
      ) : null}
      <Field
        label="Password (8+ characters)"
        value={form.password}
        secureTextEntry
        onChangeText={set("password")}
      />
      <Text style={styles.terms}>
        By creating an account you accept AnyJob’s terms and privacy policy.
      </Text>
      {errorMessage ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
      <Button
        title={kind === "buyer" ? "Create customer account" : "Become a Jobber"}
        onPress={submit}
        loading={busy}
        disabled={!complete}
      />
      <Link href="/(auth)/sign-in" replace style={styles.link}>
        Already have an account? Sign in
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  header: { gap: 6, marginTop: 16 },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink },
  body: { color: colors.muted, lineHeight: 20 },
  label: { color: colors.ink, fontWeight: "700" },
  terms: { color: colors.muted, lineHeight: 20 },
  error: { color: colors.danger, fontWeight: "700" },
  link: { color: colors.brand, fontWeight: "700", textAlign: "center", padding: 8 },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.soft,
    padding: 4,
    borderRadius: 8,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  active: { backgroundColor: "white" },
  segmentText: {
    color: colors.muted,
    fontWeight: "700",
    textAlign: "center",
  },
  activeText: { color: colors.brand },
  workChoiceList: { gap: 8 },
  workChoiceButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.soft,
    paddingHorizontal: 12,
  },
});
