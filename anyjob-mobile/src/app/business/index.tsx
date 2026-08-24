import { useMutation, useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import {
  Building2,
  FileCheck2,
  FileUp,
  Plus,
  Users,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { ChipPicker, OptionCards } from "@/components/form-options";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Header,
  ListGroup,
  LoadingState,
  Pill,
  RowLink,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import {
  BUSINESS_DOCUMENTS,
  BUSINESS_TYPES,
  SHIFT_NICHES,
  WORK_TYPES,
} from "@/lib/shift-work";
import { uploadDocumentFile } from "@/lib/uploads";
import { useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";

const TOTAL_STEPS = 5;
const STEP_TITLES = [
  "Choose work types",
  "Set staffing needs",
  "Business identity",
  "Verification documents",
  "Review registration",
];
const WORK_TYPE_LABELS = Object.fromEntries(
  WORK_TYPES.map((type) => [type.value, type.label]),
);

type DocumentKey = (typeof BUSINESS_DOCUMENTS)[number][0];
type BusinessForm = {
  businessName: string;
  legalName: string;
  registrationNumber: string;
  businessType: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  typicalWorkTypes: string[];
  typicalRolesNeeded: string[];
  customRoleInput: string;
  expectedWorkerCount: string;
  workerPlan: string;
  documents: Partial<Record<DocumentKey, { url: string; fileName: string }>>;
};

export default function BusinessScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { colors } = useAppTheme();
  const profile = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => api<any>("/api/business/register"),
  });
  const posts = useQuery({
    queryKey: ["business-posts"],
    queryFn: () => api<any>("/api/business/posts"),
    enabled: Boolean(profile.data?.business),
  });
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState<DocumentKey | null>(null);
  const [form, setForm] = useState<BusinessForm>({
    businessName: "",
    legalName: "",
    registrationNumber: "",
    businessType: BUSINESS_TYPES[0].value,
    industry: SHIFT_NICHES[0].industry,
    contactName: user?.displayName || "",
    contactEmail: user?.email || "",
    contactPhone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Ireland",
    typicalWorkTypes: ["part_time_day_wage", "long_duration_shift"],
    typicalRolesNeeded: SHIFT_NICHES[0].roles.slice(0, 2),
    customRoleInput: "",
    expectedWorkerCount: "2",
    workerPlan: "",
    documents: {},
  });
  const set = (key: keyof BusinessForm) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const selectedNiche = useMemo(
    () =>
      SHIFT_NICHES.find((item) => item.industry === form.industry) ||
      SHIFT_NICHES[0],
    [form.industry],
  );
  const toggleArray = (
    key: "typicalWorkTypes" | "typicalRolesNeeded",
    value: string,
  ) =>
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  const changeIndustry = (value: string) => {
    const niche =
      SHIFT_NICHES.find((item) => item.industry === value) || SHIFT_NICHES[0];
    setForm((current) => ({
      ...current,
      industry: niche.industry,
      typicalRolesNeeded: niche.roles.slice(0, 2),
    }));
  };
  const addCustomRole = () => {
    const role = form.customRoleInput.trim();
    if (!role) return;
    setForm((current) => ({
      ...current,
      typicalRolesNeeded: current.typicalRolesNeeded.includes(role)
        ? current.typicalRolesNeeded
        : [...current.typicalRolesNeeded, role],
      customRoleInput: "",
    }));
  };
  const chooseDocument = async (key: DocumentKey) => {
    try {
      setUploading(key);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const uploaded = await uploadDocumentFile(
        result.assets[0],
        "anyjob/business-documents",
      );
      setForm((current) => ({
        ...current,
        documents: {
          ...current.documents,
          [key]: { url: uploaded.url, fileName: uploaded.fileName },
        },
      }));
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error instanceof Error ? error.message : "Try again.",
      );
    } finally {
      setUploading(null);
    }
  };
  const register = useMutation({
    mutationFn: () =>
      api("/api/business/register", {
        method: "POST",
        ...jsonBody({
          ...form,
          documents: BUSINESS_DOCUMENTS.map(([key, label]) => ({
            type: key,
            label,
            link: form.documents[key]?.url || "",
          })).filter((document) => document.link),
        }),
      }),
    onSuccess: async () => {
      await Promise.all([profile.refetch(), refreshUser()]);
      Alert.alert(
        "Registration submitted",
        "Admin approval is required before business work can be posted.",
      );
    },
    onError: (error: Error) => Alert.alert("Could not register", error.message),
  });

  const validateStep = () => {
    if (step === 1 && !form.typicalWorkTypes.length)
      return "Select at least one work type.";
    if (
      step === 2 &&
      (!form.industry ||
        !form.typicalRolesNeeded.length ||
        Number(form.expectedWorkerCount) <= 0)
    )
      return "Choose an industry, at least one role, and the expected worker count.";
    if (
      step === 3 &&
      (!form.businessName.trim() ||
        !form.registrationNumber.trim() ||
        !form.businessType ||
        !form.contactName.trim() ||
        !form.contactEmail.trim() ||
        !form.contactPhone.trim() ||
        !form.address.trim() ||
        !form.city.trim())
    )
      return "Complete the required business, contact, and address fields.";
    if (step === 4 && !form.documents.registration?.url)
      return "Upload the company registration or CRO document.";
    return null;
  };
  const next = () => {
    const error = validateStep();
    if (error) return Alert.alert("Complete this step", error);
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  if (profile.isLoading)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (profile.isError)
    return (
      <Screen>
        <ErrorState
          message={(profile.error as Error).message}
          retry={() => void profile.refetch()}
        />
      </Screen>
    );
  const business = profile.data?.business;

  if (!business) {
    return (
      <Screen>
        <Header title="Business registration" />
        <View style={styles.progressHead}>
          <Text style={[styles.step, { color: colors.brand }]}>
            STEP {step} OF {TOTAL_STEPS}
          </Text>
          <Text style={[styles.stepTitle, { color: colors.ink }]}>
            {STEP_TITLES[step - 1]}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.softStrong }]}>
          <View
            style={[
              styles.fill,
              {
                backgroundColor: colors.brand,
                width: `${(step / TOTAL_STEPS) * 100}%`,
              },
            ]}
          />
        </View>

        {step === 1 ? (
          <Card>
            <OptionCards
              options={WORK_TYPES}
              value=""
              selectedValues={form.typicalWorkTypes}
              onChange={(value) => toggleArray("typicalWorkTypes", value)}
            />
          </Card>
        ) : null}

        {step === 2 ? (
          <View style={styles.stack}>
            <SectionHeader title="Industry" />
            <OptionCards
              columns={2}
              options={SHIFT_NICHES.map((niche) => ({
                value: niche.industry,
                label: niche.label,
              }))}
              value={form.industry}
              onChange={changeIndustry}
            />
            <SectionHeader title="Typical roles needed" />
            <ChipPicker
              options={selectedNiche.roles.map((role) => ({
                value: role,
                label: role,
              }))}
              values={form.typicalRolesNeeded}
              onToggle={(value) => toggleArray("typicalRolesNeeded", value)}
            />
            <Card>
              <Field
                label="Add another role"
                value={form.customRoleInput}
                onChangeText={set("customRoleInput")}
                onSubmitEditing={addCustomRole}
              />
              <Button
                title="Add role"
                variant="secondary"
                onPress={addCustomRole}
              />
              <Field
                label="Expected worker count"
                keyboardType="number-pad"
                value={form.expectedWorkerCount}
                onChangeText={set("expectedWorkerCount")}
              />
              <Field
                label="Staffing plan"
                multiline
                value={form.workerPlan}
                onChangeText={set("workerPlan")}
              />
            </Card>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stack}>
            <SectionHeader title="Business identity" />
            <Card>
              <Field
                label="Business display name"
                value={form.businessName}
                onChangeText={set("businessName")}
              />
              <Field
                label="Legal / registered name"
                value={form.legalName}
                onChangeText={set("legalName")}
              />
              <Field
                label="Registration number"
                value={form.registrationNumber}
                onChangeText={set("registrationNumber")}
              />
              <Text style={[styles.fieldLabel, { color: colors.ink }]}>
                Business type
              </Text>
              <OptionCards
                columns={2}
                options={BUSINESS_TYPES}
                value={form.businessType}
                onChange={set("businessType")}
              />
            </Card>
            <SectionHeader title="Primary contact" />
            <Card>
              <Field
                label="Contact name"
                value={form.contactName}
                onChangeText={set("contactName")}
              />
              <Field
                label="Contact email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.contactEmail}
                onChangeText={set("contactEmail")}
              />
              <Field
                label="Contact phone"
                value={form.contactPhone}
                onChangeText={set("contactPhone")}
              />
            </Card>
            <SectionHeader title="Registered address" />
            <Card>
              <Field
                label="Address"
                value={form.address}
                onChangeText={set("address")}
              />
              <Field
                label="City"
                value={form.city}
                onChangeText={set("city")}
              />
              <Field
                label="Eircode"
                value={form.postalCode}
                onChangeText={set("postalCode")}
              />
              <Field label="Country" value="Ireland" editable={false} />
            </Card>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.stack}>
            {BUSINESS_DOCUMENTS.map(([key, label, required]) => {
              const file = form.documents[key];
              return (
                <View
                  key={key}
                  style={[
                    styles.document,
                    {
                      backgroundColor: colors.surface,
                      borderColor: file ? colors.success : colors.line,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.documentIcon,
                      {
                        backgroundColor: file
                          ? colors.successSoft
                          : colors.soft,
                      },
                    ]}
                  >
                    {file ? (
                      <FileCheck2 color={colors.success} size={20} />
                    ) : (
                      <FileUp color={colors.muted} size={20} />
                    )}
                  </View>
                  <View style={styles.documentCopy}>
                    <Text style={[styles.documentTitle, { color: colors.ink }]}>
                      {label}
                      {required ? " *" : ""}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.documentBody, { color: colors.muted }]}
                    >
                      {file?.fileName || "PDF, JPG, PNG, or WebP"}
                    </Text>
                  </View>
                  <Button
                    title={file ? "Replace" : "Upload"}
                    variant="secondary"
                    loading={uploading === key}
                    onPress={() => void chooseDocument(key)}
                  />
                </View>
              );
            })}
          </View>
        ) : null}

        {step === 5 ? (
          <Card>
            <Review label="Business" value={form.businessName} />
            <Review
              label="Legal name"
              value={form.legalName || form.businessName}
            />
            <Review label="Registration" value={form.registrationNumber} />
            <Review label="Industry" value={form.industry} />
            <Review
              label="Work types"
              value={`${form.typicalWorkTypes.length} selected`}
            />
            <Review label="Roles" value={form.typicalRolesNeeded.join(", ")} />
            <Review
              label="Contact"
              value={`${form.contactName} · ${form.contactEmail}`}
            />
            <Review
              label="Documents"
              value={`${Object.keys(form.documents).length} attached`}
            />
          </Card>
        ) : null}

        <View style={styles.actions}>
          {step > 1 ? (
            <View style={styles.action}>
              <Button
                title="Back"
                variant="secondary"
                onPress={() => setStep((current) => current - 1)}
              />
            </View>
          ) : null}
          <View style={styles.action}>
            <Button
              title={step === TOTAL_STEPS ? "Submit registration" : "Continue"}
              loading={register.isPending}
              onPress={step === TOTAL_STEPS ? () => register.mutate() : next}
            />
          </View>
        </View>
      </Screen>
    );
  }

  const rows = posts.data?.posts || [];
  const approved = business.status === "approved";
  return (
    <Screen>
      <Header title="Business account" />
      <View
        style={[
          styles.workspace,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <View
          style={[
            styles.workspaceIcon,
            {
              backgroundColor: approved
                ? colors.successSoft
                : colors.warningSoft,
            },
          ]}
        >
          <Building2
            color={approved ? colors.success : colors.warning}
            size={26}
          />
        </View>
        <View style={styles.workspaceCopy}>
          <Text style={[styles.name, { color: colors.ink }]}>
            {business.business_name || "Business"}
          </Text>
          <Text style={[styles.muted, { color: colors.muted }]}>
            {[business.industry, business.city].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <Pill text={business.status} tone={approved ? "success" : "warning"} />
      </View>
      {approved ? (
        <>
          <Button
            title="Post business work"
            icon={<Plus color="white" size={18} />}
            onPress={() => router.push("/business/shift/new")}
          />
          <ListGroup>
            <RowLink
              title="Applications"
              subtitle="Review and manage shift applicants"
              icon={<Users color="#2f88df" size={19} />}
              onPress={() => router.push("/business/applications")}
            />
            <RowLink
              title="Find shift workers"
              subtitle="Search approved workers by niche"
              icon={<Users color="#7d5ce7" size={19} />}
              onPress={() => router.push("/business/workers")}
            />
          </ListGroup>
        </>
      ) : (
        <View style={[styles.pending, { backgroundColor: colors.warningSoft }]}>
          <Text style={[styles.pendingTitle, { color: colors.ink }]}>
            Registration under review
          </Text>
          <Text style={[styles.pendingBody, { color: colors.muted }]}>
            AnyJob approval is required before posting jobs or shifts.
          </Text>
        </View>
      )}
      <SectionHeader title="Work posts" />
      {posts.isLoading ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No work posts"
          body="Your business jobs and shifts will appear here."
        />
      ) : (
        <ListGroup>
          {rows.map((post: any) => (
            <RowLink
              key={post.id}
              title={post.role_title}
              subtitle={formatWorkPostSummary(post)}
              trailing={
                <Pill
                  text={post.status}
                  tone={post.status === "completed" ? "success" : "info"}
                />
              }
              onPress={() => router.push("/business/applications")}
            />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}

function formatWorkPostSummary(post: any) {
  const workers = `${post.headcount || 1} worker${Number(post.headcount || 1) === 1 ? "" : "s"}`;
  const rate =
    post.hourly_rate != null
      ? `€${post.hourly_rate}/h`
      : post.day_rate != null
        ? `€${post.day_rate}/day`
        : null;
  const schedule = [post.start_date, post.start_time].filter(Boolean).join(" ");
  return [
    WORK_TYPE_LABELS[post.work_type] || "Business work",
    post.city,
    workers,
    rate,
    schedule,
  ]
    .filter(Boolean)
    .join(" · ");
}

function Review({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.review}>
      <Text style={[styles.reviewLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.reviewValue, { color: colors.ink }]}>
        {value || "Not set"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  progressHead: { gap: 4 },
  step: { fontSize: 10.5, fontWeight: "900" },
  stepTitle: { fontSize: 24, fontWeight: "900" },
  track: { height: 5, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  fieldLabel: { fontSize: 12.5, fontWeight: "900" },
  document: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  documentCopy: { flex: 1, minWidth: 0, gap: 3 },
  documentTitle: { fontSize: 12, lineHeight: 16, fontWeight: "900" },
  documentBody: { fontSize: 10 },
  review: { gap: 3 },
  reviewLabel: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  reviewValue: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 9, paddingBottom: 24 },
  action: { flex: 1 },
  workspace: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  workspaceIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  workspaceCopy: { flex: 1, gap: 3 },
  name: { fontWeight: "900", fontSize: 17 },
  muted: { fontSize: 11.5 },
  pending: { borderRadius: 15, padding: 14, gap: 4 },
  pendingTitle: { fontSize: 13.5, fontWeight: "900" },
  pendingBody: { fontSize: 11.5, lineHeight: 17 },
});
