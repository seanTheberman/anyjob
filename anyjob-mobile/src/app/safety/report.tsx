import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ShieldAlert, UserRoundX } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card, Field, Header, Screen } from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { useAppTheme } from "@/providers/theme-provider";

const REASONS = [
  ["harassment", "Harassment"],
  ["scam_or_fraud", "Scam or fraud"],
  ["inappropriate_content", "Inappropriate content"],
  ["safety_concern", "Safety concern"],
  ["other", "Other"],
] as const;

export default function ReportUserScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{
    targetUserId: string;
    targetName?: string;
    conversationId?: string;
    sourcePath?: string;
  }>();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const report = useMutation({
    mutationFn: () =>
      api("/api/safety", {
        method: "POST",
        ...jsonBody({
          action: "report",
          targetUserId: params.targetUserId,
          reason,
          details,
          conversationId: params.conversationId,
          sourcePath: params.sourcePath,
        }),
      }),
    onSuccess: () =>
      Alert.alert("Report submitted", "Our safety team will review your report.", [
        { text: "Done", onPress: () => router.back() },
      ]),
    onError: (error: Error) => Alert.alert("Could not submit report", error.message),
  });

  const block = useMutation({
    mutationFn: () =>
      api("/api/safety", {
        method: "POST",
        ...jsonBody({ action: "block", targetUserId: params.targetUserId }),
      }),
    onSuccess: () =>
      Alert.alert("User blocked", "They can no longer message you or appear in your provider results.", [
        { text: "Done", onPress: () => router.replace("/(app)/explore") },
      ]),
    onError: (error: Error) => Alert.alert("Could not block user", error.message),
  });

  return (
    <Screen>
      <Header title="Safety" subtitle={params.targetName ? `Report or block ${params.targetName}` : "Report or block this user"} />
      <Card>
        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor: colors.soft }]}>
            <ShieldAlert color={colors.danger} size={21} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: colors.ink }]}>Report a concern</Text>
            <Text style={[styles.body, { color: colors.muted }]}>Reports are private. The reported user is not told who submitted them.</Text>
          </View>
        </View>
        <Text style={[styles.label, { color: colors.ink }]}>Reason</Text>
        <View style={styles.reasons}>
          {REASONS.map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: reason === value }}
              onPress={() => setReason(value)}
              style={[
                styles.reason,
                { borderColor: reason === value ? colors.brand : colors.line, backgroundColor: reason === value ? colors.infoSoft : colors.surface },
              ]}
            >
              <Text style={[styles.reasonText, { color: reason === value ? colors.brand : colors.ink }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Field
          label="Details (optional)"
          multiline
          value={details}
          onChangeText={setDetails}
          placeholder="Tell us what happened"
          maxLength={2000}
        />
        <Button title="Submit report" disabled={!reason} loading={report.isPending} onPress={() => report.mutate()} />
      </Card>

      <Card>
        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor: colors.soft }]}>
            <UserRoundX color={colors.ink} size={21} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: colors.ink }]}>Block this user</Text>
            <Text style={[styles.body, { color: colors.muted }]}>Blocking hides their profile and prevents messages in either direction.</Text>
          </View>
        </View>
        <Button
          title="Block user"
          variant="secondary"
          loading={block.isPending}
          onPress={() => Alert.alert("Block this user?", "They will no longer be able to message you.", [
            { text: "Cancel", style: "cancel" },
            { text: "Block", style: "destructive", onPress: () => block.mutate() },
          ])}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: "row", alignItems: "center", gap: 11 },
  icon: { width: 42, height: 42, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontWeight: "900" },
  body: { fontSize: 11, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: "900", marginTop: 4 },
  reasons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reason: { borderWidth: 1, borderRadius: 8, minHeight: 38, paddingHorizontal: 11, justifyContent: "center" },
  reasonText: { fontSize: 11.5, fontWeight: "800" },
});
