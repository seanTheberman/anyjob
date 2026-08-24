import { useRouter } from "expo-router";
import {
  Award,
  Bell,
  Building2,
  CreditCard,
  FileCheck2,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  Moon,
  Smartphone,
  Star,
  Sun,
  UserRound,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/app-header";
import {
  Avatar,
  Button,
  Card,
  ListGroup,
  Pill,
  RowLink,
  Screen,
} from "@/components/ui";
import { isProviderRole, useAuth } from "@/providers/auth-provider";
import { useAppContent } from "@/lib/content";
import { useAppTheme, type ThemePreference } from "@/providers/theme-provider";
import { radius } from "@/theme/tokens";

function ThemeOption({
  value,
  label,
  icon: Icon,
}: {
  value: ThemePreference;
  label: string;
  icon: typeof Smartphone;
}) {
  const { colors, preference, setPreference } = useAppTheme();
  const active = preference === value;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => setPreference(value)}
      style={({ pressed }) => [
        styles.themeOption,
        {
          backgroundColor: active ? colors.brand : colors.soft,
          borderColor: active ? colors.brand : colors.line,
        },
        pressed && styles.pressed,
      ]}
    >
      <Icon color={active ? "white" : colors.muted} size={17} />
      <Text
        style={[styles.themeLabel, { color: active ? "white" : colors.ink }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SettingsHeading({ title }: { title: string }) {
  const { colors } = useAppTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.ink }]}>{title}</Text>
  );
}

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const provider = isProviderRole(user?.role);
  const [confirming, setConfirming] = useState(false);
  const { colors } = useAppTheme();
  const { copy } = useAppContent();
  const role = provider
    ? "Provider"
    : user?.hasBusinessProfile
      ? "Buyer + Business"
      : "Buyer";
  const ratingCopy = user?.reviewCount
    ? `${Number(user.rating || 0).toFixed(1)} from ${user.reviewCount}`
    : "No reviews yet";

  if (!user) {
    return (
      <Screen>
        <AppHeader compact />
        <View style={styles.pageHead}>
          <Text style={[styles.pageTitle, { color: colors.ink }]}>
            Account
          </Text>
          <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
            Sign in to see your dashboard, saved providers, messages, tasks,
            reviews and settings.
          </Text>
        </View>
        <Card>
          <Button
            title="Sign in"
            onPress={() => router.push("/(auth)/sign-in")}
          />
          <Button
            title="Create buyer account"
            variant="secondary"
            onPress={() => router.push("/(auth)/register")}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader compact />
      <View style={styles.pageHead}>
        <Text style={[styles.pageTitle, { color: colors.ink }]}>{copy("account.title", "Account")}</Text>
        <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
          {copy("account.subtitle", "Your identity, preferences and marketplace settings.")}
        </Text>
      </View>

      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <View style={styles.profileTop}>
          <Avatar name={user?.displayName || "A"} size={56} />
          <View style={styles.profileCopy}>
            <Text
              numberOfLines={1}
              style={[styles.name, { color: colors.ink }]}
            >
              {user?.displayName || "AnyJob account"}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.email, { color: colors.muted }]}
            >
              {user?.email}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit personal information"
            onPress={() =>
              router.push(provider ? "/provider/profile" : "/profile")
            }
            style={[styles.editButton, { backgroundColor: colors.soft }]}
          >
            <UserRound color={colors.ink} size={18} />
          </Pressable>
        </View>
        <View style={[styles.profileStats, { borderTopColor: colors.line }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Account
            </Text>
            <Pill text={role} tone="brand" />
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.line }]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Rating
            </Text>
            <View style={styles.ratingLine}>
              {user?.reviewCount ? (
                <Star color="#f4b400" fill="#f4b400" size={14} />
              ) : null}
              <Text style={[styles.statValue, { color: colors.ink }]}>
                {ratingCopy}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <SettingsHeading title="Profile and trust" />
      <ListGroup>
        <RowLink
          title="Personal information"
          subtitle="Name, phone, location and public details"
          icon={<UserRound color="#2f88df" size={19} />}
          onPress={() =>
            router.push(provider ? "/provider/profile" : "/profile")
          }
        />
        <RowLink
          title="Reviews"
          subtitle={
            user?.reviewCount
              ? `${Number(user.rating || 0).toFixed(1)} rating from ${user.reviewCount} reviews`
              : "Feedback received from completed work"
          }
          icon={<Star color="#d89012" size={19} />}
          onPress={() => router.push("/reviews")}
        />
        <RowLink
          title="Verification"
          subtitle="Identity and document status"
          icon={<FileCheck2 color="#14966b" size={19} />}
          onPress={() =>
            router.push(provider ? "/provider/verification" : "/verification")
          }
        />
        <RowLink
          title="Milestones"
          subtitle="Badge progress and marketplace performance"
          icon={<Award color="#7d5ce7" size={19} />}
          onPress={() => router.push("/milestones")}
        />
        {!provider ? (
          <RowLink
            title="Business account"
            subtitle="Registration, shifts and workers"
            icon={<Building2 color="#e45b52" size={19} />}
            onPress={() => router.push("/business")}
          />
        ) : null}
      </ListGroup>

      <SettingsHeading title="Appearance" />
      <View
        style={[
          styles.appearanceCard,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <View style={styles.appearanceCopy}>
          <Text style={[styles.appearanceTitle, { color: colors.ink }]}>
            App theme
          </Text>
          <Text style={[styles.appearanceBody, { color: colors.muted }]}>
            Choose how AnyJob looks on this device.
          </Text>
        </View>
        <View style={styles.themePicker}>
          <ThemeOption value="system" label="System" icon={Smartphone} />
          <ThemeOption value="light" label="Light" icon={Sun} />
          <ThemeOption value="dark" label="Dark" icon={Moon} />
        </View>
      </View>

      <SettingsHeading title="Preferences" />
      <ListGroup>
        <RowLink
          title="Plans and subscriptions"
          subtitle="Current plan and marketplace allowances"
          icon={<CreditCard color="#7d5ce7" size={19} />}
          onPress={() => router.push("/plans")}
        />
        <RowLink
          title="Notifications"
          subtitle="Messages, quotes, reviews, support, payments and promos"
          icon={<Bell color="#2f88df" size={19} />}
          onPress={() => router.push("/notifications")}
        />
        <RowLink
          title="Security"
          subtitle="Password and biometric app lock"
          icon={<LockKeyhole color="#14966b" size={19} />}
          onPress={() => router.push("/security")}
        />
        <RowLink
          title="Help and support"
          subtitle="Open and track support tickets"
          icon={<LifeBuoy color="#e45b52" size={19} />}
          onPress={() => router.push("/support")}
        />
      </ListGroup>

      {confirming ? (
        <Card>
          <Text style={[styles.confirmTitle, { color: colors.ink }]}>
            Sign out of AnyJob?
          </Text>
          <Text style={[styles.confirmBody, { color: colors.muted }]}>
            You can sign back in with this account at any time.
          </Text>
          <Button
            title="Confirm sign out"
            variant="danger"
            onPress={() => void signOut()}
          />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setConfirming(false)}
          />
        </Card>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setConfirming(true)}
          style={({ pressed }) => [
            styles.signOut,
            { backgroundColor: `${colors.danger}12` },
            pressed && styles.pressed,
          ]}
        >
          <LogOut color={colors.danger} size={18} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>
            Sign out
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageHead: { gap: 3 },
  pageTitle: { fontSize: 26, lineHeight: 31, fontWeight: "900" },
  pageSubtitle: { fontSize: 12.5, lineHeight: 18 },
  profileCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 13,
  },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  profileCopy: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: 18, lineHeight: 23, fontWeight: "900" },
  email: { fontSize: 11.5, lineHeight: 16 },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  profileStats: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 11,
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: { flex: 1, gap: 5 },
  statLabel: { fontSize: 9.5, fontWeight: "800" },
  statDivider: { width: 1, height: 34, marginHorizontal: 12 },
  statValue: { fontSize: 11.5, fontWeight: "900" },
  ratingLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  sectionTitle: {
    marginTop: 3,
    paddingHorizontal: 2,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  appearanceCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    gap: 12,
  },
  appearanceCopy: { gap: 2 },
  appearanceTitle: { fontSize: 14, fontWeight: "900" },
  appearanceBody: { fontSize: 11.5, lineHeight: 16 },
  themePicker: { flexDirection: "row", gap: 7 },
  themeOption: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  themeLabel: { fontSize: 11.5, fontWeight: "900" },
  confirmTitle: { fontWeight: "900", fontSize: 18 },
  confirmBody: { fontSize: 12.5, lineHeight: 18 },
  signOut: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOutText: { fontSize: 13, fontWeight: "900" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
