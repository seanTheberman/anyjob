import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as LocalAuthentication from "expo-local-authentication";
import {
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Trash2,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import {
  Button,
  Card,
  ErrorState,
  Field,
  Header,
  LoadingState,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { useAppTheme } from "@/providers/theme-provider";
import { useAuth } from "@/providers/auth-provider";

type SecurityResponse = {
  account: {
    email: string;
    emailConfirmed: boolean;
    lastSignInAt: string | null;
    createdAt: string | null;
  };
};

function displayDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "Not available";
}

export default function SecurityScreen() {
  const { colors } = useAppTheme();
  const { signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [biometric, setBiometric] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const query = useQuery({
    queryKey: ["account-security"],
    queryFn: () => api<SecurityResponse>("/api/provider/security"),
  });

  useEffect(() => {
    AsyncStorage.getItem("anyjob-biometric-lock").then((value) =>
      setBiometric(value === "true"),
    );
  }, []);

  const update = useMutation({
    mutationFn: () => {
      if (newPassword !== confirmPassword)
        throw new Error("New password and confirmation do not match.");
      return api("/api/provider/security", {
        method: "PATCH",
        ...jsonBody({ currentPassword, newPassword }),
      });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Password updated", "Your new password is active.");
    },
    onError: (error: Error) =>
      Alert.alert("Could not update password", error.message),
  });

  const toggle = async (enabled: boolean) => {
    if (enabled) {
      const available = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!available || !enrolled) {
        Alert.alert(
          "Biometrics unavailable",
          "Set up Face ID, Touch ID, or device biometrics first.",
        );
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable AnyJob app lock",
      });
      if (!result.success) return;
    }
    setBiometric(enabled);
    await AsyncStorage.setItem("anyjob-biometric-lock", String(enabled));
  };

  const deleteAccount = useMutation({
    mutationFn: () =>
      api("/api/mobile/account", {
        method: "DELETE",
        ...jsonBody({ confirmation: deleteConfirmation }),
      }),
    onSuccess: async () => {
      await AsyncStorage.removeItem("anyjob-biometric-lock");
      Alert.alert("Account deleted", "Your AnyJob account has been permanently deleted.");
      await signOut();
    },
    onError: (error: Error) =>
      Alert.alert("Could not delete account", error.message),
  });

  if (query.isLoading)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (query.isError)
    return (
      <Screen>
        <ErrorState
          message={(query.error as Error).message}
          retry={() => void query.refetch()}
        />
      </Screen>
    );

  return (
    <Screen>
      <Header title="Security" />
      <View style={[styles.hero, { backgroundColor: colors.successSoft }]}>
        <View style={[styles.heroIcon, { backgroundColor: colors.surface }]}>
          <ShieldCheck color={colors.success} size={25} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroTitle, { color: colors.ink }]}>
            Account protection
          </Text>
          <Text style={[styles.heroBody, { color: colors.muted }]}>
            Password changes require your current password, matching the web
            account flow.
          </Text>
        </View>
      </View>

      <SectionHeader title="Account access" />
      <Card>
        <AccountRow
          label="Email"
          value={query.data?.account.email || "Not available"}
        />
        <AccountRow
          label="Email status"
          value={
            query.data?.account.emailConfirmed
              ? "Email verified"
              : "Verification pending"
          }
        />
        <AccountRow
          label="Last sign in"
          value={displayDate(query.data?.account.lastSignInAt)}
        />
        <AccountRow
          label="Account created"
          value={displayDate(query.data?.account.createdAt)}
        />
      </Card>

      <SectionHeader title="Change password" />
      <Card>
        <View style={styles.cardHead}>
          <View style={[styles.cardIcon, { backgroundColor: colors.infoSoft }]}>
            <KeyRound color={colors.info} size={18} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>
            Verify and update password
          </Text>
        </View>
        <Field
          label="Current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <Field
          label="New password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <Field
          label="Confirm new password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <Button
          title="Update password"
          loading={update.isPending}
          disabled={
            !currentPassword || newPassword.length < 8 || !confirmPassword
          }
          onPress={() => update.mutate()}
        />
      </Card>

      <SectionHeader title="Device protection" />
      <View
        style={[
          styles.setting,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <View
          style={[
            styles.settingIcon,
            { backgroundColor: biometric ? colors.successSoft : colors.soft },
          ]}
        >
          {biometric ? (
            <Fingerprint color={colors.success} size={20} />
          ) : (
            <LockKeyhole color={colors.muted} size={20} />
          )}
        </View>
        <View style={styles.settingCopy}>
          <Text style={[styles.settingTitle, { color: colors.ink }]}>
            Biometric app lock
          </Text>
          <Text style={[styles.settingBody, { color: colors.muted }]}>
            Require device biometrics when reopening AnyJob.
          </Text>
        </View>
        <Switch
          value={biometric}
          onValueChange={(value) => void toggle(value)}
          trackColor={{ false: colors.softStrong, true: colors.brand }}
          thumbColor="white"
        />
      </View>

      <SectionHeader title="Delete account" />
      <Card>
        <View style={styles.cardHead}>
          <View style={[styles.cardIcon, { backgroundColor: colors.soft }]}>
            <Trash2 color={colors.danger} size={18} />
          </View>
          <View style={styles.dangerCopy}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>Permanent deletion</Text>
            <Text style={[styles.dangerBody, { color: colors.muted }]}>Deletes your profile and account access. This action cannot be undone.</Text>
          </View>
        </View>
        {showDelete ? (
          <>
            <Field
              label="Type DELETE to confirm"
              autoCapitalize="characters"
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
            />
            <Button
              title="Permanently delete account"
              variant="danger"
              disabled={deleteConfirmation !== "DELETE"}
              loading={deleteAccount.isPending}
              onPress={() =>
                Alert.alert(
                  "Delete your account?",
                  "Your account and profile data will be permanently deleted.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteAccount.mutate() },
                  ],
                )
              }
            />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => {
                setShowDelete(false);
                setDeleteConfirmation("");
              }}
            />
          </>
        ) : (
          <Button title="Delete account" variant="danger" onPress={() => setShowDelete(true)} />
        )}
      </Card>
    </Screen>
  );
}

function AccountRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.accountRow}>
      <Text style={[styles.accountLabel, { color: colors.muted }]}>
        {label}
      </Text>
      <Text style={[styles.accountValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 14.5, fontWeight: "900" },
  heroBody: { fontSize: 11.5, lineHeight: 17 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "900" },
  dangerCopy: { flex: 1, gap: 3 },
  dangerBody: { fontSize: 10.5, lineHeight: 15 },
  accountRow: { gap: 3 },
  accountLabel: { fontSize: 10.5, fontWeight: "800" },
  accountValue: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
  setting: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  settingCopy: { flex: 1, gap: 3 },
  settingTitle: { fontSize: 13.5, fontWeight: "900" },
  settingBody: { fontSize: 10.5, lineHeight: 15 },
});
