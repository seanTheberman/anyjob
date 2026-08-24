import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { OptionCards } from "@/components/form-options";
import {
  Button,
  Card,
  Field,
  Header,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { SHIFT_NICHES, WORK_TYPES } from "@/lib/shift-work";
import { useAppTheme } from "@/providers/theme-provider";

const DEFAULT_NICHE = SHIFT_NICHES[1];

export default function NewShiftScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const { colors } = useAppTheme();
  const business = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => api<any>("/api/business/register"),
  });
  const [form, setForm] = useState({
    workType: "part_time_day_wage",
    niche: DEFAULT_NICHE.value,
    industry: DEFAULT_NICHE.industry,
    roleTitle: DEFAULT_NICHE.roles[0],
    description: "",
    locationName: "",
    address: "",
    city: "",
    postalCode: "",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "17:00",
    headcount: "1",
    hourlyRate: String(DEFAULT_NICHE.hourlyAverage),
    dayRate: String(DEFAULT_NICHE.dayAverage),
    acceptsWorkerRateVariation: true,
    requirements: "",
    uniform: "",
    breakPolicy: "",
    contactName: "",
    contactPhone: "",
  });
  const selectedNiche = useMemo(
    () =>
      SHIFT_NICHES.find((niche) => niche.value === form.niche) || DEFAULT_NICHE,
    [form.niche],
  );
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setNiche = (value: string) => {
    const niche =
      SHIFT_NICHES.find((item) => item.value === value) || DEFAULT_NICHE;
    setForm((current) => ({
      ...current,
      niche: niche.value,
      industry: niche.industry,
      roleTitle: niche.roles[0],
      hourlyRate: String(niche.hourlyAverage),
      dayRate: String(niche.dayAverage),
    }));
  };
  const mutation = useMutation({
    mutationFn: () =>
      api("/api/business/posts", {
        method: "POST",
        ...jsonBody({
          ...form,
          headcount: Number(form.headcount),
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
          dayRate: form.dayRate ? Number(form.dayRate) : null,
          contactName:
            form.contactName || business.data?.business?.contact_name || "",
          contactPhone:
            form.contactPhone || business.data?.business?.contact_phone || "",
        }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["business-posts"] });
      router.replace("/business");
      Alert.alert(
        "Business work posted",
        "Matching approved workers can now apply.",
      );
    },
    onError: (error: Error) =>
      Alert.alert("Could not post work", error.message),
  });
  const scheduleRequired = form.workType !== "freelance_service";
  const valid =
    form.roleTitle &&
    form.description.trim().length >= 10 &&
    form.address.trim() &&
    form.city.trim() &&
    (!scheduleRequired ||
      (form.startDate && form.startTime && form.endDate && form.endTime));

  return (
    <Screen>
      <Header title="Post business work" />
      <SectionHeader title="Work type" />
      <OptionCards
        options={WORK_TYPES}
        value={form.workType}
        onChange={set("workType")}
      />

      <SectionHeader title="Worker niche" />
      <OptionCards
        columns={2}
        options={SHIFT_NICHES.map((niche) => ({
          value: niche.value,
          label: niche.label,
        }))}
        value={form.niche}
        onChange={setNiche}
      />

      <SectionHeader title="Role and duties" />
      <Card>
        <Text style={[styles.fieldLabel, { color: colors.ink }]}>Role</Text>
        <OptionCards
          columns={2}
          options={selectedNiche.roles.map((role) => ({
            value: role,
            label: role,
          }))}
          value={form.roleTitle}
          onChange={set("roleTitle")}
        />
        <Field
          label="Description"
          placeholder="Describe duties, expectations, experience, and must-have requirements"
          multiline
          value={form.description}
          onChangeText={set("description")}
        />
        <Field
          label="Headcount"
          keyboardType="number-pad"
          value={form.headcount}
          onChangeText={set("headcount")}
        />
      </Card>

      <SectionHeader title="Place and schedule" />
      <Card>
        <Field
          label="Location name"
          placeholder="Venue, ward, store, warehouse..."
          value={form.locationName}
          onChangeText={set("locationName")}
        />
        <Field
          label="Address"
          value={form.address}
          onChangeText={set("address")}
        />
        <Field label="City" value={form.city} onChangeText={set("city")} />
        <Field
          label="Eircode"
          value={form.postalCode}
          onChangeText={set("postalCode")}
        />
        {scheduleRequired ? (
          <>
            <View style={styles.columns}>
              <View style={styles.column}>
                <Field
                  label="Start date"
                  placeholder="YYYY-MM-DD"
                  value={form.startDate}
                  onChangeText={set("startDate")}
                />
              </View>
              <View style={styles.column}>
                <Field
                  label="Start time"
                  placeholder="09:00"
                  value={form.startTime}
                  onChangeText={set("startTime")}
                />
              </View>
            </View>
            <View style={styles.columns}>
              <View style={styles.column}>
                <Field
                  label="End date"
                  placeholder="YYYY-MM-DD"
                  value={form.endDate}
                  onChangeText={set("endDate")}
                />
              </View>
              <View style={styles.column}>
                <Field
                  label="End time"
                  placeholder="17:00"
                  value={form.endTime}
                  onChangeText={set("endTime")}
                />
              </View>
            </View>
          </>
        ) : null}
      </Card>

      <SectionHeader title="Rates and conditions" />
      <Card>
        <View style={styles.columns}>
          <View style={styles.column}>
            <Field
              label="Hourly rate (€)"
              keyboardType="decimal-pad"
              value={form.hourlyRate}
              onChangeText={set("hourlyRate")}
            />
          </View>
          <View style={styles.column}>
            <Field
              label="Day rate (€)"
              keyboardType="decimal-pad"
              value={form.dayRate}
              onChangeText={set("dayRate")}
            />
          </View>
        </View>
        <View style={styles.toggle}>
          <View style={styles.toggleCopy}>
            <Text style={[styles.toggleTitle, { color: colors.ink }]}>
              Accept worker rate variation
            </Text>
            <Text style={[styles.toggleBody, { color: colors.muted }]}>
              Workers may propose a different rate when applying.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Accept worker rate variation"
            value={form.acceptsWorkerRateVariation}
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                acceptsWorkerRateVariation: value,
              }))
            }
            trackColor={{ false: colors.softStrong, true: colors.brand }}
            thumbColor="white"
          />
        </View>
        <Field
          label="Requirements"
          multiline
          value={form.requirements}
          onChangeText={set("requirements")}
        />
        <Field
          label="Uniform"
          value={form.uniform}
          onChangeText={set("uniform")}
        />
        <Field
          label="Break policy"
          value={form.breakPolicy}
          onChangeText={set("breakPolicy")}
        />
      </Card>

      <SectionHeader title="Business contact" />
      <Card>
        <Field
          label="Contact name"
          placeholder={
            business.data?.business?.contact_name || "Primary contact"
          }
          value={form.contactName}
          onChangeText={set("contactName")}
        />
        <Field
          label="Contact phone"
          placeholder={business.data?.business?.contact_phone || "Phone"}
          value={form.contactPhone}
          onChangeText={set("contactPhone")}
        />
      </Card>
      <Button
        title="Publish business work"
        loading={mutation.isPending}
        disabled={!valid}
        onPress={() => mutation.mutate()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 12.5, fontWeight: "900" },
  columns: { flexDirection: "row", gap: 9 },
  column: { flex: 1, minWidth: 0 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleCopy: { flex: 1, gap: 3 },
  toggleTitle: { fontSize: 13, fontWeight: "900" },
  toggleBody: { fontSize: 10.5, lineHeight: 15 },
});
