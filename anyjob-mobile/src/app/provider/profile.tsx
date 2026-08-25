import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Upload } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";

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
import { OptionCards } from "@/components/form-options";
import { ServiceAreaPicker, type ServiceAreaValue } from "@/components/service-area-picker";
import { api, jsonBody } from "@/lib/api";
import { CATEGORIES } from "@/lib/questionnaire";
import { uploadMarketplaceFile } from "@/lib/uploads";
import { useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bio: "",
  serviceCategory: "",
  experienceLevel: "",
  availabilityMode: "This week",
  availabilityNote: "",
  contactWindows: "",
  unavailable: "false",
  unavailableUntil: "",
  unavailableNote: "",
  address: "",
  city: "",
  postalCode: "",
  hourlyRate: "25",
  profileImageUrl: "",
  country: "",
  serviceAreaRadiusKm: "15",
};

const experienceOptions = [
  "New provider",
  "Beginner",
  "Intermediate",
  "Experienced",
  "Expert",
  "Agency",
].map((value) => ({ value, label: value }));
const availabilityOptions = [
  "Today",
  "This week",
  "Weekends",
  "Evenings",
  "Remote",
].map((value) => ({ value, label: value }));

export default function ProviderProfileScreen() {
  const { refreshUser } = useAuth();
  const { colors } = useAppTheme();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["provider-profile"],
    queryFn: () => api<any>("/api/provider/profile"),
  });
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState<string | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceAreaValue[]>([]);

  useEffect(() => {
    const row = query.data?.seller;
    if (row)
      setForm({
        firstName: row.first_name || "",
        lastName: row.last_name || "",
        email: row.email || query.data?.user?.email || "",
        phone: row.phone || "",
        bio: row.description || "",
        serviceCategory: row.service_category || "",
        experienceLevel: row.experience_level || "",
        availabilityMode:
          row.availability?.marketplaceAvailability || "This week",
        availabilityNote: row.availability?.note || "",
        contactWindows: Array.isArray(row.availability?.contactWindows)
          ? row.availability.contactWindows.join("\n")
          : "",
        unavailable: row.availability?.unavailable ? "true" : "false",
        unavailableUntil: row.availability?.unavailableUntil || "",
        unavailableNote: row.availability?.unavailableNote || "",
        address: row.address || "",
        city: row.city || "",
        postalCode: row.postal_code || "",
        hourlyRate: String(row.hourly_rate || 25),
        profileImageUrl: row.profile_image_url || "",
        country: row.country || "",
        serviceAreaRadiusKm: String(row.service_area_radius_km || 15),
      });
    if (Array.isArray(query.data?.serviceAreas)) setServiceAreas(query.data.serviceAreas);
  }, [query.data]);
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const save = useMutation({
    mutationFn: () =>
      api("/api/provider/profile", {
        method: "PATCH",
        ...jsonBody({
          ...form,
          hourlyRate: Number(form.hourlyRate),
          unavailable: form.unavailable === "true",
          contactWindows: form.contactWindows
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean),
          serviceAreas,
          serviceAreaRadiusKm: Number(form.serviceAreaRadiusKm),
        }),
      }),
    onSuccess: async () => {
      await Promise.all([
        refreshUser(),
        client.invalidateQueries({ queryKey: ["provider-profile"] }),
      ]);
      Alert.alert("Provider profile saved");
    },
    onError: (error: Error) => Alert.alert("Could not save", error.message),
  });
  const pickImage = async (type: "profile" | "portfolio") => {
    try {
      setUploading(type);
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted)
        throw new Error("Photo library permission is required.");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: type === "profile",
        aspect: type === "profile" ? [1, 1] : [4, 3],
        quality: 0.85,
      });
      if (result.canceled) return;
      const uploaded = await uploadMarketplaceFile(result.assets[0], type);
      if (type === "profile")
        setForm((current) => ({
          ...current,
          profileImageUrl: uploaded.image.image_url,
        }));
      await client.invalidateQueries({ queryKey: ["provider-profile"] });
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
  const portfolio = (query.data?.files || []).filter(
    (file: any) => file.image_type === "portfolio",
  );

  return (
    <Screen>
      <Header
        title="Provider profile"
        subtitle="Your public identity, services and availability."
      />
      <View
        style={[
          styles.profileHero,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <View>
          {form.profileImageUrl ? (
            <Image
              alt="Provider profile"
              accessibilityLabel="Provider profile"
              source={{ uri: form.profileImageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[styles.avatarEmpty, { backgroundColor: colors.soft }]}
            >
              <ImagePlus color={colors.muted} />
            </View>
          )}
          <View
            style={[
              styles.camera,
              { backgroundColor: colors.brand, borderColor: colors.surface },
            ]}
          >
            <Camera color="white" size={14} />
          </View>
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroName, { color: colors.ink }]}>
            {[form.firstName, form.lastName].filter(Boolean).join(" ") ||
              "Your public profile"}
          </Text>
          <Text style={[styles.heroMeta, { color: colors.muted }]}>
            {form.serviceCategory || "Add your main service"}
            {form.city ? ` · ${form.city}` : ""}
          </Text>
          <Button
            title="Change photo"
            variant="secondary"
            loading={uploading === "profile"}
            onPress={() => void pickImage("profile")}
          />
        </View>
      </View>

      <SectionHeader title="Personal details" />
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
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={set("email")}
        />
        <Field label="Phone" value={form.phone} onChangeText={set("phone")} />
      </Card>
      <SectionHeader title="Professional profile" />
      <Card>
        <Text style={[styles.fieldLabel, { color: colors.ink }]}>
          Main service category
        </Text>
        <OptionCards
          columns={2}
          options={CATEGORIES.map((category) => ({
            value: category.name,
            label: category.name,
          }))}
          value={form.serviceCategory}
          onChange={set("serviceCategory")}
        />
        <Text style={[styles.fieldLabel, { color: colors.ink }]}>
          Seller experience level
        </Text>
        <OptionCards
          columns={2}
          options={experienceOptions}
          value={form.experienceLevel}
          onChange={set("experienceLevel")}
        />
        <Field
          label="About your work"
          multiline
          value={form.bio}
          onChangeText={set("bio")}
        />
        <Field
          label="Hourly rate (€)"
          keyboardType="decimal-pad"
          value={form.hourlyRate}
          onChangeText={set("hourlyRate")}
        />
      </Card>
      <SectionHeader title="Availability" />
      <Card>
        <Text style={[styles.fieldLabel, { color: colors.ink }]}>
          Marketplace availability
        </Text>
        <OptionCards
          columns={2}
          options={availabilityOptions}
          value={form.availabilityMode}
          onChange={set("availabilityMode")}
        />
        <Field
          label="Availability note"
          value={form.availabilityNote}
          onChangeText={set("availabilityNote")}
        />
        <Field
          label="Best times to contact"
          multiline
          value={form.contactWindows}
          placeholder={"Mon-Fri 09:00-17:00\nSat 10:00-14:00"}
          onChangeText={set("contactWindows")}
        />
        <Text style={[styles.fieldLabel, { color: colors.ink }]}>
          Contact status
        </Text>
        <OptionCards
          columns={2}
          options={[
            { value: "false", label: "Available" },
            { value: "true", label: "Unavailable" },
          ]}
          value={form.unavailable}
          onChange={set("unavailable")}
        />
        {form.unavailable === "true" ? (
          <>
            <Field
              label="Unavailable until"
              value={form.unavailableUntil}
              placeholder="2026-08-15T17:00"
              onChangeText={set("unavailableUntil")}
            />
            <Field
              label="Unavailable message"
              value={form.unavailableNote}
              placeholder="Away on booked work this week"
              onChangeText={set("unavailableNote")}
            />
          </>
        ) : null}
      </Card>
      <SectionHeader title="Location" />
      <Card>
        <Field
          label="Address"
          value={form.address}
          onChangeText={set("address")}
        />
        <Field label="City" value={form.city} editable={false} />
        <Field
          label="Postal code"
          value={form.postalCode}
          editable={false}
        />
        <Field label="Country" value={form.country} editable={false} />
        <ServiceAreaPicker
          areas={serviceAreas}
          country={form.country}
          radiusKm={Number(form.serviceAreaRadiusKm) || 15}
          onAreasChange={setServiceAreas}
          onRadiusChange={(value) => set("serviceAreaRadiusKm")(String(value))}
        />
      </Card>
      <Button
        title="Save profile"
        loading={save.isPending}
        onPress={() => save.mutate()}
      />

      <SectionHeader title="Portfolio" />
      <Card>
        <View style={styles.portfolioTitle}>
          <View style={styles.portfolioCopy}>
            <Text style={[styles.mediaTitle, { color: colors.ink }]}>
              Work samples
            </Text>
            <Text style={[styles.caption, { color: colors.muted }]}>
              {portfolio.length} of 4 images
            </Text>
          </View>
          <Button
            title="Add"
            variant="secondary"
            icon={<Upload color={colors.ink} size={17} />}
            disabled={portfolio.length >= 4}
            loading={uploading === "portfolio"}
            onPress={() => void pickImage("portfolio")}
          />
        </View>
        {portfolio.length ? (
          <View style={styles.grid}>
            {portfolio.map((file: any) => (
              <Image
                alt="Portfolio work sample"
                accessibilityLabel="Portfolio work sample"
                key={file.id}
                source={{ uri: file.image_url }}
                style={[
                  styles.portfolioImage,
                  { backgroundColor: colors.soft },
                ]}
              />
            ))}
          </View>
        ) : (
          <View
            style={[styles.emptyPortfolio, { backgroundColor: colors.soft }]}
          >
            <ImagePlus color={colors.muted} size={22} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Add clear examples of your best work.
            </Text>
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileHero: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
  },
  avatar: { width: 74, height: 74, borderRadius: 24 },
  avatarEmpty: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 27,
    height: 27,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1, alignItems: "flex-start", gap: 4 },
  heroName: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  heroMeta: { fontSize: 11.5, lineHeight: 16, marginBottom: 3 },
  portfolioTitle: { flexDirection: "row", alignItems: "center", gap: 12 },
  portfolioCopy: { flex: 1, gap: 2 },
  mediaTitle: { fontWeight: "900", fontSize: 14.5 },
  caption: { fontSize: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  portfolioImage: { width: "48%", aspectRatio: 4 / 3, borderRadius: 11 },
  emptyPortfolio: {
    minHeight: 100,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: 15,
  },
  emptyText: { fontSize: 11.5 },
  fieldLabel: { fontSize: 12.5, fontWeight: "900", marginBottom: -2 },
});
