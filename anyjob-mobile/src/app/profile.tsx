import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, MapPin, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
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
import { uploadMarketplaceFile } from "@/lib/uploads";
import { useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";

type BuyerForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImageUrl: string;
  address: string;
  city: string;
  postalCode: string;
};

export default function ProfileScreen() {
  const query = useQuery({
    queryKey: ["account"],
    queryFn: () => api<any>("/api/mobile/account"),
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
  const row = query.data?.buyer || query.data?.profile || {};
  return (
    <BuyerProfileForm
      key={`${row.id}-${row.updated_at || "initial"}`}
      initial={{
        firstName: row.first_name || "",
        lastName: row.last_name || "",
        email: row.email || query.data?.user?.email || "",
        phone: row.phone || "",
        profileImageUrl: row.profile_image_url || row.avatar_url || "",
        address: row.address || "",
        city: row.city || "",
        postalCode: row.postal_code || "",
      }}
    />
  );
}

function BuyerProfileForm({ initial }: { initial: BuyerForm }) {
  const { refreshUser } = useAuth();
  const { colors } = useAppTheme();
  const client = useQueryClient();
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const set = (key: keyof BuyerForm) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const save = useMutation({
    mutationFn: () =>
      api("/api/mobile/account", { method: "PATCH", ...jsonBody(form) }),
    onSuccess: async () => {
      await Promise.all([
        refreshUser(),
        client.invalidateQueries({ queryKey: ["account"] }),
      ]);
      Alert.alert("Account details saved");
    },
    onError: (error: Error) => Alert.alert("Could not save", error.message),
  });
  const changePhoto = async () => {
    try {
      setUploading(true);
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted)
        throw new Error("Photo library permission is required.");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) return;
      const uploaded = await uploadMarketplaceFile(result.assets[0], "profile");
      setForm((current) => ({
        ...current,
        profileImageUrl: uploaded.image.image_url,
      }));
      await client.invalidateQueries({ queryKey: ["account"] });
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error instanceof Error ? error.message : "Try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <Header title="Personal information" />
      <View
        style={[
          styles.identity,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        {form.profileImageUrl ? (
          <Image
            alt="Profile photo"
            source={{ uri: form.profileImageUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatarEmpty, { backgroundColor: colors.soft }]}>
            <UserRound color={colors.muted} size={29} />
          </View>
        )}
        <View style={styles.identityCopy}>
          <Text style={[styles.name, { color: colors.ink }]}>
            {[form.firstName, form.lastName].filter(Boolean).join(" ") ||
              "Your profile"}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.email, { color: colors.muted }]}
          >
            {form.email}
          </Text>
          <Button
            title="Change photo"
            variant="secondary"
            loading={uploading}
            icon={<Camera color={colors.ink} size={16} />}
            onPress={() => void changePhoto()}
          />
        </View>
      </View>

      <SectionHeader title="Personal information" />
      <Card>
        <Field
          label="First name"
          value={form.firstName}
          onChangeText={set("firstName")}
        />
        <Field
          label="Last name"
          value={form.lastName}
          onChangeText={set("lastName")}
        />
        <Field
          label="Email"
          value={form.email}
          onChangeText={set("email")}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field label="Phone" value={form.phone} onChangeText={set("phone")} />
      </Card>

      <SectionHeader title="Primary address" />
      <Card>
        <View style={styles.sectionIntro}>
          <MapPin color={colors.info} size={19} />
          <Text style={[styles.help, { color: colors.muted }]}>
            Your exact address stays hidden from providers until the booking
            step.
          </Text>
        </View>
        <Field
          label="Address"
          placeholder="Street address"
          value={form.address}
          onChangeText={set("address")}
        />
        <Field label="City" value={form.city} onChangeText={set("city")} />
        <Field
          label="Eircode"
          value={form.postalCode}
          onChangeText={set("postalCode")}
        />
      </Card>
      <Button
        title="Save changes"
        loading={save.isPending}
        disabled={!form.firstName.trim() || !form.lastName.trim()}
        onPress={() => save.mutate()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  avatar: { width: 72, height: 72, borderRadius: 24 },
  avatarEmpty: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  identityCopy: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    alignItems: "flex-start",
    gap: 4,
  },
  name: { fontSize: 17, fontWeight: "900" },
  email: { width: "100%", fontSize: 11.5, marginBottom: 3 },
  sectionIntro: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  help: { flex: 1, fontSize: 11.5, lineHeight: 17 },
});
