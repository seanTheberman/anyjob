import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Award,
  BriefcaseBusiness,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Euro,
  Gavel,
  ImageIcon,
  MapPin,
  Send,
  ShieldCheck,
  Star,
  User,
} from "lucide-react-native";
import { cloneElement, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Button,
  Card,
  ErrorState,
  Field,
  IconButton,
  LoadingState,
  Pill,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { useAppTheme } from "@/providers/theme-provider";
import { radius } from "@/theme/tokens";

const PROVIDER_QUOTE_TERMS_VERSION = "provider_quote_terms_v1";

type TrustBadge = {
  label: string;
  tone?: "green" | "blue" | "amber" | "purple" | "slate" | "red";
  source?: string;
};

type Offer = {
  id: string;
  amount: number;
  buyerTotal: number;
  message?: string;
  estimatedDurationHours?: number | null;
  availableDate?: string | null;
  status: string;
  createdAt: string;
  provider?: {
    name?: string;
    avatar?: string | null;
    rating?: number;
    reviewCount?: number;
    totalJobs?: number;
    completionRate?: number;
    serviceCategory?: string | null;
    experienceLevel?: string | null;
  };
};

type JobDetails = {
  id: string;
  title: string;
  description: string;
  client?: {
    name?: string;
    rating?: number;
    reviewCount?: number;
  };
  budget?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  location?: {
    address?: string;
    city?: string;
    postalCode?: string;
    coarseLabel?: string;
    exactAddressVisible?: boolean;
  };
  category?: string;
  customTags?: string[];
  serviceType?: string;
  urgency?: string;
  duration?: string;
  peopleNeeded?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  materials?: string;
  equipment?: string;
  postedAt?: string;
  status?: string;
  anyjobSelect?: boolean;
  adminPosted?: boolean;
  bid_count?: number;
  my_bid?: {
    amount: number;
    status: string;
    visit_verification_code?: string | null;
  } | null;
  work_image_count?: number;
  work_images?: Array<{ id: string; image_url: string }>;
  offers?: Offer[];
  buyerStats?: {
    jobsPosted: number;
    hires: number;
    hireRate: number;
    averageRatingGiven: number;
    ratingsGiven: number;
  };
  buyerTrust?: {
    jobsPosted: number;
    hires: number;
    hireRate: number;
    paidJobs: number;
    totalSpentLabel: string;
    paymentStatus: "verified" | "unverified";
    isNewClient: boolean;
    kycVerified: boolean;
    badges: TrustBadge[];
  } | null;
};

function money(amount: number, currency = "€") {
  return `${currency}${Number(amount || 0).toFixed(2)}`;
}

function feeBreakdown(amount: number) {
  const onsiteDue = Number(amount || 0);
  const bookingToken = Math.round(onsiteDue * 0.1 * 100) / 100;
  return {
    onsiteDue,
    bookingToken,
    buyerTotal: Math.round((onsiteDue + bookingToken) * 100) / 100,
  };
}

function budgetLabel(job: JobDetails) {
  const currency = job.budget?.currency || "€";
  const min = Number(job.budget?.min || 0);
  const max = Number(job.budget?.max || 0);
  if (min && max && min !== max) return `${currency}${min}–${max}`;
  if (max || min) return `${currency}${max || min}`;
  return "Open budget";
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const { colors } = useAppTheme();
  const [showOffer, setShowOffer] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState("2");
  const [date, setDate] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const query = useQuery({
    queryKey: ["job", id],
    queryFn: () => api<any>(`/api/jobs/${id}`),
  });

  const job: JobDetails | undefined =
    query.data?.job || query.data?.inquiry || query.data;
  const quoteAmount = Number(amount);
  const breakdown = useMemo(
    () => feeBreakdown(Number.isFinite(quoteAmount) ? quoteAmount : 0),
    [quoteAmount],
  );
  const validationError = !amount.trim()
    ? null
    : !Number.isFinite(quoteAmount) || quoteAmount <= 0
      ? "Enter a valid amount greater than 0."
      : job?.budget?.min && quoteAmount < Number(job.budget.min)
        ? `Your quote is below the buyer budget minimum of ${job.budget.currency || "€"}${job.budget.min}.`
        : job?.budget?.max && quoteAmount > Number(job.budget.max)
          ? `Your quote is above the buyer budget maximum of ${job.budget.currency || "€"}${job.budget.max}.`
          : null;

  const submit = useMutation({
    mutationFn: () =>
      api("/api/bids", {
        method: "POST",
        ...jsonBody({
          inquiry_id: id,
          amount: quoteAmount,
          message,
          estimated_duration_hours: Number(duration),
          available_date: date || new Date().toISOString().slice(0, 10),
          terms_accepted: termsAccepted,
          terms_version: PROVIDER_QUOTE_TERMS_VERSION,
        }),
      }),
    onSuccess: () => {
      Alert.alert("Offer sent", "The buyer can now review your quote.");
      setShowOffer(false);
      setTermsAccepted(false);
      void Promise.all([
        client.invalidateQueries({ queryKey: ["jobs"] }),
        client.invalidateQueries({ queryKey: ["job", id] }),
        client.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
    onError: (error: Error) => Alert.alert("Could not send offer", error.message),
  });

  if (query.isLoading)
    return (
      <Screen>
        <LoadingState label="Loading job details..." />
      </Screen>
    );

  if (query.isError || !job)
    return (
      <Screen>
        <ErrorState
          message={(query.error as Error)?.message || "Job not found"}
          retry={() => void query.refetch()}
        />
      </Screen>
    );

  const existingBid = job.my_bid ?? null;
  const offers = job.offers || [];
  const offerCount = Math.max(Number(job.bid_count || 0), offers.length);
  const buyerStats = job.buyerStats || {
    jobsPosted: 0,
    hires: 0,
    hireRate: 0,
    averageRatingGiven: 0,
    ratingsGiven: 0,
  };
  const currency = job.budget?.currency || "€";
  const canSubmit =
    Boolean(amount.trim()) &&
    !validationError &&
    termsAccepted &&
    !submit.isPending;
  const goBackToJobs = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/explore");
  };

  return (
    <Screen>
      <View style={styles.compactHeader}>
        <IconButton label="Back to jobs" onPress={goBackToJobs}>
          <ChevronLeft color={colors.ink} size={23} />
        </IconButton>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.headerKicker, { color: colors.muted }]}>
            Provider work board
          </Text>
          <Text style={[styles.headerTitle, { color: colors.ink }]}>
            Job details
          </Text>
        </View>
        <View style={[styles.headerBudget, { backgroundColor: colors.soft }]}>
          <Text style={[styles.headerBudgetText, { color: colors.ink }]}>
            {budgetLabel(job)}
          </Text>
        </View>
      </View>

      <Card>
        <View style={styles.badges}>
          <Pill text="Open" tone="success" />
          {job.anyjobSelect ? <Pill text="AnyJob Select" tone="brand" /> : null}
          <Pill text={job.status || "submitted"} tone="info" />
          <Pill
            text={`${offerCount} offer${offerCount === 1 ? "" : "s"}`}
            tone="neutral"
          />
        </View>
        <Text numberOfLines={1} style={[styles.heroTitle, { color: colors.ink }]}>
          {job.title}
        </Text>
        <TrustBadges badges={job.buyerTrust?.badges || []} />
        <View style={styles.factGrid}>
          <Fact
            icon={<MapPin />}
            label="Location"
            value={job.location?.address || job.location?.coarseLabel || "Approximate location"}
            detail={[
              job.location?.city,
              job.location?.postalCode,
              job.location?.exactAddressVisible ? "Exact address visible" : "Exact address after paid acceptance",
            ]
              .filter(Boolean)
              .join(" · ")}
          />
          <Fact
            icon={<Calendar />}
            label="To be done"
            value={job.date || "Flexible date"}
            detail={`${job.startTime || "Anytime"}${job.endTime ? ` - ${job.endTime}` : ""}`}
          />
          <Fact
            icon={<Clock />}
            label="Workload"
            value={job.duration || "Not specified"}
            detail={`${job.peopleNeeded || 1} people needed`}
          />
        </View>
      </Card>

      <CoarseAreaPreview job={job} />

      <Card>
        <SectionTitle title="Details" />
        <Text style={[styles.description, { color: colors.muted }]}>
          {job.description || "No description provided."}
        </Text>
        {job.customTags?.length ? (
          <View style={styles.tags}>
            {job.customTags.map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: colors.infoSoft }]}
              >
                <Text style={[styles.tagText, { color: colors.info }]}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.infoGrid}>
          <InfoTile label="Materials" value={job.materials || "Not specified"} />
          <InfoTile label="Equipment" value={job.equipment || "Not specified"} />
          <InfoTile label="Service type" value={job.serviceType || "One time"} />
          <InfoTile label="Urgency" value={job.urgency || "Normal"} />
        </View>
      </Card>

      {job.work_images?.length ? (
        <Card>
          <View style={styles.sectionRow}>
            <ImageIcon color={colors.brand} size={19} />
            <SectionTitle title="Job photos" />
          </View>
          <View style={styles.photos}>
            {job.work_images.map((image) => (
              <Image
                key={image.id}
                source={{ uri: image.image_url }}
                contentFit="cover"
                style={[styles.photo, { backgroundColor: colors.soft }]}
              />
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <SectionTitle title="Client information" />
        <View style={styles.clientRow}>
          <View style={[styles.avatar, { backgroundColor: colors.soft }]}>
            <User color={colors.muted} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.clientName, { color: colors.ink }]}>
              {job.client?.name || "Buyer"}
            </Text>
            {job.client?.rating && job.client.reviewCount ? (
              <View style={styles.ratingLine}>
                <Star color="#f5b400" fill="#f5b400" size={15} />
                <Text style={[styles.metaText, { color: colors.ink }]}>
                  {job.client.rating.toFixed(1)} ({job.client.reviewCount})
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <TrustBadges badges={job.buyerTrust?.badges || []} />
        {job.anyjobSelect ? (
          <Text
            style={[
              styles.notice,
              { backgroundColor: colors.infoSoft, color: colors.info },
            ]}
          >
            Posted by AnyJob admin. Your quote is sent to the selected email
            holder for review.
          </Text>
        ) : null}
      </Card>

      <View style={styles.twoColumn}>
        <Card style={styles.columnCard}>
          <SectionTitle title="Task budget" />
          <Text style={[styles.budget, { color: colors.ink }]}>
            {budgetLabel(job)}
          </Text>
          <Text style={[styles.muted, { color: colors.muted }]}>
            Buyer budget before AnyJob quote fee.
          </Text>
        </Card>
        <Card style={styles.columnCard}>
          <SectionTitle title="Job statistics" />
          <StatLine label="Posted" value={job.postedAt || "Unknown"} />
          <StatLine label="Status" value={job.status || "submitted"} />
          <StatLine label="Total offers" value={String(offerCount)} />
          <StatLine
            label="Photos"
            value={String(job.work_image_count || job.work_images?.length || 0)}
          />
        </Card>
      </View>

      <Card>
        <SectionTitle title="Buyer activity" />
        <View style={styles.metrics}>
          <Metric label="Jobs posted" value={buyerStats.jobsPosted} />
          <Metric label="Hires" value={buyerStats.hires} />
          <Metric label="Hire rate" value={`${buyerStats.hireRate}%`} />
        </View>
        <Text style={[styles.muted, { color: colors.muted }]}>
          {job.buyerTrust?.paymentStatus === "verified"
            ? "Payment verified."
            : "Payment not verified yet."}{" "}
          {job.buyerTrust?.kycVerified
            ? "Buyer KYC verified."
            : "Buyer KYC has not been verified."}
        </Text>
      </Card>

      <Card>
        <SectionHeader title={`Offers (${offers.length})`} />
        {offers.length ? (
          <View style={styles.offerList}>
            {offers.map((offer) => (
              <OfferRow key={offer.id} offer={offer} currency={currency} />
            ))}
          </View>
        ) : (
          <View style={[styles.emptyOffer, { backgroundColor: colors.soft }]}>
            <Gavel color={colors.subtle} size={24} />
            <Text style={[styles.clientName, { color: colors.ink }]}>
              No offers yet
            </Text>
            <Text style={[styles.muted, { color: colors.muted }]}>
              Your offer can be the first one the buyer receives.
            </Text>
          </View>
        )}
      </Card>

      {existingBid ? (
        <Card style={{ backgroundColor: colors.successSoft }}>
          <View style={styles.center}>
            <ShieldCheck color={colors.success} size={28} />
            <Text style={[styles.cardTitle, { color: colors.ink }]}>
              Offer already submitted
            </Text>
            <Text style={[styles.mutedCentered, { color: colors.muted }]}>
              You quoted {money(Number(existingBid.amount), currency)}. Status:{" "}
              {existingBid.status}
            </Text>
            {existingBid.status === "accepted" && existingBid.visit_verification_code ? (
              <View
                style={[
                  styles.providerCode,
                  { backgroundColor: colors.surface, borderColor: colors.info },
                ]}
              >
                <Text style={[styles.codeLabel, { color: colors.info }]}>
                  Visit verification code
                </Text>
                <Text style={[styles.codeValue, { color: colors.ink }]}>
                  {existingBid.visit_verification_code}
                </Text>
                <Text style={[styles.codeHelp, { color: colors.muted }]}>
                  Show this code to the buyer when you arrive.
                </Text>
              </View>
            ) : null}
          </View>
        </Card>
      ) : showOffer ? (
        <Card>
          <SectionTitle title="Make an offer" />
          <Field
            label={`Your quote amount (${currency})`}
            value={amount}
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder={`Buyer budget ${budgetLabel(job)}`}
            error={validationError || undefined}
          />
          {quoteAmount > 0 && !validationError ? (
            <View
              style={[
                styles.breakdown,
                { backgroundColor: colors.soft, borderColor: colors.line },
              ]}
            >
              <StatLine
                label="Your job payout"
                value={money(breakdown.onsiteDue, currency)}
              />
              <StatLine
                label="AnyJob fee added"
                value={money(breakdown.bookingToken, currency)}
              />
              <View style={[styles.divider, { backgroundColor: colors.line }]} />
              <StatLine
                label="Buyer sees total"
                value={money(breakdown.buyerTotal, currency)}
                strong
              />
            </View>
          ) : null}
          <Field
            label="Estimated hours"
            value={duration}
            keyboardType="number-pad"
            onChangeText={setDuration}
          />
          <Field
            label="Available date (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
          />
          <Field
            label="Message to buyer"
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder="Introduce yourself and explain how you will handle the job..."
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
            onPress={() => setTermsAccepted((current) => !current)}
            style={[
              styles.termsRow,
              { backgroundColor: colors.soft, borderColor: colors.line },
            ]}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: termsAccepted ? colors.brand : colors.line,
                  backgroundColor: termsAccepted ? colors.brand : colors.surface,
                },
              ]}
            >
              {termsAccepted ? <Check color="white" size={15} /> : null}
            </View>
            <Text style={[styles.termsText, { color: colors.muted }]}>
              I accept the AnyJob provider service terms for this job. My
              acceptance is saved with this quote.
            </Text>
          </Pressable>
          <Button
            title="Submit Bid"
            icon={<Send color="white" size={17} />}
            onPress={() => submit.mutate()}
            loading={submit.isPending}
            disabled={!canSubmit}
          />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setShowOffer(false)}
          />
        </Card>
      ) : (
        <Button title="Make an offer" onPress={() => setShowOffer(true)} />
      )}

      <Button
        title="Back to live jobs"
        variant="secondary"
        onPress={goBackToJobs}
      />
    </Screen>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.cardTitle, { color: colors.ink }]}>{title}</Text>;
}

function Fact({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactElement<{ color?: string; size?: number }>;
  label: string;
  value: string;
  detail?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fact}>
      <View style={[styles.factIcon, { backgroundColor: colors.soft }]}>
        {cloneElement(icon, { color: colors.ink, size: 18 })}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.factValue, { color: colors.ink }]}>{value}</Text>
        {detail ? (
          <Text style={[styles.factDetail, { color: colors.muted }]}>
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.infoTile, { backgroundColor: colors.soft }]}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

function StatLine({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.statLine}>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          { color: colors.ink },
          strong && styles.statStrong,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.metric, { backgroundColor: colors.soft }]}>
      <Text style={[styles.metricValue, { color: colors.ink }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function TrustBadges({ badges }: { badges: TrustBadge[] }) {
  const { colors } = useAppTheme();
  if (!badges.length) return null;
  return (
    <View style={styles.badges}>
      {badges.slice(0, 6).map((badge) => (
        <View
          key={`${badge.source || "badge"}-${badge.label}`}
          style={[styles.trustBadge, { backgroundColor: colors.soft }]}
        >
          <Text style={[styles.trustBadgeText, { color: colors.ink }]}>
            {badge.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CoarseAreaPreview({ job }: { job: JobDetails }) {
  const { colors, isDark } = useAppTheme();
  const area =
    job.location?.coarseLabel ||
    job.location?.address ||
    [job.location?.city, job.location?.postalCode].filter(Boolean).join(", ") ||
    "Approximate area";
  const exactVisible = job.location?.exactAddressVisible === true;
  return (
    <Card>
      <View style={styles.sectionRow}>
        <MapPin color={colors.brand} size={19} />
        <SectionTitle title="Listed area" />
      </View>
      <View
        accessible
        accessibilityLabel={`Approximate job area: ${area}`}
        style={[
          styles.areaMap,
          {
            backgroundColor: isDark ? "#141a1d" : "#eef3f0",
            borderColor: colors.line,
          },
        ]}
      >
        <View style={[styles.mapRoad, styles.mapRoadOne, { backgroundColor: colors.line }]} />
        <View style={[styles.mapRoad, styles.mapRoadTwo, { backgroundColor: colors.line }]} />
        <View style={[styles.mapRoad, styles.mapRoadThree, { backgroundColor: colors.line }]} />
        <View
          style={[
            styles.areaCircleOuter,
            { backgroundColor: colors.brand + "18", borderColor: colors.brand + "55" },
          ]}
        />
        <View
          style={[
            styles.areaCircleInner,
            { backgroundColor: colors.brand + "24", borderColor: colors.brand },
          ]}
        />
        <View style={[styles.areaPin, { backgroundColor: colors.brand }]}>
          <MapPin color="white" size={19} />
        </View>
        <View style={[styles.areaLabel, { backgroundColor: colors.surface }]}>
          <Text style={[styles.areaLabelText, { color: colors.ink }]} numberOfLines={1}>
            {area}
          </Text>
        </View>
      </View>
      <View style={styles.areaCopyRow}>
        <View style={[styles.areaIcon, { backgroundColor: colors.soft }]}>
          <ShieldCheck color={colors.success} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.areaTitle, { color: colors.ink }]}>
            {exactVisible ? "Exact address unlocked" : "Approximate area only"}
          </Text>
          <Text style={[styles.areaBody, { color: colors.muted }]}>
            {exactVisible
              ? "The accepted quote can see the full service address."
              : "Providers see the coarse marketplace area before quoting. Exact address and contact details unlock after paid acceptance."}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function OfferRow({ offer, currency }: { offer: Offer; currency: string }) {
  const { colors } = useAppTheme();
  const provider = offer.provider || {};
  return (
    <View style={[styles.offer, { borderColor: colors.line }]}>
      <View style={styles.offerTop}>
        <View style={[styles.avatarSmall, { backgroundColor: colors.soft }]}>
          {provider.avatar ? (
            <Image
              source={{ uri: provider.avatar }}
              contentFit="cover"
              style={styles.avatarImage}
            />
          ) : (
            <User color={colors.muted} size={18} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.offerName, { color: colors.ink }]}>
            {provider.name || "Provider"}
          </Text>
          <Text style={[styles.metaText, { color: colors.muted }]}>
            {[provider.serviceCategory, provider.experienceLevel]
              .filter(Boolean)
              .join(" · ") || offer.status}
          </Text>
        </View>
        <View style={[styles.offerPrice, { backgroundColor: colors.soft }]}>
          <Text style={[styles.label, { color: colors.muted }]}>Buyer sees</Text>
          <Text style={[styles.offerTotal, { color: colors.ink }]}>
            {money(Number(offer.buyerTotal || offer.amount), currency)}
          </Text>
        </View>
      </View>
      {offer.message ? (
        <Text style={[styles.offerMessage, { color: colors.muted }]}>
          {offer.message}
        </Text>
      ) : null}
      <View style={styles.offerMeta}>
        {provider.rating ? (
          <Text style={[styles.metaText, { color: colors.muted }]}>
            {provider.rating.toFixed(1)} rating
          </Text>
        ) : null}
        {provider.totalJobs ? (
          <Text style={[styles.metaText, { color: colors.muted }]}>
            {provider.totalJobs} completed
          </Text>
        ) : null}
        <Text style={[styles.metaText, { color: colors.muted }]}>
          Provider quote {money(Number(offer.amount), currency)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerKicker: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  headerTitle: { fontSize: 22, lineHeight: 27, fontWeight: "900" },
  headerBudget: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: 120,
  },
  headerBudgetText: { fontSize: 12, fontWeight: "900" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  heroTitle: { fontSize: 22, lineHeight: 27, fontWeight: "900", marginTop: 12 },
  factGrid: { gap: 14, marginTop: 18 },
  fact: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  factIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  factValue: { fontSize: 16, lineHeight: 22, fontWeight: "800" },
  factDetail: { fontSize: 13, lineHeight: 18, marginTop: 1 },
  cardTitle: { fontSize: 22, lineHeight: 27, fontWeight: "900" },
  description: { fontSize: 16, lineHeight: 25, marginTop: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 14 },
  tag: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  tagText: { fontSize: 12, fontWeight: "900" },
  infoGrid: { gap: 10, marginTop: 16 },
  infoTile: { borderRadius: radius.md, padding: 13, gap: 4 },
  infoValue: { fontSize: 15, lineHeight: 21, fontWeight: "800" },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  areaMap: {
    height: 188,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginTop: 14,
    overflow: "hidden",
    position: "relative",
  },
  mapRoad: {
    position: "absolute",
    height: 4,
    borderRadius: 99,
    opacity: 0.75,
  },
  mapRoadOne: {
    left: -30,
    right: -10,
    top: 46,
    transform: [{ rotate: "-10deg" }],
  },
  mapRoadTwo: {
    left: 18,
    right: -40,
    top: 116,
    transform: [{ rotate: "13deg" }],
  },
  mapRoadThree: {
    left: 116,
    width: 5,
    top: -20,
    bottom: -30,
    height: 250,
    transform: [{ rotate: "28deg" }],
  },
  areaCircleOuter: {
    position: "absolute",
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 1,
    left: "50%",
    top: "50%",
    marginLeft: -71,
    marginTop: -71,
  },
  areaCircleInner: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    left: "50%",
    top: "50%",
    marginLeft: -39,
    marginTop: -39,
  },
  areaPin: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    left: "50%",
    top: "50%",
    marginLeft: -22,
    marginTop: -22,
    alignItems: "center",
    justifyContent: "center",
  },
  areaLabel: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  areaLabelText: { fontSize: 14, fontWeight: "900" },
  areaCopyRow: {
    flexDirection: "row",
    gap: 11,
    alignItems: "flex-start",
    marginTop: 14,
  },
  areaIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  areaTitle: { fontSize: 15, fontWeight: "900" },
  areaBody: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 14 },
  photo: { width: "48%", aspectRatio: 1.3, borderRadius: radius.md },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  clientName: { fontSize: 17, fontWeight: "900" },
  ratingLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  notice: { marginTop: 14, borderRadius: radius.md, padding: 12, fontWeight: "800", lineHeight: 19 },
  twoColumn: { gap: 12 },
  columnCard: { flex: 1 },
  budget: { fontSize: 31, lineHeight: 37, fontWeight: "900", marginTop: 8 },
  muted: { fontSize: 14, lineHeight: 20 },
  metrics: { flexDirection: "row", gap: 8, marginVertical: 14 },
  metric: { flex: 1, borderRadius: radius.md, padding: 12, gap: 4 },
  metricValue: { fontSize: 22, fontWeight: "900" },
  trustBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  trustBadgeText: { fontSize: 11, fontWeight: "900" },
  offerList: { gap: 12 },
  offer: { borderWidth: 1, borderRadius: radius.lg, padding: 13, gap: 11 },
  offerTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  offerName: { fontSize: 15, fontWeight: "900" },
  offerPrice: { borderRadius: radius.md, padding: 9, alignItems: "flex-end" },
  offerTotal: { fontSize: 16, fontWeight: "900" },
  offerMessage: { fontSize: 14, lineHeight: 21 },
  offerMeta: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  metaText: { fontSize: 12, fontWeight: "800" },
  emptyOffer: { borderRadius: radius.lg, padding: 18, alignItems: "center", gap: 8 },
  center: { alignItems: "center", gap: 8 },
  mutedCentered: { textAlign: "center", fontSize: 14, lineHeight: 20 },
  providerCode: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 8,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  codeValue: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 10,
    fontVariant: ["tabular-nums"],
  },
  codeHelp: { fontSize: 13, lineHeight: 19, fontWeight: "700" },
  breakdown: { borderWidth: 1, borderRadius: radius.lg, padding: 13, gap: 9 },
  statLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  statLabel: { fontSize: 13, fontWeight: "700" },
  statValue: { fontSize: 13, fontWeight: "900", textAlign: "right", flexShrink: 1 },
  statStrong: { fontSize: 16 },
  divider: { height: 1 },
  termsRow: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: radius.lg, padding: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  termsText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "700" },
});
