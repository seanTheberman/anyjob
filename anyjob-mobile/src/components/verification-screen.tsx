import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FolderOpen,
  Video,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";

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

type VerificationStatus = {
  approved?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  idFrontUploaded?: boolean;
  idBackUploaded?: boolean;
  selfieUploaded?: boolean;
  insuranceUploaded?: boolean;
};

export default function VerificationScreen() {
  const { colors } = useAppTheme();
  const client = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["verification"],
    queryFn: () =>
      api<{ verification: VerificationStatus }>("/api/mobile/verification"),
  });

  const chooseDocument = () =>
    DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
      copyToCacheDirectory: true,
    });

  const captureWithCamera = async (mediaTypes: ["images"] | ["videos"]) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera access needed",
        permission.canAskAgain
          ? "Allow camera access to scan verification documents."
          : "Camera access is disabled. Open Settings and allow camera access for AnyJob.",
        permission.canAskAgain
          ? [{ text: "OK" }]
          : [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => void Linking.openSettings(),
              },
            ],
      );
      return null;
    }

    return ImagePicker.launchCameraAsync({
      mediaTypes,
      quality: mediaTypes[0] === "images" ? 0.9 : 0.75,
      videoMaxDuration: mediaTypes[0] === "videos" ? 30 : undefined,
    });
  };

  const uploadIdentity = async (
    side: "front" | "back",
    source: "camera" | "file",
  ) => {
    try {
      setUploading(side);
      const result =
        source === "camera"
          ? await captureWithCamera(["images"])
          : await chooseDocument();
      if (!result || result.canceled) return;
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

  const uploadInsurance = async (source: "camera" | "file") => {
    try {
      setUploading("insurance");
      const result =
        source === "camera"
          ? await captureWithCamera(["images"])
          : await chooseDocument();
      if (!result || result.canceled) return;
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

  const uploadSelfie = async (source: "camera" | "library") => {
    try {
      setUploading("selfie");
      let result: ImagePicker.ImagePickerResult | null;
      if (source === "camera") {
        result = await captureWithCamera(["videos"]);
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted)
          throw new Error("Photo library permission is required.");
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["videos"],
          videoMaxDuration: 30,
        });
      }
      if (!result || result.canceled) return;
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
            <CaptureActions
              title={
                status.idFrontUploaded
                  ? "Replace ID front"
                  : "Government ID front"
              }
              loading={uploading === "front"}
              onCamera={() => void uploadIdentity("front", "camera")}
              onFile={() => void uploadIdentity("front", "file")}
            />
            <CaptureActions
              title={
                status.idBackUploaded
                  ? "Replace ID back"
                  : "Government ID back"
              }
              loading={uploading === "back"}
              onCamera={() => void uploadIdentity("back", "camera")}
              onFile={() => void uploadIdentity("back", "file")}
            />
            <CaptureActions
              title={
                status.selfieUploaded ? "Replace selfie video" : "Selfie video"
              }
              loading={uploading === "selfie"}
              cameraLabel="Record"
              fileLabel="Choose video"
              cameraIcon="video"
              onCamera={() => void uploadSelfie("camera")}
              onFile={() => void uploadSelfie("library")}
            />
            {typeof status.insuranceUploaded === "boolean" ? (
              <CaptureActions
                title={
                  status.insuranceUploaded
                    ? "Replace insurance document"
                    : "Insurance document"
                }
                loading={uploading === "insurance"}
                onCamera={() => void uploadInsurance("camera")}
                onFile={() => void uploadInsurance("file")}
              />
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function CaptureActions({
  title,
  loading,
  onCamera,
  onFile,
  cameraLabel = "Scan",
  fileLabel = "Choose file",
  cameraIcon = "camera",
}: {
  title: string;
  loading: boolean;
  onCamera: () => void;
  onFile: () => void;
  cameraLabel?: string;
  fileLabel?: string;
  cameraIcon?: "camera" | "video";
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.captureGroup, { borderTopColor: colors.line }]}>
      <Text style={[styles.captureTitle, { color: colors.ink }]}>{title}</Text>
      <View style={styles.captureActions}>
        <View style={styles.captureAction}>
          <Button
            title={cameraLabel}
            icon={
              cameraIcon === "video" ? (
                <Video color="white" size={18} />
              ) : (
                <Camera color="white" size={18} />
              )
            }
            loading={loading}
            onPress={onCamera}
          />
        </View>
        <View style={styles.captureAction}>
          <Button
            title={fileLabel}
            variant="secondary"
            icon={<FolderOpen color={colors.ink} size={18} />}
            disabled={loading}
            onPress={onFile}
          />
        </View>
      </View>
    </View>
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
  captureGroup: {
    gap: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  captureTitle: { fontSize: 13, fontWeight: "900" },
  captureActions: { flexDirection: "row", gap: 9 },
  captureAction: { flex: 1, minWidth: 0 },
});
