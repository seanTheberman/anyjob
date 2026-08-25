import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Clock3,
  Heart,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Star,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Avatar,
  Button,
  ErrorState,
  Field,
  Header,
  LoadingState,
  Pill,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { api, ApiError, jsonBody } from "@/lib/api";
import { serviceCover } from "@/lib/service-assets";
import { useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";

type GigPackage = {
  tier?: string;
  title?: string;
  description?: string;
  price?: number;
  deliveryDays?: number;
  revisions?: number;
};
type GigFaq = { question?: string; answer?: string };
type GigDetails = {
  category?: string;
  packages?: GigPackage[];
  faqs?: GigFaq[];
  mediaUrls?: string[];
  mediaFiles?: Array<{ image_url?: string }>;
  requirementQuestions?: string[];
};
type Gig = {
  id: string;
  title?: string;
  description?: string;
  hourly_rate?: number;
  min_hours?: number;
  max_radius_km?: number;
  tags?: string[];
  gig_details?: GigDetails | null;
};
type WrittenReview = {
  id: string;
  reviewerName: string;
  reviewerInitials: string;
  rating: number;
  comment: string;
  createdAt: string;
};
type RelatedProvider = {
  id: string;
  name: string;
  category: string;
  heroImage?: string | null;
  image?: string | null;
  rating?: number;
  reviewCount?: number;
  rate?: number;
};
type ProviderProfile = {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  category?: string;
  categorySlug?: string;
  service_category?: string;
  heroImage?: string | null;
  profile_image_url?: string | null;
  avatar?: string | null;
  rating?: number;
  average_rating?: number;
  reviewCount?: number;
  review_count?: number;
  total_reviews?: number;
  completedJobs?: number;
  total_jobs?: number;
  level?: string;
  badges?: string[];
  rate?: number;
  hourly_rate?: number;
  location?: string;
  city?: string;
  country?: string;
  experience?: string;
  biography?: string;
  description?: string;
  services?: string[];
  responseTime?: string;
  availability?: string;
  contactWindows?: string[];
  unavailable?: boolean;
  unavailableUntil?: string | null;
  unavailableNote?: string;
  photos?: string[];
  highlights?: string[];
  reviewDistribution?: Record<number, number>;
  writtenReviews?: WrittenReview[];
  relatedProviders?: RelatedProvider[];
  status?: string;
  is_verified?: boolean;
  serviceAreas?: Array<{ label?: string; radiusKm?: number }>;
  worksInViewerArea?: boolean;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function objectValue(value: unknown): UnknownRecord {
  if (isRecord(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function textValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => textValue(item))
      .filter(Boolean)
      .join(", ");
  }
  if (isRecord(value)) {
    for (const key of [
      "label",
      "name",
      "title",
      "value",
      "text",
      "category",
      "description",
      "displayName",
      "image_url",
      "url",
      "uri",
    ]) {
      const text = textValue(value[key]);
      if (text) return text;
    }
  }
  return fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  const number =
    typeof value === "number" ? value : Number(textValue(value, ""));
  return Number.isFinite(number) ? number : fallback;
}

function textArray(value: unknown): string[] {
  return (Array.isArray(value) ? value : [])
    .map((item) => textValue(item))
    .filter(Boolean);
}

function imageUrl(value: unknown): string {
  if (typeof value === "string") return value;
  if (isRecord(value)) {
    return textValue(value.image_url || value.url || value.uri);
  }
  return "";
}

function packageValue(value: unknown): GigPackage {
  const record = objectValue(value);
  return {
    tier: textValue(record.tier),
    title: textValue(record.title),
    description: textValue(record.description),
    price: numberValue(record.price),
    deliveryDays: numberValue(record.deliveryDays || record.delivery_days),
    revisions: numberValue(record.revisions),
  };
}

function faqValue(value: unknown): GigFaq {
  const record = objectValue(value);
  return {
    question: textValue(record.question),
    answer: textValue(record.answer),
  };
}

const defaultFaqs: GigFaq[] = [
  {
    question: "How do I book this provider?",
    answer:
      "Choose a package, continue to the request form, and share the exact job details before confirming.",
  },
  {
    question: "Can I confirm the scope first?",
    answer:
      "Yes. Your request reaches the provider with the job details so the scope is clear before work begins.",
  },
  {
    question: "Are reviews verified?",
    answer:
      "Public reviews come from completed AnyJob bookings tied to real requests.",
  },
];

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "P"
  );
}

export default function PublicProviderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const providerId = textValue(id);
  const router = useRouter();
  const { colors } = useAppTheme();
  const { session } = useAuth();
  const [saved, setSaved] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showDirectHire, setShowDirectHire] = useState(false);
  const [hiring, setHiring] = useState(false);
  const [hireError, setHireError] = useState("");
  const [hireForm, setHireForm] = useState({
    preferredDate: "",
    preferredTime: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });
  const query = useQuery({
    queryKey: ["public-profile", providerId],
    queryFn: () => api<any>(`/api/profile/${providerId}?role=provider`),
    staleTime: 300_000,
  });

  useEffect(() => {
    AsyncStorage.getItem("anyjob-saved-providers").then((value) =>
      setSaved((JSON.parse(value || "[]") as string[]).includes(id)),
    );
  }, [id]);

  const toggle = async () => {
    const values = JSON.parse(
      (await AsyncStorage.getItem("anyjob-saved-providers")) || "[]",
    ) as string[];
    const next = saved
      ? values.filter((value) => value !== providerId)
      : Array.from(new Set([...values, providerId]));
    await AsyncStorage.setItem("anyjob-saved-providers", JSON.stringify(next));
    setSaved(!saved);
    Alert.alert(saved ? "Removed from saved" : "Provider saved");
  };

  const data = query.data;
  const profile = (data?.provider ||
    data?.profile ||
    data ||
    {}) as ProviderProfile & UnknownRecord;
  const gigs = (Array.isArray(data?.gigs)
    ? data.gigs
    : Array.isArray(data?.services)
      ? data.services
      : []) as Gig[];
  const gig = gigs[0];
  const details = objectValue(gig?.gig_details) as GigDetails & UnknownRecord;
  const name =
    textValue(profile.name) ||
    [textValue(profile.first_name), textValue(profile.last_name)]
      .filter(Boolean)
      .join(" ") ||
    "AnyJob provider";
  const category =
    textValue(details.category) ||
    textValue(profile.category) ||
    textValue(profile.service_category) ||
    "Service provider";
  const categorySlug =
    textValue(profile.categorySlug) ||
    category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const baseRate = numberValue(
    gig?.hourly_rate || profile.rate || profile.hourly_rate,
  );
  const authoredPackages =
    (Array.isArray(details.packages) ? details.packages : [])
      .map(packageValue)
      .filter((item) => item.title || item.price) || [];
  const packages: GigPackage[] = authoredPackages;
  const activePackage =
    packages[Math.min(selectedPackage, packages.length - 1)] || packages[0];
  const media = [
    ...(Array.isArray(details.mediaFiles) ? details.mediaFiles : []).map(
      imageUrl,
    ),
    ...textArray(details.mediaUrls),
    ...textArray(profile.photos),
  ].filter(
    (value, index, values): value is string =>
      Boolean(value) && values.indexOf(value) === index,
  );
  const hero =
    media[0] ||
    imageUrl(profile.heroImage) ||
    imageUrl(profile.profile_image_url) ||
    imageUrl(profile.avatar) ||
    null;
  const rating = numberValue(profile.rating || profile.average_rating);
  const reviewCount = numberValue(
    profile.reviewCount || profile.review_count || profile.total_reviews,
  );
  const completedJobs = numberValue(
    profile.completedJobs || profile.total_jobs,
  );
  const location =
    textValue(profile.location) ||
    [textValue(profile.city), textValue(profile.country)]
      .filter(Boolean)
      .join(", ") ||
    "Location not provided";
  const contactWindows = textArray(profile.contactWindows);
  const serviceAreas = (Array.isArray(profile.serviceAreas) ? profile.serviceAreas : [])
    .map((area) => ({ label: textValue(area.label), radiusKm: numberValue(area.radiusKm) }))
    .filter((area) => area.label);
  const reviews = (Array.isArray(profile.writtenReviews)
    ? profile.writtenReviews
    : []
  ).map((review) => {
    const row = objectValue(review);
    return {
      id: textValue(row.id, `${textValue(row.reviewerName)}-${row.createdAt}`),
      reviewerName: textValue(row.reviewerName, "AnyJob client"),
      reviewerInitials: textValue(row.reviewerInitials),
      rating: numberValue(row.rating),
      comment: textValue(row.comment),
      createdAt: textValue(row.createdAt),
    };
  });
  const distributionSource = objectValue(profile.reviewDistribution);
  const distribution = Object.fromEntries(
    Object.entries(distributionSource).map(([key, value]) => [
      Number(key),
      numberValue(value),
    ]),
  ) as Record<number, number>;
  const maxDistribution = Math.max(...Object.values(distribution), 0);
  const tags = [
    ...textArray(gig?.tags),
    ...textArray(profile.services),
    ...textArray(profile.highlights),
    ...textArray(profile.badges),
  ].filter((value, index, values) => value && values.indexOf(value) === index);
  const faqs =
    (Array.isArray(details.faqs) ? details.faqs : [])
      .map(faqValue)
      .filter((item) => item.question && item.answer) || defaultFaqs;
  const visibleFaqs = faqs.length ? faqs : defaultFaqs;
  const requirements = textArray(details.requirementQuestions);
  const relatedProviders = (Array.isArray(profile.relatedProviders)
    ? profile.relatedProviders
    : []
  ).map((provider) => {
    const row = objectValue(provider);
    return {
      id: textValue(row.id),
      name: textValue(row.name, "AnyJob provider"),
      category: textValue(row.category, "Service provider"),
      heroImage: imageUrl(row.heroImage),
      image: imageUrl(row.image),
      rating: numberValue(row.rating),
      reviewCount: numberValue(row.reviewCount),
      rate: numberValue(row.rate),
    };
  });

  const continueBooking = () =>
    router.push({
      pathname: "/request/new",
      params: {
        category: categorySlug,
        providerId,
        providerName: name,
        serviceId: textValue(gig?.id),
        packageTier: activePackage?.tier || String(selectedPackage),
        requestKey: String(Date.now()),
      },
    });

  const openDirectHire = () => {
    if (!session) {
      router.push({
        pathname: "/(auth)/sign-in",
        params: { redirectTo: `/provider/${providerId}` },
      });
      return;
    }
    setHireError("");
    setShowDirectHire(true);
  };

  const setHireField = (key: keyof typeof hireForm) => (value: string) => {
    setHireForm((current) => ({ ...current, [key]: value }));
    setHireError("");
  };

  const hirePackage = async () => {
    if (!gig?.id || !activePackage?.tier) {
      setHireError("This package is no longer available.");
      return;
    }
    if (!hireForm.preferredDate || !/^\d{4}-\d{2}-\d{2}$/.test(hireForm.preferredDate)) {
      setHireError("Enter the booking date as YYYY-MM-DD.");
      return;
    }
    if (!hireForm.preferredTime || !/^\d{2}:\d{2}$/.test(hireForm.preferredTime)) {
      setHireError("Enter the preferred time as HH:MM.");
      return;
    }
    if (!hireForm.address.trim() || !hireForm.city.trim()) {
      setHireError("Enter the service address and city.");
      return;
    }

    let inquiryId = "";
    try {
      setHiring(true);
      setHireError("");
      const direct = await api<any>("/api/direct-hire", {
        method: "POST",
        ...jsonBody({
          providerId,
          serviceId: gig.id,
          packageTier: activePackage.tier,
          ...hireForm,
        }),
      });
      inquiryId = textValue(direct.inquiry?.id);
      const checkout = await api<any>("/api/payments/bid-checkout", {
        method: "POST",
        ...jsonBody({ bid_id: direct.bid?.id }),
      });

      setShowDirectHire(false);
      if (checkout.checkoutUrl && !checkout.dummyPayment) {
        await WebBrowser.openBrowserAsync(checkout.checkoutUrl);
      }
      if (inquiryId) router.push(`/requests/${inquiryId}`);
      Alert.alert(
        checkout.dummyPayment ? "Provider hired" : "Payment started",
        checkout.dummyPayment
          ? "Your package booking is confirmed and messaging is unlocked."
          : "Return to AnyJob after payment to see the confirmed booking.",
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setShowDirectHire(false);
        router.push({
          pathname: "/(auth)/sign-in",
          params: { redirectTo: `/provider/${providerId}` },
        });
        return;
      }
      const message = error instanceof Error ? error.message : "Could not hire this package.";
      if (inquiryId) {
        setShowDirectHire(false);
        router.push(`/requests/${inquiryId}`);
        Alert.alert("Booking created; payment pending", message);
      } else {
        setHireError(message);
      }
    } finally {
      setHiring(false);
    }
  };

  if (query.isLoading)
    return (
      <Screen>
        <LoadingState label="Loading full provider gig…" />
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
      <Header
        title="Provider gig"
        subtitle={category}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              saved ? "Remove provider from saved" : "Save provider"
            }
            onPress={() => void toggle()}
            style={[styles.saveIcon, { backgroundColor: colors.soft }]}
          >
            <Heart
              color={saved ? colors.brand : colors.ink}
              fill={saved ? colors.brand : "transparent"}
              size={20}
            />
          </Pressable>
        }
      />

      <View style={[styles.heroMedia, { backgroundColor: colors.soft }]}>
        <Image
          source={hero ? { uri: hero } : serviceCover(categorySlug)}
          alt={`${name} ${category} gig`}
          contentFit="cover"
          style={styles.heroImage}
        />
        <View style={[styles.popular, { backgroundColor: colors.surface }]}>
          <BadgeCheck color={colors.success} size={15} />
          <Text style={[styles.popularText, { color: colors.success }]}>
            Verified provider
          </Text>
        </View>
      </View>
      {media.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gallery}
        >
          {media.slice(1, 6).map((photo, index) => (
            <Image
              key={`${photo}-${index}`}
              source={{ uri: photo }}
              alt={`${name} work sample ${index + 1}`}
              contentFit="cover"
              style={[styles.galleryImage, { backgroundColor: colors.soft }]}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.gigHeading}>
        <Text style={[styles.gigTitle, { color: colors.ink }]}>
          {textValue(gig?.title) || `${category} services by ${name}`}
        </Text>
        <View style={styles.sellerLine}>
          <Avatar
            name={name}
            uri={imageUrl(profile.avatar) || imageUrl(profile.profile_image_url)}
            size={34}
          />
          <Text
            numberOfLines={1}
            style={[styles.sellerName, { color: colors.ink }]}
          >
            {name}
          </Text>
          {textValue(profile.level) ? (
            <Pill text={textValue(profile.level)} tone="success" />
          ) : null}
          {reviewCount ? (
            <View style={styles.rating}>
              <Star color="#f4b400" fill="#f4b400" size={15} />
              <Text style={[styles.ratingText, { color: colors.ink }]}>
                {rating.toFixed(1)} ({reviewCount})
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {activePackage ? <View
        style={[
          styles.packageCard,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <View style={[styles.packageTabs, { borderBottomColor: colors.line }]}>
          {packages.slice(0, 3).map((item, index) => {
            const active = selectedPackage === index;
            return (
              <Pressable
                key={`${item.tier}-${index}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedPackage(index)}
                style={[
                  styles.packageTab,
                  active && { borderBottomColor: colors.brand },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.packageTabText,
                    { color: active ? colors.brand : colors.muted },
                  ]}
                >
                  {item.title || item.tier || `Option ${index + 1}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.packageBody}>
          <View style={styles.packageTitleLine}>
            <View style={styles.packageCopy}>
              <Text style={[styles.packageName, { color: colors.ink }]}>
                {activePackage?.title || "Service package"}
              </Text>
              <Text
                style={[styles.packageDescription, { color: colors.muted }]}
              >
                {activePackage?.description ||
                  textValue(gig?.description) ||
                  "Share the job details so the provider can confirm the scope."}
              </Text>
            </View>
            <Text style={[styles.packagePrice, { color: colors.ink }]}>
              {Number(activePackage?.price || baseRate) > 0
                ? `€${Number(activePackage?.price || baseRate).toFixed(0)}`
                : "Quote"}
            </Text>
          </View>
          <View style={styles.packageMeta}>
            <View style={styles.metaItem}>
              <Clock3 color={colors.muted} size={16} />
              <Text style={[styles.metaText, { color: colors.muted }]}>
                {activePackage?.deliveryDays
                  ? `${activePackage.deliveryDays} day${activePackage.deliveryDays === 1 ? "" : "s"}`
                  : `${gig?.min_hours || 1}h minimum`}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <RefreshCw color={colors.muted} size={16} />
              <Text style={[styles.metaText, { color: colors.muted }]}>
                {activePackage?.revisions || 0}{" "}
                {activePackage?.revisions === 1 ? "revision" : "revisions"}
              </Text>
            </View>
            {gig?.max_radius_km ? (
              <View style={styles.metaItem}>
                <MapPin color={colors.muted} size={16} />
                <Text style={[styles.metaText, { color: colors.muted }]}>
                  {gig.max_radius_km} km area
                </Text>
              </View>
            ) : null}
          </View>
          {requirements.slice(0, 3).map((feature) => (
            <View key={feature} style={styles.feature}>
              <Check color={colors.success} size={16} strokeWidth={3} />
              <Text style={[styles.featureText, { color: colors.ink }]}>
                {feature}
              </Text>
            </View>
          ))}
          <Button title="Hire this package" onPress={openDirectHire} />
          <Button
            title="Post a custom request instead"
            variant="secondary"
            onPress={continueBooking}
          />
          <Text
            style={[
              styles.safetyCopy,
              { color: colors.muted, backgroundColor: colors.soft },
            ]}
          >
            The package price comes from the provider's published service. Your
            exact address stays private until booking is confirmed.
          </Text>
        </View>
      </View> : (
        <View style={[styles.packageCard, styles.packageBody, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.packageName, { color: colors.ink }]}>Custom requests only</Text>
          <Text style={[styles.packageDescription, { color: colors.muted }]}>
            {name} has not published a fixed-price package yet.
          </Text>
          <Button title="Post a custom request" onPress={continueBooking} />
        </View>
      )}

      <SectionHeader title="About this gig" />
      <Text style={[styles.bodyCopy, { color: colors.muted }]}>
        {textValue(gig?.description) ||
          textValue(profile.biography) ||
          textValue(profile.description) ||
          "No public gig description has been added yet."}
      </Text>
      {tags.length ? (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tag,
                { backgroundColor: colors.soft, borderColor: colors.line },
              ]}
            >
              <Check color={colors.success} size={14} />
              <Text style={[styles.tagText, { color: colors.ink }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <SectionHeader title="About the provider" />
      <View
        style={[
          styles.providerCard,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <View style={styles.providerHead}>
          <Avatar
            name={name}
            uri={imageUrl(profile.avatar) || imageUrl(profile.profile_image_url)}
            size={62}
          />
          <View style={styles.providerCopy}>
            <Text style={[styles.providerName, { color: colors.ink }]}>
              {name}
            </Text>
            <Text style={[styles.providerCategory, { color: colors.muted }]}>
              {category}
            </Text>
            <View style={styles.providerStats}>
              <Text style={[styles.providerStat, { color: colors.ink }]}>
                {completedJobs} jobs
              </Text>
              {textValue(profile.experience) ? (
                <Text style={[styles.providerStat, { color: colors.ink }]}>
                  {textValue(profile.experience)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        <View style={[styles.detailGrid, { borderTopColor: colors.line }]}>
          <View style={styles.detail}>
            <MapPin color={colors.brand} size={17} />
            <Text style={[styles.detailLabel, { color: colors.muted }]}>
              From
            </Text>
            <Text style={[styles.detailValue, { color: colors.ink }]}>
              {location}
            </Text>
          </View>
          <View style={styles.detail}>
            <Clock3 color={colors.info} size={17} />
            <Text style={[styles.detailLabel, { color: colors.muted }]}>
              Response
            </Text>
            <Text style={[styles.detailValue, { color: colors.ink }]}>
              {textValue(profile.responseTime) || "Usually within a day"}
            </Text>
          </View>
          <View style={styles.detail}>
            <BriefcaseBusiness color={colors.success} size={17} />
            <Text style={[styles.detailLabel, { color: colors.muted }]}>
              Availability
            </Text>
            <Text style={[styles.detailValue, { color: colors.ink }]}>
              {textValue(profile.availability) || "Ask provider"}
            </Text>
          </View>
          <View style={styles.detail}>
            <Star color="#f4b400" fill="#f4b400" size={17} />
            <Text style={[styles.detailLabel, { color: colors.muted }]}>
              Starting rate
            </Text>
            <Text style={[styles.detailValue, { color: colors.ink }]}>
              {baseRate ? `€${baseRate}/hour` : "Quote required"}
            </Text>
          </View>
        </View>
        {serviceAreas.length ? (
          <View style={[styles.contactWindows, { borderTopColor: colors.line }]}>
            <Text style={[styles.detailLabel, { color: profile.worksInViewerArea ? colors.success : colors.muted }]}>
              {profile.worksInViewerArea ? "Works in your area" : "Seller preference areas"}
            </Text>
            <View style={styles.windowPills}>
              {serviceAreas.slice(0, 8).map((area) => (
                <View key={area.label} style={[styles.windowPill, { backgroundColor: colors.soft, borderColor: colors.line }]}>
                  <Text style={[styles.windowText, { color: colors.ink }]}>{area.label} · {area.radiusKm || 15} km</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {contactWindows.length ? (
          <View style={[styles.contactWindows, { borderTopColor: colors.line }]}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>
              Best times to contact
            </Text>
            <View style={styles.windowPills}>
              {contactWindows.map((window) => (
                <View
                  key={window}
                  style={[
                    styles.windowPill,
                    { backgroundColor: colors.soft, borderColor: colors.line },
                  ]}
                >
                  <Text style={[styles.windowText, { color: colors.ink }]}>
                    {window}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <SectionHeader title="Frequently asked questions" />
      <View
        style={[
          styles.faqList,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        {visibleFaqs.map((faq, index) => {
          const open = openFaq === index;
          return (
            <Pressable
              key={`${faq.question}-${index}`}
              accessibilityRole="button"
              onPress={() => setOpenFaq(open ? null : index)}
              style={[
                styles.faq,
                index > 0 && { borderTopColor: colors.line, borderTopWidth: 1 },
              ]}
            >
              <View style={styles.faqHead}>
                <Text style={[styles.faqQuestion, { color: colors.ink }]}>
                  {faq.question}
                </Text>
                <ChevronDown
                  color={colors.subtle}
                  size={18}
                  style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
                />
              </View>
              {open ? (
                <Text style={[styles.faqAnswer, { color: colors.muted }]}>
                  {faq.answer}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Verified reviews" />
      <View
        style={[
          styles.reviewSummary,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <View style={styles.reviewScore}>
          <Text style={[styles.reviewNumber, { color: colors.ink }]}>
            {reviewCount ? rating.toFixed(1) : "New"}
          </Text>
          <Text style={[styles.reviewCount, { color: colors.muted }]}>
            {reviewCount} review{reviewCount === 1 ? "" : "s"}
          </Text>
        </View>
        <View style={styles.distribution}>
          {[5, 4, 3, 2, 1].map((stars) => (
            <View key={stars} style={styles.distributionRow}>
              <Text style={[styles.starLabel, { color: colors.muted }]}>
                {stars}
              </Text>
              <Star color="#f4b400" fill="#f4b400" size={11} />
              <View
                style={[
                  styles.distributionTrack,
                  { backgroundColor: colors.soft },
                ]}
              >
                <View
                  style={[
                    styles.distributionFill,
                    {
                      backgroundColor: colors.ink,
                      width: maxDistribution
                        ? `${((distribution[stars] || 0) / maxDistribution) * 100}%`
                        : "0%",
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
      {reviews.length ? (
        <View style={styles.reviewList}>
          {reviews.map((review) => (
            <View
              key={review.id}
              style={[
                styles.review,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <View style={styles.reviewHead}>
                <View
                  style={[styles.reviewAvatar, { backgroundColor: colors.ink }]}
                >
                  <Text
                    style={[styles.reviewInitials, { color: colors.canvas }]}
                  >
                    {review.reviewerInitials || initials(review.reviewerName)}
                  </Text>
                </View>
                <View style={styles.reviewCopy}>
                  <Text style={[styles.reviewerName, { color: colors.ink }]}>
                    {review.reviewerName}
                  </Text>
                  <View style={styles.reviewMeta}>
                    <Star color="#f4b400" fill="#f4b400" size={13} />
                    <Text style={[styles.reviewRating, { color: colors.ink }]}>
                      {review.rating.toFixed(1)}
                    </Text>
                    <Text style={[styles.reviewDate, { color: colors.muted }]}>
                      {review.createdAt}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.reviewComment, { color: colors.muted }]}>
                {review.comment}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text
          style={[
            styles.emptyReviews,
            { color: colors.muted, backgroundColor: colors.soft },
          ]}
        >
          No written reviews yet. Ratings appear only after completed AnyJob
          bookings.
        </Text>
      )}

      {relatedProviders.length ? (
        <>
          <SectionHeader title={`More ${category} providers`} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedList}
          >
            {relatedProviders.map((related) => (
              <Pressable
                accessibilityRole="button"
                key={related.id}
                onPress={() => router.push(`/provider/${related.id}`)}
                style={[
                  styles.related,
                  { backgroundColor: colors.surface, borderColor: colors.line },
                ]}
              >
                <Image
                  source={
                    related.heroImage || related.image
                      ? { uri: related.heroImage || related.image || "" }
                      : serviceCover(categorySlug)
                  }
                  alt={`${related.name} service`}
                  contentFit="cover"
                  style={[
                    styles.relatedImage,
                    { backgroundColor: colors.soft },
                  ]}
                />
                <View style={styles.relatedBody}>
                  <Text
                    numberOfLines={1}
                    style={[styles.relatedName, { color: colors.ink }]}
                  >
                    {related.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.relatedCategory, { color: colors.muted }]}
                  >
                    {related.category}
                  </Text>
                  <View style={styles.relatedFoot}>
                    {related.reviewCount ? (
                      <Text
                        style={[styles.relatedRating, { color: colors.ink }]}
                      >
                        ★ {Number(related.rating || 0).toFixed(1)}
                      </Text>
                    ) : (
                      <Text
                        style={[styles.relatedRating, { color: colors.muted }]}
                      >
                        New
                      </Text>
                    )}
                    <Text style={[styles.relatedPrice, { color: colors.ink }]}>
                      {related.rate ? `€${related.rate}/h` : "Quote"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      <View style={[styles.trust, { backgroundColor: colors.successSoft }]}>
        <ShieldCheck color={colors.success} size={23} />
        <View style={styles.trustCopy}>
          <Text style={[styles.trustTitle, { color: colors.ink }]}>
            Booking starts safely
          </Text>
          <Text style={[styles.trustBody, { color: colors.muted }]}>
            Payment, messaging, completion, and verified reviews stay inside
            AnyJob.
          </Text>
        </View>
      </View>
      {activePackage ? (
        <Button title={`Hire ${activePackage.title || "this package"}`} onPress={openDirectHire} />
      ) : (
        <Button title="Post a custom request" onPress={continueBooking} />
      )}

      <Modal
        visible={showDirectHire}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDirectHire(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }] }>
            <View style={styles.modalHead}>
              <View style={styles.modalCopy}>
                <Text style={[styles.modalEyebrow, { color: colors.brand }]}>DIRECT HIRE</Text>
                <Text style={[styles.modalTitle, { color: colors.ink }]}>
                  {activePackage?.title || "Service package"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                  {name} · €{Number(activePackage?.price || 0).toFixed(0)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close direct hire"
                onPress={() => setShowDirectHire(false)}
                style={[styles.modalClose, { backgroundColor: colors.soft }]}
              >
                <Text style={[styles.modalCloseText, { color: colors.ink }]}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalFields}
            >
              <Field label="Date" placeholder="YYYY-MM-DD" value={hireForm.preferredDate} onChangeText={setHireField("preferredDate")} />
              <Field label="Preferred time" placeholder="HH:MM" value={hireForm.preferredTime} onChangeText={setHireField("preferredTime")} />
              <Field label="Service address" placeholder="Street address" value={hireForm.address} onChangeText={setHireField("address")} />
              <Field label="City" placeholder="City" value={hireForm.city} onChangeText={setHireField("city")} />
              <Field label="Postal code" placeholder="Optional" value={hireForm.postalCode} onChangeText={setHireField("postalCode")} />
              <Field label="Notes for provider" placeholder="Access, scope, or timing details" multiline value={hireForm.notes} onChangeText={setHireField("notes")} />
              {hireError ? (
                <Text accessibilityRole="alert" style={[styles.hireError, { color: colors.danger, backgroundColor: colors.soft }]}>
                  {hireError}
                </Text>
              ) : null}
              <Button title="Pay and hire package" loading={hiring} onPress={() => void hirePackage()} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  saveIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heroMedia: { aspectRatio: 4 / 3, borderRadius: 18, overflow: "hidden" },
  heroImage: { width: "100%", height: "100%" },
  popular: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 20,
    paddingHorizontal: 10,
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  popularText: { fontSize: 10.5, fontWeight: "900" },
  gallery: { gap: 8 },
  galleryImage: { width: 112, aspectRatio: 4 / 3, borderRadius: 11 },
  gigHeading: { gap: 10 },
  gigTitle: { fontSize: 25, lineHeight: 31, fontWeight: "900" },
  sellerLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  sellerName: { maxWidth: 170, fontSize: 12.5, fontWeight: "900" },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 11.5, fontWeight: "900" },
  packageCard: { borderWidth: 1, borderRadius: 17, overflow: "hidden" },
  packageTabs: { flexDirection: "row", borderBottomWidth: 1 },
  packageTab: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    paddingHorizontal: 4,
  },
  packageTabText: { fontSize: 11.5, fontWeight: "900" },
  packageBody: { padding: 14, gap: 12 },
  packageTitleLine: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  packageCopy: { flex: 1, gap: 4 },
  packageName: { fontSize: 15.5, fontWeight: "900" },
  packageDescription: { fontSize: 11.5, lineHeight: 17 },
  packagePrice: { fontSize: 24, fontWeight: "900" },
  packageMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 10.5, fontWeight: "800" },
  feature: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  featureText: { flex: 1, fontSize: 11.5, lineHeight: 16, fontWeight: "700" },
  safetyCopy: {
    borderRadius: 10,
    padding: 10,
    fontSize: 10.5,
    lineHeight: 16,
    fontWeight: "700",
  },
  bodyCopy: { fontSize: 13, lineHeight: 21 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  tag: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tagText: { fontSize: 10.5, fontWeight: "800" },
  providerCard: { borderWidth: 1, borderRadius: 17, padding: 14, gap: 14 },
  providerHead: { flexDirection: "row", alignItems: "center", gap: 11 },
  providerCopy: { flex: 1, gap: 3 },
  providerName: { fontSize: 16.5, fontWeight: "900" },
  providerCategory: { fontSize: 11.5 },
  providerStats: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  providerStat: { fontSize: 10.5, fontWeight: "800" },
  detailGrid: {
    borderTopWidth: 1,
    paddingTop: 13,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detail: { flexBasis: "45%", flexGrow: 1, gap: 2 },
  detailLabel: { fontSize: 9.5, fontWeight: "800" },
  detailValue: { fontSize: 11, lineHeight: 15, fontWeight: "900" },
  contactWindows: { borderTopWidth: 1, paddingTop: 12, gap: 9 },
  windowPills: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  windowPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  windowText: { fontSize: 10.5, fontWeight: "900" },
  faqList: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  faq: { padding: 13, gap: 8 },
  faqHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  faqQuestion: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "900" },
  faqAnswer: { fontSize: 11.5, lineHeight: 18 },
  reviewSummary: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  reviewScore: { minWidth: 76, gap: 3 },
  reviewNumber: { fontSize: 31, fontWeight: "900" },
  reviewCount: { fontSize: 10.5 },
  distribution: { flex: 1, gap: 4 },
  distributionRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  starLabel: { width: 8, fontSize: 9.5, fontWeight: "800" },
  distributionTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  distributionFill: { height: "100%", borderRadius: 3 },
  reviewList: { gap: 9 },
  review: { borderWidth: 1, borderRadius: 15, padding: 13, gap: 9 },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: 9 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewInitials: { fontSize: 11, fontWeight: "900" },
  reviewCopy: { flex: 1, gap: 3 },
  reviewerName: { fontSize: 12.5, fontWeight: "900" },
  reviewMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  reviewRating: { fontSize: 10.5, fontWeight: "900" },
  reviewDate: { fontSize: 10 },
  reviewComment: { fontSize: 11.5, lineHeight: 18 },
  emptyReviews: {
    borderRadius: 12,
    padding: 13,
    fontSize: 11.5,
    lineHeight: 18,
  },
  relatedList: { gap: 9 },
  related: { width: 190, borderWidth: 1, borderRadius: 15, overflow: "hidden" },
  relatedImage: { width: "100%", height: 105 },
  relatedBody: { padding: 10, gap: 4 },
  relatedName: { fontSize: 12.5, fontWeight: "900" },
  relatedCategory: { fontSize: 10.5 },
  relatedFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 3,
  },
  relatedRating: { fontSize: 10.5, fontWeight: "800" },
  relatedPrice: { fontSize: 10.5, fontWeight: "900" },
  trust: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trustCopy: { flex: 1, gap: 3 },
  trustTitle: { fontSize: 13.5, fontWeight: "900" },
  trustBody: { fontSize: 11, lineHeight: 16 },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  modalSheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    gap: 16,
  },
  modalHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  modalCopy: { flex: 1, gap: 3 },
  modalEyebrow: { fontSize: 10.5, fontWeight: "900" },
  modalTitle: { fontSize: 20, lineHeight: 25, fontWeight: "900" },
  modalSubtitle: { fontSize: 12.5, fontWeight: "700" },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: { fontSize: 27, lineHeight: 29, fontWeight: "500" },
  modalFields: { gap: 13, paddingBottom: 20 },
  hireError: { borderRadius: 11, padding: 11, fontSize: 12, lineHeight: 18, fontWeight: "800" },
});
