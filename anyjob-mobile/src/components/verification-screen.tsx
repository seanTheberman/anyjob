import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Upload,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  Button,
  Card,
  ErrorState,
  Header,
  LoadingState,
  Pill,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { uploadDocumentFile, uploadMarketplaceFile } from "@/lib/uploads";
import { useAppTheme } from "@/providers/theme-provider";

export default function VerificationScreen() {
  const { colors } = useAppTheme();
  const client = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["verification"],
    queryFn: () => api<any>("/api/mobile/verification"),
  });

  const chooseDocument = () =>
    DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
      copyToCacheDirectory: true,
    });

  const uploadIdentity = async (side: "front" | "back") => {
    try {
      setUploading(side);
      const result = await chooseDocument();
      if (result.canceled) return;
      await uploadMarketplaceFile(result.assets[0], "id_document", {
        title: side === "front" ? "Government ID front" : "Government ID back",
      });
      await client.invalidateQueries({ queryKey: ["verification"] });
      Alert.alert(
        "Identity document uploaded",
        "Your identity file was submitted for admin review.",
      );
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error instanceof Error ? error.message : "Try again.",
      );
    } finally {
      setUploading(null);
    }
  };

  const uploadInsurance = async () => {
    try {
      setUploading("insurance");
      const result = await chooseDocument();
      if (result.canceled) return;
      const uploaded = await uploadDocumentFile(
        result.assets[0],
        "anyjob/insurance",
      );
      await api("/api/mobile/verification", {
        method: "PATCH",
        ...jsonBody({ kind: "insurance", url: uploaded.url }),
      });
      await client.invalidateQueries({ queryKey: ["verification"] });
      Alert.alert(
        "Insurance uploaded",
        "Your insurance file was submitted for admin review.",
      );
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error instanceof Error ? error.message : "Try again.",
      );
    } finally {
      setUploading(null);
    }
  };

  const uploadSelfie = async () => {
    try {
      setUploading("selfie");
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted)
        throw new Error("Photo library permission is required.");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        videoMaxDuration: 30,
      });
      if (result.canceled) return;
      await uploadMarketplaceFile(result.assets[0], "selfie_video");
      await client.invalidateQueries({ queryKey: ["verification"] });
      Alert.alert(
        "Selfie video uploaded",
        "Your video was submitted for admin review.",
      );
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error instanceof Error ? error.message : "Try again.",
      );
    } finally {
      setUploading(null);
    }
  };

  if (query.isLoading)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (query.isError)
    return (
      <Screen>
        <ErrorState message={(query.error as Error).message} />
      </Screen>
    );

  const status = query.data?.verification || {};
  const checks = [
    ["Email verified", status.approved || status.emailVerified],
    ["Phone verified", status.approved || status.phoneVerified],
    ["Government ID front", status.approved || status.idFrontUploaded],
    ["Government ID back", status.approved || status.idBackUploaded],
    ["Selfie video verified", status.approved || status.selfieUploaded],
    ...(typeof status.insuranceUploaded === "boolean"
      ? [
          [
            "Insurance document verified",
            status.approved || status.insuranceUploaded,
          ],
        ]
      : []),
  ] as Array<[string, boolean]>;
  const completeCount = checks.filter(([, done]) => done).length;

  return (
    <Screen>
      <Header
        title="Verification"
        subtitle="Your identity and document status."
      />
      <View
        style={[
          styles.hero,
          {
            backgroundColor: status.approved
              ? colors.successSoft
              : colors.warningSoft,
          },
        ]}
      >
        <View style={[styles.heroIcon, { backgroundColor: colors.surface }]}>
          {status.approved ? (
            <CheckCircle2 color={colors.success} size={27} />
          ) : (
            <Clock3 color={colors.warning} size={27} />
          )}
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroTitle, { color: colors.ink }]}>
            {status.approved ? "Identity verified" : "Review in progress"}
          </Text>
          <Text style={[styles.heroBody, { color: colors.muted }]}>
            {status.approved
              ? "Your account was approved by AnyJob. Your KYC is complete."
              : `${completeCount} of ${checks.length} verification items completed.`}
          </Text>
        </View>
        <Pill
          text={status.approved ? "Approved" : "Pending"}
          tone={status.approved ? "success" : "warning"}
        />
      </View>

      <SectionHeader title="Verification checklist" />
      <Card>
        {checks.map(([label, done]) => (
          <View
            key={label}
            style={[
              styles.check,
              { backgroundColor: done ? colors.successSoft : colors.soft },
            ]}
          >
            <View
              style={[styles.checkIcon, { backgroundColor: colors.surface }]}
            >
              {done ? (
                <Check color={colors.success} size={17} strokeWidth={3} />
              ) : (
                <FileCheck2 color={colors.subtle} size={17} />
              )}
            </View>
            <Text style={[styles.checkText, { color: colors.ink }]}>
              {label}
            </Text>
            <Text
              style={[
                styles.checkState,
                { color: done ? colors.success : colors.warning },
              ]}
            >
              {done ? "Complete" : "Pending"}
            </Text>
          </View>
        ))}
      </Card>

      {!status.approved ? (
        <>
          <SectionHeader title="Verification documents" />
          <Card>
            <Text style={[styles.uploadCopy, { color: colors.muted }]}>
              Upload clear, current files. You can replace a file while your
              account is under review.
            </Text>
            <Button
              title={
                status.idFrontUploaded ? "Replace ID front" : "Upload ID front"
              }
              variant="secondary"
              icon={<Upload color={colors.ink} size={18} />}
              loading={uploading === "front"}
              onPress={() => void uploadIdentity("front")}
            />
            <Button
              title={
                status.idBackUploaded ? "Replace ID back" : "Upload ID back"
              }
              variant="secondary"
              icon={<Upload color={colors.ink} size={18} />}
              loading={uploading === "back"}
              onPress={() => void uploadIdentity("back")}
            />
            <Button
              title={
                status.selfieUploaded
                  ? "Replace selfie video"
                  : "Upload selfie video"
              }
              variant="secondary"
              icon={<Upload color={colors.ink} size={18} />}
              loading={uploading === "selfie"}
              onPress={() => void uploadSelfie()}
            />
            {typeof status.insuranceUploaded === "boolean" ? (
              <Button
                title={
                  status.insuranceUploaded
                    ? "Replace insurance document"
                    : "Upload insurance document"
                }
                variant="secondary"
                icon={<Upload color={colors.ink} size={18} />}
                loading={uploading === "insurance"}
                onPress={() => void uploadInsurance()}
              />
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  heroBody: { fontSize: 11.5, lineHeight: 17 },
  check: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { flex: 1, fontSize: 12.5, fontWeight: "800" },
  checkState: { fontSize: 10.5, fontWeight: "900" },
  uploadCopy: { fontSize: 12, lineHeight: 18, marginBottom: 2 },
});
