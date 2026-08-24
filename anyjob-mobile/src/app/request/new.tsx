import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  BadgeCheck,
  Baby,
  Camera,
  CalendarDays,
  Check,
  Clock3,
  GraduationCap,
  Hammer,
  HouseHeart,
  ImagePlus,
  Leaf,
  LocateFixed,
  MapPin,
  MonitorCog,
  PawPrint,
  ShieldCheck,
  Snowflake,
  Sparkles,
  SprayCan,
  Trash2,
  Truck,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Button, Card, Field, Header, Screen } from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { useAppContent } from "@/lib/content";
import {
  BUDGET_OPTIONS,
  CATEGORIES,
  categoryName,
  DURATION_OPTIONS,
  normalizeCategory,
  PEOPLE_OPTIONS,
  SERVICE_TYPES,
  SUBCATEGORIES,
  subcategoryName,
  URGENCY_OPTIONS,
} from "@/lib/questionnaire";
import { uploadWorkImage } from "@/lib/uploads";
import { useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";

const TOTAL_STEPS = 9;
const PENDING_REQUEST_KEY = "anyjob-pending-request-draft";
const STEP_COPY = [
  ["Choose a service", "Start with the type of help you need."],
  [
    "Specify your need",
    "Choose the closest match so providers can quote accurately.",
  ],
  ["Service and urgency", "Tell us how often and how soon you need help."],
  [
    "Describe the job",
    "Give providers enough detail to prepare a useful quote.",
  ],
  ["Choose a schedule", "Set your preferred date and time."],
  ["Add the location", "Your exact address stays private until booking."],
  ["Define the scope", "Set the expected effort, budget, and supplies."],
  ["Add work photos", "Photos are optional, but they help providers quote."],
  ["Review and submit", "Check the request before sending it for approval."],
] as const;

type Form = {
  category_slug: string;
  subcategory_slug: string;
  custom_tags: string[];
  tag_input: string;
  service_type: string;
  job_title: string;
  job_description: string;
  job_urgency: string;
  preferred_date: string;
  preferred_time_start: string;
  preferred_time_end: string;
  flexible_timing: boolean;
  address: string;
  city: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  coarse_latitude: number | null;
  coarse_longitude: number | null;
  location_accuracy_meters: number | null;
  coarse_location_label: string;
  estimated_duration_hours: number;
  number_of_people_needed: number;
  budget_range: string;
  materials_provided: boolean;
  equipment_needed: string;
  work_images: ImagePicker.ImagePickerAsset[];
};

type ChoiceProps = {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  compact?: boolean;
};

function roundCoarse(value: number) {
  return Math.round(value * 100) / 100;
}

function meaningfulLength(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").length;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const selected = new Date(`${value}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const latest = new Date(today);
  latest.setDate(latest.getDate() + 90);
  return selected >= today && selected <= latest;
}

function formatPickerValue(date: Date, mode: "date" | "time") {
  if (mode === "time") {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function pickerDate(value: string, mode: "date" | "time") {
  const now = new Date();
  if (mode === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (mode === "time" && /^\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(":").map(Number);
    now.setHours(hours, minutes, 0, 0);
  }
  return now;
}

function categoryIcon(slug: string, color: string) {
  const props = { color, size: 24, strokeWidth: 2.2 };
  switch (slug) {
    case "menage":
      return <SprayCan {...props} />;
    case "bricolage":
      return <Hammer {...props} />;
    case "jardinage":
      return <Leaf {...props} />;
    case "demenagement":
      return <Truck {...props} />;
    case "enfants":
      return <Baby {...props} />;
    case "animaux":
      return <PawPrint {...props} />;
    case "informatique":
      return <MonitorCog {...props} />;
    case "aide-domicile":
      return <HouseHeart {...props} />;
    case "cours-particuliers":
      return <GraduationCap {...props} />;
    case "hiver":
      return <Snowflake {...props} />;
    default:
      return <Sparkles {...props} />;
  }
}

function makeSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function buildReturnTo(params: {
  category?: string;
  subcategory?: string;
  custom_query?: string;
  providerId?: string;
  providerName?: string;
  serviceId?: string;
  packageTier?: string;
}) {
  const query = Object.entries(params)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
  return `/request/new${query ? `?${query}` : ""}`;
}

export default function NewRequestScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { copy } = useAppContent();
  const params = useLocalSearchParams<{
    category?: string;
    subcategory?: string;
    custom_query?: string;
    providerId?: string;
    providerName?: string;
    serviceId?: string;
    packageTier?: string;
  }>();
  const requestedCategory = normalizeCategory(params.category);
  const initialCategory =
    requestedCategory === "custom" ||
    CATEGORIES.some((category) => category.slug === requestedCategory)
      ? requestedCategory
      : "";
  const initialSubcategory =
    params.subcategory || (initialCategory === "custom" ? "custom-job" : "");
  const [step, setStep] = useState(
    initialSubcategory ? 3 : initialCategory ? 2 : 1,
  );
  const [locating, setLocating] = useState(false);
  const [pickingImages, setPickingImages] = useState(false);
  const [form, setForm] = useState<Form>({
    category_slug: initialCategory,
    subcategory_slug: initialSubcategory,
    custom_tags: params.custom_query ? [params.custom_query.trim()] : [],
    tag_input: "",
    service_type: "",
    job_title: params.custom_query?.trim() || "",
    job_description: "",
    job_urgency: "",
    preferred_date: "",
    preferred_time_start: "",
    preferred_time_end: "",
    flexible_timing: false,
    address: "",
    city: "",
    postal_code: "",
    latitude: null,
    longitude: null,
    coarse_latitude: null,
    coarse_longitude: null,
    location_accuracy_meters: null,
    coarse_location_label: "",
    estimated_duration_hours: 0,
    number_of_people_needed: 1,
    budget_range: "",
    materials_provided: false,
    equipment_needed: "",
    work_images: [],
  });

  useEffect(() => {
    AsyncStorage.getItem(PENDING_REQUEST_KEY)
      .then((value) => {
        if (!value) return;
        const draft = JSON.parse(value) as Partial<Form> & {
          step?: number;
          params?: Record<string, string>;
        };
        setForm((current) => ({
          ...current,
          ...draft,
          work_images: [],
        }));
        if (draft.step) setStep(Math.min(TOTAL_STEPS, Math.max(1, draft.step)));
      })
      .catch(() => undefined);
  }, []);

  const setText = (key: keyof Form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const selectedBudget = BUDGET_OPTIONS.find(
    (option) => option.value === form.budget_range,
  );
  const returnTo = useMemo(
    () =>
      buildReturnTo({
        category: params.category,
        subcategory: params.subcategory,
        custom_query: params.custom_query,
        providerId: params.providerId,
        providerName: params.providerName,
        serviceId: params.serviceId,
        packageTier: params.packageTier,
      }),
    [
      params.category,
      params.custom_query,
      params.packageTier,
      params.providerId,
      params.providerName,
      params.serviceId,
      params.subcategory,
    ],
  );
  const areaLabel = useMemo(
    () =>
      form.coarse_location_label ||
      [
        form.city,
        form.postal_code ? `${form.postal_code.slice(0, 3)} area` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    [form.city, form.coarse_location_label, form.postal_code],
  );

  const locateCurrentArea = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Location not enabled",
          "Enter your address, city, and Eircode manually.",
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const result = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }).catch(() => []);
      const place = result[0];
      const city = place?.city || place?.subregion || form.city;
      const postalCode = place?.postalCode || form.postal_code;
      setForm((current) => ({
        ...current,
        address:
          [place?.streetNumber, place?.street].filter(Boolean).join(" ") ||
          current.address,
        city,
        postal_code: postalCode,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        coarse_latitude: roundCoarse(position.coords.latitude),
        coarse_longitude: roundCoarse(position.coords.longitude),
        location_accuracy_meters: Math.round(position.coords.accuracy || 1000),
        coarse_location_label: [
          city,
          postalCode ? `${postalCode.slice(0, 3)} area` : "",
        ]
          .filter(Boolean)
          .join(", "),
      }));
    } catch (error) {
      Alert.alert(
        "Could not find your location",
        error instanceof Error
          ? error.message
          : "Enter the location manually instead.",
      );
    } finally {
      setLocating(false);
    }
  };

  const chooseImages = async (camera = false) => {
    setPickingImages(true);
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Camera access needed",
            "Allow camera access to take a work photo.",
          );
          return;
        }
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            selectionLimit: Math.max(1, 6 - form.work_images.length),
            quality: 0.85,
          });
      if (!result.canceled) {
        setForm((current) => ({
          ...current,
          work_images: [...current.work_images, ...result.assets].slice(0, 6),
        }));
      }
    } finally {
      setPickingImages(false);
    }
  };

  const addCustomTag = () => {
    const tag = form.tag_input.trim();
    if (!tag || form.custom_tags.includes(tag) || form.custom_tags.length >= 8)
      return;
    setForm((current) => ({
      ...current,
      custom_tags: [...current.custom_tags, tag],
      tag_input: "",
    }));
  };

  const validationMessage = () => {
    if (step === 1 && !form.category_slug) return "Choose a service category.";
    if (step === 2 && !form.subcategory_slug && form.custom_tags.length === 0)
      return "Choose a service or add at least one custom job tag.";
    if (step === 3 && (!form.service_type || !form.job_urgency))
      return "Choose both the service type and urgency.";
    if (step === 4 && meaningfulLength(form.job_title) < 3)
      return "Enter a clear job title of at least 3 characters.";
    if (step === 4 && meaningfulLength(form.job_description) < 10)
      return "Describe the work in at least 10 meaningful characters.";
    if (step === 5 && !isValidDate(form.preferred_date))
      return "Choose a valid date within the next 90 days using YYYY-MM-DD.";
    if (step === 6 && (!form.address.trim() || !form.city.trim()))
      return "Enter both the service address and city.";
    if (step === 7 && form.estimated_duration_hours === 0)
      return "Choose the estimated duration.";
    if (step === 7 && !form.budget_range) return "Choose a budget range.";
    return null;
  };

  const goNext = () => {
    const error = validationMessage();
    if (error) {
      Alert.alert("Complete this step", error);
      return;
    }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let sessionId = await AsyncStorage.getItem("inquiry_session_id");
      if (!sessionId) {
        sessionId = makeSessionId();
        await AsyncStorage.setItem("inquiry_session_id", sessionId);
      }
      const result = await api<{ inquiry: { id: string } }>(
        "/api/mobile/requests",
        {
          method: "POST",
          ...jsonBody({
            ...form,
            work_images: undefined,
            tag_input: undefined,
            session_id: sessionId,
            preferredProviderId: params.providerId || null,
            preferredServiceId: params.serviceId || null,
            preferredPackageTier: params.packageTier || null,
          }),
        },
      );
      let failedUploads = 0;
      for (const image of form.work_images) {
        try {
          await uploadWorkImage(image, result.inquiry.id);
        } catch {
          failedUploads += 1;
        }
      }
      await api("/api/kyc/buyer-pending", {
        method: "POST",
        ...jsonBody({ jobId: result.inquiry.id }),
      }).catch(() => undefined);
      await AsyncStorage.setItem("last_inquiry_id", result.inquiry.id);
      return { ...result, failedUploads };
    },
    onSuccess: (result) => {
      void client.invalidateQueries({ queryKey: ["requests"] });
      void AsyncStorage.removeItem(PENDING_REQUEST_KEY);
      router.replace(`/requests/${result.inquiry.id}`);
      Alert.alert(
        "Request submitted",
        result.failedUploads
          ? "Your request was submitted, but one or more photos could not be uploaded."
          : "AnyJob will review it before providers can quote.",
      );
    },
    onError: (error: Error) => Alert.alert("Could not submit", error.message),
  });

  const submit = () => {
    if (!user) {
      void AsyncStorage.setItem(
        PENDING_REQUEST_KEY,
        JSON.stringify({
          ...form,
          work_images: [],
          step,
          params: {
            category: params.category || "",
            subcategory: params.subcategory || "",
            custom_query: params.custom_query || "",
            providerId: params.providerId || "",
            providerName: params.providerName || "",
            serviceId: params.serviceId || "",
            packageTier: params.packageTier || "",
          },
        }),
      );
      Alert.alert("Create your account", "Your request is saved. Sign in or create a buyer account to submit it.");
      router.push({
        pathname: "/(auth)/register",
        params: { redirectTo: returnTo },
      });
      return;
    }
    mutation.mutate();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.grid}>
            {CATEGORIES.map((category) => (
              <Choice
                key={category.slug}
                compact
                title={category.name}
                icon={categoryIcon(category.slug, category.color)}
                selected={form.category_slug === category.slug}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    category_slug: category.slug,
                    subcategory_slug: "",
                    custom_tags: [],
                  }))
                }
              />
            ))}
            <View style={styles.fullWidth}>
              <Choice
                title="Create custom job"
                description="Use this when your task does not match a listed service."
                icon={<Sparkles color={colors.brand} size={24} />}
                selected={form.category_slug === "custom"}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    category_slug: "custom",
                    subcategory_slug: "custom-job",
                  }))
                }
              />
            </View>
          </View>
        );
      case 2:
        if (form.category_slug === "custom") {
          return (
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                Tag your custom job
              </Text>
              <Text style={[styles.helper, { color: colors.muted }]}>
                Add up to 8 short tags that describe the work.
              </Text>
              <View style={styles.tagInputRow}>
                <View style={styles.tagField}>
                  <Field
                    label="Custom job tag"
                    value={form.tag_input}
                    onChangeText={setText("tag_input")}
                    onSubmitEditing={addCustomTag}
                  />
                </View>
                <Button
                  title="Add"
                  variant="secondary"
                  onPress={addCustomTag}
                />
              </View>
              <View style={styles.tags}>
                {form.custom_tags.map((tag) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${tag}`}
                    key={tag}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        custom_tags: current.custom_tags.filter(
                          (item) => item !== tag,
                        ),
                      }))
                    }
                    style={[styles.tag, { backgroundColor: colors.soft }]}
                  >
                    <Text style={[styles.tagText, { color: colors.ink }]}>
                      {tag}
                    </Text>
                    <X color={colors.muted} size={14} />
                  </Pressable>
                ))}
              </View>
            </Card>
          );
        }
        return (
          <View style={styles.choiceList}>
            {(SUBCATEGORIES[form.category_slug] || []).map((subcategory) => (
              <Choice
                key={subcategory.slug}
                title={subcategory.name}
                selected={form.subcategory_slug === subcategory.slug}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    subcategory_slug: subcategory.slug,
                  }))
                }
              />
            ))}
            <Choice
              title="Other"
              description="Describe another service in this category."
              selected={form.subcategory_slug === `other-${form.category_slug}`}
              onPress={() =>
                setForm((current) => ({
                  ...current,
                  subcategory_slug: `other-${form.category_slug}`,
                }))
              }
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.sectionStack}>
            <OptionSection title={copy("request.service_type.title", "Service type")}>
              {SERVICE_TYPES.map((option) => (
                <Choice
                  key={option.value}
                  title={copy(`request.service_type.${option.value}.label`, option.label)}
                  description={copy(`request.service_type.${option.value}.description`, option.description)}
                  selected={form.service_type === option.value}
                  onPress={() =>
                    setForm((current) => ({
                      ...current,
                      service_type: option.value,
                    }))
                  }
                />
              ))}
            </OptionSection>
            <OptionSection title={copy("request.urgency.title", "How soon do you need it?")}>
              <View style={styles.grid}>
                {URGENCY_OPTIONS.map((option) => (
                  <Choice
                    key={option.value}
                    compact
                    title={copy(`request.urgency.${option.value}.label`, option.label)}
                    selected={form.job_urgency === option.value}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        job_urgency: option.value,
                      }))
                    }
                  />
                ))}
              </View>
            </OptionSection>
          </View>
        );
      case 4:
        return (
          <Card>
            <Field
              label="Job title"
              placeholder="e.g. Assemble two wardrobes"
              value={form.job_title}
              onChangeText={setText("job_title")}
              maxLength={120}
            />
            <Field
              label="Job description"
              placeholder="Explain the work, access, condition, and expected result"
              value={form.job_description}
              onChangeText={setText("job_description")}
              multiline
              maxLength={3000}
            />
            <Text style={[styles.counter, { color: colors.subtle }]}>
              {form.job_description.length}/3000
            </Text>
          </Card>
        );
      case 5:
        return (
          <Card>
            <SchedulePickerField
              label={copy("request.schedule.date_label", "Preferred date")}
              placeholder="Choose a date"
              value={form.preferred_date}
              mode="date"
              onChange={setText("preferred_date")}
            />
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <SchedulePickerField
                  label={copy("request.schedule.start_label", "Start time")}
                  placeholder="Choose time"
                  value={form.preferred_time_start}
                  mode="time"
                  onChange={setText("preferred_time_start")}
                />
              </View>
              <View style={styles.column}>
                <SchedulePickerField
                  label={copy("request.schedule.end_label", "End time")}
                  placeholder="Choose time"
                  value={form.preferred_time_end}
                  mode="time"
                  onChange={setText("preferred_time_end")}
                />
              </View>
            </View>
            <ToggleRow
              title={copy("request.schedule.flexible_title", "My timing is flexible")}
              subtitle={copy("request.schedule.flexible_body", "Providers can suggest a nearby time.")}
              value={form.flexible_timing}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, flexible_timing: value }))
              }
            />
          </Card>
        );
      case 6:
        return (
          <View style={styles.sectionStack}>
            <Card>
              <View style={styles.locationIntro}>
                <View
                  style={[
                    styles.iconTile,
                    { backgroundColor: colors.infoSoft },
                  ]}
                >
                  <MapPin color={colors.info} size={22} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                    Service location
                  </Text>
                  <Text style={[styles.helper, { color: colors.muted }]}>
                    Sellers see only the coarse area before booking.
                  </Text>
                </View>
              </View>
              <Button
                title={
                  locating ? "Finding location..." : "Use current location"
                }
                variant="secondary"
                loading={locating}
                icon={<LocateFixed color={colors.ink} size={18} />}
                onPress={() => void locateCurrentArea()}
              />
              <Field
                label="Full address"
                value={form.address}
                onChangeText={setText("address")}
              />
              <Field
                label="City or town"
                value={form.city}
                onChangeText={setText("city")}
              />
              <Field
                label="Eircode / postal code"
                value={form.postal_code}
                onChangeText={setText("postal_code")}
              />
            </Card>
            {areaLabel ? (
              <View
                style={[
                  styles.privacyNotice,
                  { backgroundColor: colors.successSoft },
                ]}
              >
                <ShieldCheck color={colors.success} size={19} />
                <Text style={[styles.privacyText, { color: colors.success }]}>
                  Seller view before booking: {areaLabel}
                </Text>
              </View>
            ) : null}
          </View>
        );
      case 7:
        return (
          <View style={styles.sectionStack}>
            <OptionSection title="Estimated duration">
              <View style={styles.grid}>
                {DURATION_OPTIONS.map((option) => (
                  <Choice
                    key={option.value}
                    compact
                    title={option.label}
                    selected={form.estimated_duration_hours === option.value}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        estimated_duration_hours: option.value,
                      }))
                    }
                  />
                ))}
              </View>
            </OptionSection>
            <OptionSection title="People needed">
              <View style={styles.grid}>
                {PEOPLE_OPTIONS.map((option) => (
                  <Choice
                    key={option.value}
                    compact
                    title={option.label}
                    selected={form.number_of_people_needed === option.value}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        number_of_people_needed: option.value,
                      }))
                    }
                  />
                ))}
              </View>
            </OptionSection>
            <OptionSection title="Budget range">
              <View style={styles.grid}>
                {BUDGET_OPTIONS.map((option) => (
                  <Choice
                    key={option.value}
                    compact
                    title={option.label}
                    selected={form.budget_range === option.value}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        budget_range: option.value,
                      }))
                    }
                  />
                ))}
              </View>
            </OptionSection>
            <Card>
              <ToggleRow
                title="I will provide materials"
                subtitle="Turn this on when materials are already available."
                value={form.materials_provided}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    materials_provided: value,
                  }))
                }
              />
              <Field
                label="Equipment needed"
                placeholder="Optional tools or equipment"
                value={form.equipment_needed}
                onChangeText={setText("equipment_needed")}
              />
            </Card>
          </View>
        );
      case 8:
        return (
          <Card>
            <View style={styles.locationIntro}>
              <View style={[styles.iconTile, { backgroundColor: colors.soft }]}>
                <ImagePlus color={colors.brand} size={22} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                  Work images
                </Text>
                <Text style={[styles.helper, { color: colors.muted }]}>
                  Up to 6 JPG, PNG, WebP, or GIF images.
                </Text>
              </View>
            </View>
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Button
                  title="Choose photos"
                  variant="secondary"
                  loading={pickingImages}
                  icon={<ImagePlus color={colors.ink} size={18} />}
                  onPress={() => void chooseImages(false)}
                />
              </View>
              <View style={styles.column}>
                <Button
                  title="Take photo"
                  variant="secondary"
                  loading={pickingImages}
                  icon={<Camera color={colors.ink} size={18} />}
                  onPress={() => void chooseImages(true)}
                />
              </View>
            </View>
            {form.work_images.length ? (
              <View style={styles.imageGrid}>
                {form.work_images.map((asset, index) => (
                  <View key={`${asset.uri}-${index}`} style={styles.imageWrap}>
                    <Image
                      alt={`Selected work photo ${index + 1}`}
                      source={{ uri: asset.uri }}
                      style={styles.image}
                      contentFit="cover"
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove photo ${index + 1}`}
                      onPress={() =>
                        setForm((current) => ({
                          ...current,
                          work_images: current.work_images.filter(
                            (_, imageIndex) => imageIndex !== index,
                          ),
                        }))
                      }
                      style={[
                        styles.removeImage,
                        { backgroundColor: colors.elevated },
                      ]}
                    >
                      <Trash2 color={colors.danger} size={16} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyImages, { borderColor: colors.line }]}>
                <ImagePlus color={colors.subtle} size={30} />
                <Text style={[styles.helper, { color: colors.muted }]}>
                  No photos selected
                </Text>
              </View>
            )}
          </Card>
        );
      case 9:
        return (
          <View style={styles.sectionStack}>
            {params.providerName ? (
              <View
                style={[
                  styles.selectedProvider,
                  { backgroundColor: colors.successSoft },
                ]}
              >
                <BadgeCheck color={colors.success} size={21} />
                <View style={styles.flex}>
                  <Text
                    style={[styles.selectedLabel, { color: colors.success }]}
                  >
                    SELECTED PROVIDER
                  </Text>
                  <Text style={[styles.selectedName, { color: colors.ink }]}>
                    {params.providerName}
                  </Text>
                </View>
              </View>
            ) : null}
            <Card>
              <ReviewRow
                label="Service"
                value={`${categoryName(form.category_slug)} · ${subcategoryName(form.category_slug, form.subcategory_slug)}`}
              />
              <ReviewRow label="Job" value={form.job_title} />
              <ReviewRow
                label="Schedule"
                value={`${form.preferred_date}${form.preferred_time_start ? ` · ${form.preferred_time_start}` : ""}`}
              />
              <ReviewRow
                label="Location"
                value={[form.city, form.postal_code].filter(Boolean).join(", ")}
              />
              <ReviewRow
                label="Scope"
                value={`${DURATION_OPTIONS.find((option) => option.value === form.estimated_duration_hours)?.label} · ${PEOPLE_OPTIONS.find((option) => option.value === form.number_of_people_needed)?.label}`}
              />
              <ReviewRow label="Budget" value={selectedBudget?.label || ""} />
              <ReviewRow
                label="Work photos"
                value={`${form.work_images.length} attached`}
              />
            </Card>
            <View
              style={[
                styles.accountNotice,
                { backgroundColor: colors.infoSoft },
              ]}
            >
              <BadgeCheck color={colors.info} size={20} />
              <View style={styles.flex}>
                <Text style={[styles.accountTitle, { color: colors.ink }]}>
                  {user
                    ? `Submitting as ${user.displayName || "your account"}`
                    : "Create an account to submit"}
                </Text>
                <Text style={[styles.helper, { color: colors.muted }]}>
                  {user?.email ||
                    "Your draft is saved while you sign in or create a buyer account."}
                </Text>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Screen>
      <Header title="Post a task" />
      <View style={styles.progressHeader}>
        <Text style={[styles.stepLabel, { color: colors.brand }]}>
          STEP {step} OF {TOTAL_STEPS}
        </Text>
        <Text style={[styles.progressCount, { color: colors.muted }]}>
          {Math.round((step / TOTAL_STEPS) * 100)}%
        </Text>
      </View>
      <View
        style={[styles.progressTrack, { backgroundColor: colors.softStrong }]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.brand,
              width: `${(step / TOTAL_STEPS) * 100}%`,
            },
          ]}
        />
      </View>
      <View style={styles.stepIntro}>
        <Text style={[styles.stepTitle, { color: colors.ink }]}>
          {copy(`request.step.${step}.title`, STEP_COPY[step - 1][0])}
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
          {copy(`request.step.${step}.subtitle`, STEP_COPY[step - 1][1])}
        </Text>
      </View>
      {params.providerName && step !== 9 ? (
        <View
          style={[
            styles.selectedProvider,
            { backgroundColor: colors.successSoft },
          ]}
        >
          <BadgeCheck color={colors.success} size={21} />
          <View style={styles.flex}>
            <Text style={[styles.selectedLabel, { color: colors.success }]}>
              SELECTED PROVIDER
            </Text>
            <Text style={[styles.selectedName, { color: colors.ink }]}>
              {params.providerName}
            </Text>
          </View>
        </View>
      ) : null}
      {renderStep()}
      <View style={styles.actions}>
        {step > 1 ? (
          <View style={styles.actionColumn}>
            <Button
              title={copy("request.action.back", "Back")}
              variant="secondary"
              onPress={() => setStep((current) => Math.max(1, current - 1))}
            />
          </View>
        ) : null}
        <View style={styles.actionColumn}>
          <Button
            title={
              step === TOTAL_STEPS && !user
                ? "Create account to submit"
                : step === TOTAL_STEPS
                  ? copy("request.action.submit", "Submit for approval")
                  : copy("request.action.continue", "Continue")
            }
            loading={mutation.isPending}
            icon={
              step === TOTAL_STEPS ? (
                <Check color="white" size={19} />
              ) : undefined
            }
            onPress={step === TOTAL_STEPS ? submit : goNext}
          />
        </View>
      </View>
    </Screen>
  );
}

function SchedulePickerField({
  label,
  placeholder,
  value,
  mode,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  mode: "date" | "time";
  onChange: (value: string) => void;
}) {
  const { colors, isDark } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(() => pickerDate(value, mode));
  const Icon = mode === "date" ? CalendarDays : Clock3;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const latest = new Date(today);
  latest.setDate(latest.getDate() + 90);

  const open = () => {
    setDraft(pickerDate(value, mode));
    setVisible(true);
  };

  const picker = (
    <DateTimePicker
      value={draft}
      mode={mode}
      display={Platform.OS === "ios" ? (mode === "date" ? "inline" : "spinner") : "default"}
      minimumDate={mode === "date" ? today : undefined}
      maximumDate={mode === "date" ? latest : undefined}
      minuteInterval={5}
      is24Hour
      themeVariant={isDark ? "dark" : "light"}
      accentColor={colors.brand}
      onChange={(event, selected) => {
        if (Platform.OS === "android") {
          setVisible(false);
          if (event.type === "set" && selected) {
            onChange(formatPickerValue(selected, mode));
          }
          return;
        }
        if (selected) setDraft(selected);
      }}
    />
  );

  return (
    <View style={styles.scheduleField}>
      <Text style={[styles.scheduleLabel, { color: colors.ink }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        onPress={open}
        style={({ pressed }) => [
          styles.scheduleControl,
          { backgroundColor: colors.soft, borderColor: colors.line },
          pressed && styles.pressed,
        ]}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          style={[
            styles.scheduleValue,
            { color: value ? colors.ink : colors.subtle },
          ]}
        >
          {value || placeholder}
        </Text>
        <Icon color={colors.brand} size={19} />
      </Pressable>
      {Platform.OS === "android" && visible ? picker : null}
      {Platform.OS === "ios" ? (
        <Modal
          animationType="fade"
          transparent
          visible={visible}
          onRequestClose={() => setVisible(false)}
        >
          <View style={styles.pickerModal}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close picker"
              onPress={() => setVisible(false)}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.pickerSheet,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <View style={styles.pickerHeader}>
                <Pressable onPress={() => setVisible(false)}>
                  <Text style={[styles.pickerAction, { color: colors.muted }]}>Cancel</Text>
                </Pressable>
                <Text style={[styles.pickerTitle, { color: colors.ink }]}>{label}</Text>
                <Pressable
                  onPress={() => {
                    onChange(formatPickerValue(draft, mode));
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.pickerAction, { color: colors.brand }]}>Done</Text>
                </Pressable>
              </View>
              {picker}
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

function Choice({
  title,
  description,
  selected,
  onPress,
  icon,
  compact,
}: ChoiceProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        compact && styles.choiceCompact,
        {
          backgroundColor: selected ? colors.infoSoft : colors.surface,
          borderColor: selected ? colors.brand : colors.line,
        },
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <View style={[styles.choiceIcon, { backgroundColor: colors.soft }]}>
          {icon}
        </View>
      ) : null}
      <View style={[styles.choiceCopy, compact && styles.choiceCopyCompact]}>
        <Text
          numberOfLines={compact ? 3 : undefined}
          adjustsFontSizeToFit={compact}
          minimumFontScale={0.72}
          style={[styles.choiceTitle, { color: colors.ink }]}
        >
          {title}
        </Text>
        {description ? (
          <Text style={[styles.choiceDescription, { color: colors.muted }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.choiceCheck,
          {
            borderColor: selected ? colors.brand : colors.line,
            backgroundColor: selected ? colors.brand : colors.surface,
          },
        ]}
      >
        {selected ? <Check color="white" size={14} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

function OptionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.optionSection}>
      <Text style={[styles.optionTitle, { color: colors.ink }]}>{title}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.flex}>
        <Text style={[styles.toggleTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.helper, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.softStrong, true: colors.brand }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.reviewRow, { borderBottomColor: colors.line }]}>
      <Text style={[styles.reviewLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.reviewValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.76 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepLabel: { fontSize: 11, fontWeight: "900" },
  progressCount: { fontSize: 12, fontWeight: "800" },
  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  stepIntro: { gap: 5, marginBottom: 4 },
  stepTitle: { fontSize: 26, fontWeight: "900" },
  stepSubtitle: { fontSize: 14, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  fullWidth: { width: "100%" },
  choiceList: { gap: 10 },
  choice: {
    minHeight: 72,
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  choiceCompact: {
    width: "48.4%",
    minHeight: 100,
    alignItems: "flex-start",
    flexDirection: "column",
    paddingRight: 42,
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceCopy: { flex: 1, minWidth: 0, gap: 3 },
  choiceCopyCompact: { width: "100%", paddingTop: 1 },
  choiceTitle: { fontSize: 14, fontWeight: "900", lineHeight: 18 },
  choiceDescription: { fontSize: 12, lineHeight: 17 },
  choiceCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 11,
    top: 11,
  },
  sectionStack: { gap: 18 },
  optionSection: { gap: 10 },
  optionTitle: { fontSize: 17, fontWeight: "900" },
  sectionTitle: { fontSize: 18, fontWeight: "900" },
  helper: { fontSize: 13, lineHeight: 18 },
  counter: {
    alignSelf: "flex-end",
    fontSize: 11,
    fontWeight: "700",
    marginTop: -8,
  },
  scheduleField: { gap: 7 },
  scheduleLabel: { fontSize: 14, fontWeight: "800" },
  scheduleControl: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleValue: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: "700" },
  pickerModal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  pickerSheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 28,
  },
  pickerHeader: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pickerTitle: { flex: 1, textAlign: "center", fontSize: 15, fontWeight: "900" },
  pickerAction: { minWidth: 52, fontSize: 14, fontWeight: "900" },
  twoColumns: { flexDirection: "row", gap: 10 },
  column: { flex: 1, minWidth: 0 },
  toggleRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleTitle: { fontSize: 14, fontWeight: "900", marginBottom: 2 },
  locationIntro: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  privacyNotice: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  privacyText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: "800" },
  tagInputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  tagField: { flex: 1, minWidth: 0 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tagText: { fontSize: 12, fontWeight: "800" },
  emptyImages: {
    height: 150,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  imageWrap: { width: "47.8%", aspectRatio: 1.25, position: "relative" },
  image: { width: "100%", height: "100%", borderRadius: 12 },
  removeImage: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedProvider: {
    minHeight: 58,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectedLabel: { fontSize: 9.5, fontWeight: "900" },
  selectedName: { fontSize: 14, fontWeight: "900", marginTop: 2 },
  reviewRow: {
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  reviewLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  reviewValue: { fontSize: 14, lineHeight: 19, fontWeight: "800" },
  accountNotice: {
    minHeight: 64,
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accountTitle: { fontSize: 14, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 10, paddingTop: 4, paddingBottom: 24 },
  actionColumn: { flex: 1, minWidth: 0 },
});
