import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Award,
  Baby,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  Gavel,
  GraduationCap,
  Hammer,
  HouseHeart,
  Leaf,
  MessageCircle,
  MonitorCog,
  PawPrint,
  PlusCircle,
  ShieldAlert,
  Search,
  Send,
  ShieldCheck,
  Star,
  Snowflake,
  SprayCan,
  Store,
  Truck,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppHeader } from "@/components/app-header";
import {
  ProviderCard,
  type ProviderCardData,
} from "@/components/provider-card";
import {
  Button,
  ListGroup,
  RowLink,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAppContent } from "@/lib/content";
import { serviceCover } from "@/lib/service-assets";
import { isProviderRole, useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { radius } from "@/theme/tokens";

const categoryItems: Array<{
  title: string;
  category: string;
  Icon: LucideIcon;
  tint: string;
  soft: string;
}> = [
  {
    title: "Winter services",
    category: "winter",
    Icon: Snowflake,
    tint: "#4389f7",
    soft: "#edf4ff",
  },
  {
    title: "Handyman",
    category: "handyman",
    Icon: Hammer,
    tint: "#f39a13",
    soft: "#fff5e6",
  },
  {
    title: "Gardening",
    category: "gardening",
    Icon: Leaf,
    tint: "#2fbd69",
    soft: "#eaf8ef",
  },
  {
    title: "Moving",
    category: "moving",
    Icon: Truck,
    tint: "#8559f4",
    soft: "#f1edff",
  },
  {
    title: "Cleaning",
    category: "cleaning",
    Icon: SprayCan,
    tint: "#ef4f9a",
    soft: "#fff0f6",
  },
  {
    title: "Childcare",
    category: "childcare",
    Icon: Baby,
    tint: "#ff7e2f",
    soft: "#fff1e9",
  },
  {
    title: "Pet care",
    category: "pet-care",
    Icon: PawPrint,
    tint: "#18a89f",
    soft: "#e9f8f7",
  },
  {
    title: "IT support",
    category: "it-support",
    Icon: MonitorCog,
    tint: "#5c5ce9",
    soft: "#eeeeff",
  },
  {
    title: "Home help",
    category: "home-help",
    Icon: HouseHeart,
    tint: "#f44952",
    soft: "#fff0f1",
  },
  {
    title: "Tutoring",
    category: "tutoring",
    Icon: GraduationCap,
    tint: "#1a9bd7",
    soft: "#eaf7fd",
  },
];

const discoveryServices = [
  {
    title: "Home cleaning",
    body: "Regular or deep cleaning",
    category: "cleaning",
  },
  {
    title: "Furniture help",
    body: "Assembly and small repairs",
    category: "handyman",
  },
  {
    title: "Moving support",
    body: "Local moves and heavy lifting",
    category: "moving",
  },
  {
    title: "Painting",
    body: "Rooms, touch-ups and finishes",
    category: "painting",
  },
];

const searchableServices = Array.from(
  new Map(
    [...categoryItems, ...discoveryServices].map((item) => [
      item.title.toLowerCase(),
      {
        title: item.title,
        category: item.category === "painting" ? "handyman" : item.category,
        body: "body" in item ? item.body : `${item.title} services`,
      },
    ]),
  ).values(),
);

function ServiceIcon({
  item,
  onPress,
}: {
  item: (typeof categoryItems)[number];
  onPress: () => void;
}) {
  const { colors, isDark } = useAppTheme();
  const { Icon } = item;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={onPress}
      style={({ pressed }) => [styles.serviceIcon, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.serviceIconBox,
          {
            backgroundColor: isDark ? `${item.tint}18` : item.soft,
            borderColor: isDark ? `${item.tint}38` : "transparent",
          },
        ]}
      >
        <Icon color={item.tint} size={23} strokeWidth={2.15} />
      </View>
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        style={[styles.serviceIconLabel, { color: colors.ink }]}
      >
        {item.title}
      </Text>
    </Pressable>
  );
}

function HomeSectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.homeSectionHeader}>
      <Text style={[styles.homeSectionTitle, { color: colors.ink }]}>
        {title}
      </Text>
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text style={[styles.homeSectionAction, { color: colors.brand }]}>
          {action}
        </Text>
      </Pressable>
    </View>
  );
}

function ProviderStat({
  label,
  value,
  Icon,
  tint,
}: {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  tint: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.providerStat,
        { backgroundColor: colors.surface, borderColor: colors.line },
      ]}
    >
      <View style={[styles.providerStatIcon, { backgroundColor: `${tint}18` }]}>
        <Icon color={tint} size={17} />
      </View>
      <Text style={[styles.providerStatValue, { color: colors.ink }]}>
        {value}
      </Text>
      <Text style={[styles.providerStatLabel, { color: colors.muted }]}>
        {label}
      </Text>
    </View>
  );
}

function ProviderModeCard({
  title,
  body,
  Icon,
  tint,
  onPress,
}: {
  title: string;
  body: string;
  Icon: LucideIcon;
  tint: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeCard,
        { backgroundColor: colors.surface, borderColor: colors.line },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.modeTop}>
        <View style={[styles.modeIcon, { backgroundColor: `${tint}18` }]}>
          <Icon color={tint} size={17} />
        </View>
        <Text numberOfLines={1} style={[styles.modeTitle, { color: colors.ink }]}>
          {title}
        </Text>
      </View>
      <Text numberOfLines={1} style={[styles.modeBody, { color: colors.muted }]}>
        {body}
      </Text>
    </Pressable>
  );
}

function ProviderActionCard({
  title,
  body,
  Icon,
  tint,
  onPress,
}: {
  title: string;
  body: string;
  Icon: LucideIcon;
  tint: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.growthCard,
        { backgroundColor: colors.surface, borderColor: colors.line },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.growthIcon, { backgroundColor: `${tint}18` }]}>
        <Icon color={tint} size={18} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.growthTitle, { color: colors.ink }]}>
          {title}
        </Text>
        <Text style={[styles.growthBody, { color: colors.muted }]}>
          {body}
        </Text>
      </View>
      <ArrowRight color={colors.subtle} size={16} />
    </Pressable>
  );
}

export function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { copy, content } = useAppContent();
  const provider = isProviderRole(user?.role);
  const [serviceSearch, setServiceSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const name = user?.displayName?.split(" ")[0] || "there";
  const serviceSuggestions = useMemo(() => {
    const needle = serviceSearch.trim().toLowerCase();
    if (!needle) return searchableServices.slice(0, 6);
    return searchableServices
      .filter((item) => `${item.title} ${item.body} ${item.category}`.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [serviceSearch]);
  const openServiceRequest = (category: string, customQuery = "") => {
    setSearchFocused(false);
    router.push({
      pathname: "/request/new",
      params: {
        category,
        ...(customQuery ? { custom_query: customQuery } : {}),
        requestKey: String(Date.now()),
      },
    });
  };
  const submitHeroSearch = () => {
    const query = serviceSearch.trim();
    const first = serviceSuggestions[0];
    if (query && first) {
      openServiceRequest(first.category);
      return;
    }
    openServiceRequest(query ? "custom" : "", query);
  };
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: () => api<{ providers: ProviderCardData[] }>("/api/providers"),
    enabled: !provider,
    staleTime: 300_000,
  });
  const jobs = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api<any>("/api/jobs"),
    enabled: provider,
    staleTime: 45_000,
  });
  const requests = useQuery({
    queryKey: ["requests"],
    queryFn: () => api<any>("/api/dashboard/request-summaries"),
    enabled: Boolean(user) && !provider,
    staleTime: 60_000,
  });

  if (provider) {
    const providerJobs = jobs.data?.jobs || [];
    const liveJobs = providerJobs.slice(0, 3);
    const quotedJobs = providerJobs.filter((job: any) => job.my_bid).length;
    const freshJobs = providerJobs.filter((job: any) => !job.my_bid).length;
    const anyJobSelectCount = providerJobs.filter(
      (job: any) => job.anyjob_select,
    ).length;
    const totalOffers = providerJobs.reduce(
      (sum: number, job: any) => sum + Number(job.bid_count || 0),
      0,
    );
    return (
      <Screen>
        <AppHeader />
        <View style={styles.welcome}>
          <Text style={[styles.eyebrow, { color: colors.brand }]}>
            GOOD TO SEE YOU, {name.toUpperCase()}
          </Text>
          <Text style={[styles.pageTitle, { color: colors.ink }]}>
            Your next job is nearby.
          </Text>
          <Text style={[styles.pageBody, { color: colors.muted }]}>
            Quote for local service work or pick up a scheduled business shift.
          </Text>
        </View>
        <View style={[styles.providerHero, { backgroundColor: colors.ink }]}>
          <Image
            source={serviceCover("handyman")}
            alt=""
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.providerHeroCopy}>
            <Text style={styles.providerHeroKicker}>LIVE OPPORTUNITIES</Text>
            <Text style={styles.providerHeroTitle}>
              {jobs.isLoading
                ? "Finding work…"
                : `${jobs.data?.jobs?.length || 0} jobs ready to quote`}
            </Text>
            <Button
              title="Browse live jobs"
              icon={<Search color="white" size={18} />}
              onPress={() => router.push("/(app)/explore")}
            />
          </View>
        </View>
        <View style={styles.quickGrid}>
          <Pressable
            onPress={() => router.push("/provider/pending")}
            style={[
              styles.quickCard,
              { backgroundColor: colors.surface, borderColor: colors.line },
            ]}
          >
            <CalendarCheck color={colors.brand} size={23} />
            <Text style={[styles.quickTitle, { color: colors.ink }]}>
              Active work
            </Text>
            <Text style={[styles.quickMeta, { color: colors.muted }]}>
              Quotes and bookings
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/earnings")}
            style={[
              styles.quickCard,
              { backgroundColor: colors.surface, borderColor: colors.line },
            ]}
          >
            <CircleDollarSign color={colors.success} size={23} />
            <Text style={[styles.quickTitle, { color: colors.ink }]}>
              Earnings
            </Text>
            <Text style={[styles.quickMeta, { color: colors.muted }]}>
              Balance and payouts
            </Text>
          </Pressable>
        </View>
        <SectionHeader title="Today at a glance" />
        <View style={styles.providerStatsGrid}>
          <ProviderStat
            label="Live jobs"
            value={jobs.isLoading ? "..." : providerJobs.length}
            Icon={Search}
            tint={colors.brand}
          />
          <ProviderStat
            label="New to quote"
            value={jobs.isLoading ? "..." : freshJobs}
            Icon={Gavel}
            tint={colors.info}
          />
          <ProviderStat
            label="Your offers"
            value={jobs.isLoading ? "..." : quotedJobs}
            Icon={Send}
            tint={colors.success}
          />
          <ProviderStat
            label="Market offers"
            value={jobs.isLoading ? "..." : totalOffers}
            Icon={UsersRound}
            tint={colors.warning}
          />
        </View>
        <SectionHeader title="Work modes" />
        <View style={styles.modeGrid}>
          <ProviderModeCard
            title="Service requests"
            body={`${freshJobs} need quotes`}
            Icon={Gavel}
            tint={colors.brand}
            onPress={() => router.push("/(app)/explore")}
          />
          <ProviderModeCard
            title="Business shifts"
            body="Shift posts"
            Icon={CalendarDays}
            tint={colors.warning}
            onPress={() => router.push("/shifts")}
          />
          <ProviderModeCard
            title="AnyJob Select"
            body={`${anyJobSelectCount} selected`}
            Icon={ShieldCheck}
            tint={colors.success}
            onPress={() => router.push("/(app)/explore")}
          />
        </View>
        {liveJobs.length ? (
          <>
            <SectionHeader
              title="Recommended for you"
              action={
                <Pressable onPress={() => router.push("/(app)/explore")}>
                  <Text style={[styles.link, { color: colors.brand }]}>
                    See all
                  </Text>
                </Pressable>
              }
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontal}
            >
              {liveJobs.map((job: any) => (
                <Pressable
                  key={job.id}
                  onPress={() => router.push(`/jobs/${job.id}`)}
                  style={[
                    styles.jobMini,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.line,
                    },
                  ]}
                >
                  <Image
                    source={
                      job.work_images?.[0]?.image_url
                        ? { uri: job.work_images[0].image_url }
                        : serviceCover(job.category_slug)
                    }
                    alt=""
                    contentFit="cover"
                    style={styles.jobImage}
                  />
                  <View style={styles.jobMiniBody}>
                    <Text
                      numberOfLines={2}
                      style={[styles.jobMiniTitle, { color: colors.ink }]}
                    >
                      {
                        String(job.job_description || "Local service job")
                          .replace(/^Title:\s*/i, "")
                          .split("\n")[0]
                      }
                    </Text>
                    <Text style={[styles.jobMiniMeta, { color: colors.muted }]}>
                      {job.coarse_location_label || job.city || "Nearby"} · €
                      {job.budget_range_min || 0}–
                      {job.budget_range_max || "Open"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}
        <SectionHeader title="Quote pipeline" />
        <View
          style={[
            styles.pipelineCard,
            { backgroundColor: colors.surface, borderColor: colors.line },
          ]}
        >
          {[
            ["Browse", `${providerJobs.length}`],
            ["Quote", `${freshJobs}`],
            ["Booked", "Track"],
            ["Done", "Review"],
          ].map(([title, body], index) => (
            <View key={title} style={styles.pipelineStep}>
              <View
                style={[
                  styles.pipelineDot,
                  {
                    backgroundColor:
                      index <= 1 ? colors.brand : colors.softStrong,
                  },
                ]}
              />
              <Text style={[styles.pipelineTitle, { color: colors.ink }]}>
                {title}
              </Text>
              <Text style={[styles.pipelineBody, { color: colors.muted }]}>
                {body}
              </Text>
            </View>
          ))}
        </View>
        <SectionHeader title="Grow your profile" />
        <View style={styles.growthGrid}>
          <ProviderActionCard
            title="Verification"
            body="Keep KYC, insurance, and ID docs current"
            Icon={FileCheck2}
            tint={colors.success}
            onPress={() => router.push("/provider/verification")}
          />
          <ProviderActionCard
            title="Reviews"
            body="Track ratings received from buyers and businesses"
            Icon={Star}
            tint={colors.warning}
            onPress={() => router.push("/reviews")}
          />
          <ProviderActionCard
            title="Analytics"
            body="Response rate, completions, and profile performance"
            Icon={MonitorCog}
            tint={colors.info}
            onPress={() => router.push("/provider/analytics")}
          />
          <ProviderActionCard
            title="Plans"
            body="Check quote allowance and marketplace plan status"
            Icon={ShieldAlert}
            tint={colors.brand}
            onPress={() => router.push("/plans")}
          />
        </View>
        <SectionHeader title="Provider tools" />
        <ListGroup>
          <RowLink
            title="Live job board"
            subtitle="Browse and quote approved service jobs"
            icon={<Search color={colors.ink} size={20} />}
            onPress={() => router.push("/(app)/explore")}
          />
          <RowLink
            title="Business shifts"
            subtitle="Apply for scheduled shift work"
            icon={<CalendarDays color={colors.ink} size={20} />}
            onPress={() => router.push("/shifts")}
          />
          <RowLink
            title="Services"
            subtitle="Manage what buyers can book"
            icon={<Store color={colors.ink} size={20} />}
            onPress={() => router.push("/services")}
          />
          <RowLink
            title="Completed"
            subtitle="Finished jobs, shifts, and review prompts"
            icon={<CheckCircle2 color={colors.ink} size={20} />}
            onPress={() => router.push("/provider/completed")}
          />
          <RowLink
            title="Inbox"
            subtitle="Messages, quote replies, and booking chats"
            icon={<MessageCircle color={colors.ink} size={20} />}
            onPress={() => router.push("/(app)/inbox")}
          />
          <RowLink
            title="Milestones"
            subtitle="Track levels and badge progress"
            icon={<Award color={colors.ink} size={20} />}
            onPress={() => router.push("/milestones")}
          />
        </ListGroup>
      </Screen>
    );
  }

  const featured = (providers.data?.providers || [])
    .filter((item) => item.heroImage || item.image || item.rating)
    .slice(0, 6);
  const buyerRequests =
    requests.data?.requests || requests.data?.inquiries || [];
  const recentRequest = buyerRequests[0];
  const recentTitle = recentRequest
    ? String(
        recentRequest.title ||
          recentRequest.job_description ||
          "Service request",
      )
        .replace(/^Title:\s*/i, "")
        .split("\n")[0]
    : "";
  const recentQuotes = Number(
    recentRequest?.quotes?.total ?? recentRequest?.bid_count ?? 0,
  );
  const recentStatus = String(recentRequest?.status || "pending").replaceAll(
    "_",
    " ",
  );
  return (
    <Screen>
      <AppHeader />
      <View
        style={[
          styles.hero,
          { backgroundColor: isDark ? "#24222d" : "#f1edff" },
        ]}
      >
        <View style={styles.heroImageWrap}>
          <Image
            source={content["home.hero.image_url"] ? { uri: content["home.hero.image_url"] } : serviceCover("handyman")}
            alt="Professional helping with a home task"
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroKicker, { color: colors.brand }]}>
            {copy("home.hero.kicker", "ANYJOB")}
          </Text>
          <Text
            numberOfLines={3}
            adjustsFontSizeToFit
            minimumFontScale={0.76}
            style={[styles.heroTitle, { color: colors.ink }]}
          >
            {copy("home.hero.title", "Get things done, your way.")}
          </Text>
          <Text style={[styles.heroBody, { color: colors.muted }]}>
            {copy("home.hero.body", "Trusted help for everyday tasks.")}
          </Text>
        </View>
        <View
          style={[
            styles.heroSearch,
            { backgroundColor: colors.surface, borderColor: colors.line },
          ]}
        >
          <Search color={colors.muted} size={19} />
          <TextInput
            accessibilityLabel="What do you need help with?"
            value={serviceSearch}
            onChangeText={setServiceSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
            onSubmitEditing={submitHeroSearch}
            placeholder={copy("home.hero.search", "What do you need help with?")}
            placeholderTextColor={colors.muted}
            returnKeyType="go"
            style={[styles.heroSearchText, { color: colors.ink }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Post a job"
            onPress={submitHeroSearch}
            style={({ pressed }) => [
              styles.heroPostButton,
              { backgroundColor: colors.brand },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.heroPostButtonText}>Post a job</Text>
          </Pressable>
        </View>
      </View>
      {searchFocused ? (
        <View style={[styles.searchSuggestions, { backgroundColor: colors.surface, borderColor: colors.line }] }>
          {serviceSuggestions.length ? serviceSuggestions.map((item) => (
            <Pressable
              key={`${item.category}-${item.title}`}
              accessibilityRole="button"
              onPress={() => openServiceRequest(item.category)}
              style={({ pressed }) => [styles.searchSuggestion, pressed && styles.pressed]}
            >
              <Search color={colors.brand} size={16} />
              <View style={styles.searchSuggestionCopy}>
                <Text style={[styles.searchSuggestionTitle, { color: colors.ink }]}>{item.title}</Text>
                <Text numberOfLines={1} style={[styles.searchSuggestionBody, { color: colors.muted }]}>{item.body}</Text>
              </View>
              <ArrowRight color={colors.subtle} size={16} />
            </Pressable>
          )) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => openServiceRequest("custom", serviceSearch.trim())}
              style={({ pressed }) => [styles.customSuggestion, { backgroundColor: colors.brand }, pressed && styles.pressed]}
            >
              <PlusCircle color="white" size={18} />
              <View style={styles.searchSuggestionCopy}>
                <Text style={styles.customSuggestionTitle}>Create a custom job</Text>
                <Text numberOfLines={1} style={styles.customSuggestionBody}>{serviceSearch.trim()}</Text>
              </View>
              <ArrowRight color="white" size={16} />
            </Pressable>
          )}
        </View>
      ) : null}
      <HomeSectionHeader
        title={copy("home.services.title", "Popular services")}
        action="View all"
        onPress={() => router.push("/(app)/explore")}
      />
      <View style={styles.serviceGrid}>
        {categoryItems.map((item) => (
          <ServiceIcon
            key={item.title}
            item={item}
            onPress={() =>
              router.push({
                pathname: "/request/new",
                params: {
                  category: item.category,
                  requestKey: String(Date.now()),
                },
              })
            }
          />
        ))}
      </View>
      <HomeSectionHeader
        title={copy("home.nearby.title", "Popular near you")}
        action="Explore"
        onPress={() => router.push("/(app)/explore")}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontal}
      >
        {discoveryServices.map((item) => (
          <Pressable
            key={item.category}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/request/new",
                params: {
                  category: item.category,
                  requestKey: String(Date.now()),
                },
              })
            }
            style={({ pressed }) => [
              styles.discoveryCard,
              { backgroundColor: colors.surface, borderColor: colors.line },
              pressed && styles.pressed,
            ]}
          >
            <Image
              source={serviceCover(item.category)}
              alt=""
              contentFit="cover"
              style={styles.discoveryImage}
            />
            <View style={styles.discoveryBody}>
              <Text
                numberOfLines={1}
                style={[styles.discoveryTitle, { color: colors.ink }]}
              >
                {item.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.discoveryCopy, { color: colors.muted }]}
              >
                {item.body}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <View
        style={[
          styles.howCard,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <Text style={[styles.howHeading, { color: colors.ink }]}>
          How it works
        </Text>
        <View style={styles.howSteps}>
          {[
            [Search, "Choose a task", "Tell us what you need", "#21a66f"],
            [CalendarDays, "Pick a time", "Choose what works", "#7d5ce7"],
            [UsersRound, "Get matched", "Compare local pros", "#2f88df"],
            [CheckCircle2, "Task complete", "Pay and review", "#ed9a18"],
          ].map(([StepIcon, title, body, tint], index) => {
            const Icon = StepIcon as LucideIcon;
            return (
              <View key={String(title)} style={styles.howStep}>
                <View
                  style={[
                    styles.howIcon,
                    { backgroundColor: `${String(tint)}18` },
                  ]}
                >
                  <Icon color={String(tint)} size={20} strokeWidth={2.2} />
                </View>
                <Text style={[styles.howTitle, { color: colors.ink }]}>
                  {index + 1}. {String(title)}
                </Text>
                <Text style={[styles.howBody, { color: colors.muted }]}>
                  {String(body)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <HomeSectionHeader
        title={copy("home.activity.title", "Your activity")}
        action="See tasks"
        onPress={() => router.push("/(app)/work")}
      />
      {recentRequest ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/requests/${recentRequest.id}`)}
          style={({ pressed }) => [
            styles.activityCard,
            { backgroundColor: colors.surface, borderColor: colors.line },
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.activityIcon,
              { backgroundColor: `${colors.success}18` },
            ]}
          >
            <ClipboardList color={colors.success} size={21} />
          </View>
          <View style={styles.activityCopy}>
            <View style={styles.activityTopline}>
              <Text
                numberOfLines={1}
                style={[styles.activityTitle, { color: colors.ink }]}
              >
                {recentTitle}
              </Text>
              <View
                style={[
                  styles.activityStatus,
                  { backgroundColor: colors.successSoft },
                ]}
              >
                <Text
                  style={[styles.activityStatusText, { color: colors.success }]}
                >
                  {recentStatus}
                </Text>
              </View>
            </View>
            <Text style={[styles.activityMeta, { color: colors.muted }]}>
              {recentRequest.city || "Ireland"} · {recentQuotes} quote
              {recentQuotes === 1 ? "" : "s"}
            </Text>
          </View>
          <ArrowRight color={colors.subtle} size={18} />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push("/(app)/work")}
          style={[
            styles.tasksShortcut,
            { backgroundColor: colors.surface, borderColor: colors.line },
          ]}
        >
          <View style={[styles.tasksIcon, { backgroundColor: colors.soft }]}>
            <ClipboardList color={colors.brand} size={22} />
          </View>
          <View style={styles.tasksCopy}>
            <Text style={[styles.tasksTitle, { color: colors.ink }]}>
              Your tasks
            </Text>
            <Text style={[styles.tasksBody, { color: colors.muted }]}>
              Compare quotes and track active work
            </Text>
          </View>
          <ArrowRight color={colors.muted} size={20} />
        </Pressable>
      )}
      <HomeSectionHeader
        title={copy("home.providers.title", "Recommended taskers")}
        action="See all"
        onPress={() => router.push("/(app)/explore")}
      />
      {featured.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontal}
        >
          {featured.map((item) => (
            <ProviderCard
              key={item.id}
              provider={item}
              compact
              onPress={() => router.push(`/provider/${item.id}`)}
            />
          ))}
        </ScrollView>
      ) : (
        <Text style={[styles.pageBody, { color: colors.muted }]}>
          Loading trusted local providers…
        </Text>
      )}
      <HomeSectionHeader
        title={copy("home.trust.title", "Book with confidence")}
        action="Support"
        onPress={() => router.push("/support")}
      />
      <View
        style={[
          styles.trustBand,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        {[
          [BadgeCheck, "Approved pros", "Profiles reviewed"],
          [ShieldCheck, "Secure booking", "Clear job records"],
          [MessageCircle, "Stay connected", "Message in the app"],
        ].map(([TrustIcon, title, body]) => {
          const Icon = TrustIcon as LucideIcon;
          return (
            <View key={String(title)} style={styles.trustItem}>
              <View
                style={[styles.trustIcon, { backgroundColor: colors.soft }]}
              >
                <Icon color={colors.brand} size={19} />
              </View>
              <Text style={[styles.trustTitle, { color: colors.ink }]}>
                {String(title)}
              </Text>
              <Text style={[styles.trustBody, { color: colors.muted }]}>
                {String(body)}
              </Text>
            </View>
          );
        })}
      </View>
      <View
        style={[
          styles.startBand,
          { backgroundColor: isDark ? colors.elevated : "#132a24" },
        ]}
      >
        <View style={styles.startCopy}>
          <Text style={styles.startTitle}>{copy("home.cta.title", "Ready to get it sorted?")}</Text>
          <Text style={styles.startBody}>
            {copy("home.cta.body", "Post once and compare local quotes.")}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post a task"
          onPress={() =>
            router.push({
              pathname: "/request/new",
              params: { requestKey: String(Date.now()) },
            })
          }
          style={[styles.startButton, { backgroundColor: colors.brand }]}
        >
          <ArrowRight color="white" size={20} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  welcome: { gap: 4 },
  eyebrow: { fontSize: 11, fontWeight: "900" },
  pageTitle: { fontSize: 30, lineHeight: 35, fontWeight: "900" },
  pageBody: { fontSize: 15, lineHeight: 21 },
  hero: {
    minHeight: 226,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "transparent",
  },
  heroImageWrap: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "51%",
    height: 158,
    borderBottomLeftRadius: 32,
    overflow: "hidden",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,.42)",
  },
  heroCopy: {
    width: "49%",
    height: 158,
    paddingTop: 18,
    paddingLeft: 16,
    paddingRight: 10,
    gap: 5,
  },
  heroKicker: { fontSize: 8, lineHeight: 10, fontWeight: "900" },
  heroTitle: {
    maxHeight: 72,
    fontSize: 21,
    lineHeight: 24,
    fontWeight: "900",
  },
  heroBody: { fontSize: 10, lineHeight: 14 },
  heroSearch: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
    minHeight: 43,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  heroSearchText: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: "700", paddingVertical: 0 },
  heroPostButton: {
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPostButtonText: { color: "white", fontSize: 10.5, fontWeight: "900" },
  searchSuggestions: { marginTop: -5, borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  searchSuggestion: { minHeight: 53, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  searchSuggestionCopy: { flex: 1, minWidth: 0 },
  searchSuggestionTitle: { fontSize: 13, fontWeight: "900" },
  searchSuggestionBody: { marginTop: 2, fontSize: 10.5 },
  customSuggestion: { minHeight: 58, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  customSuggestionTitle: { color: "white", fontSize: 13, fontWeight: "900" },
  customSuggestionBody: { marginTop: 2, color: "rgba(255,255,255,.78)", fontSize: 10.5 },
  horizontal: { gap: 9, paddingRight: 18, paddingBottom: 4 },
  discoveryCard: {
    width: 156,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  discoveryImage: { width: "100%", height: 88 },
  discoveryBody: { padding: 10, gap: 3 },
  discoveryTitle: { fontSize: 13, lineHeight: 17, fontWeight: "900" },
  discoveryCopy: { fontSize: 10, lineHeight: 14 },
  homeSectionHeader: {
    minHeight: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  homeSectionTitle: { fontSize: 16, lineHeight: 20, fontWeight: "900" },
  homeSectionAction: { fontSize: 11, lineHeight: 16, fontWeight: "900" },
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 11 },
  serviceIcon: { width: "20%", minHeight: 68, alignItems: "center", gap: 5 },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceIconLabel: {
    width: "100%",
    minHeight: 24,
    paddingHorizontal: 1,
    textAlign: "center",
    fontSize: 8.25,
    lineHeight: 11,
    fontWeight: "800",
  },
  howCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
    gap: 10,
  },
  howHeading: { fontSize: 15, lineHeight: 19, fontWeight: "900" },
  howSteps: { flexDirection: "row", justifyContent: "space-between", gap: 3 },
  howStep: { flex: 1, alignItems: "center", gap: 4 },
  howIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  howTitle: {
    minHeight: 24,
    fontSize: 8.25,
    lineHeight: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  howBody: { fontSize: 7.5, lineHeight: 10, textAlign: "center" },
  activityCard: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  activityCopy: { flex: 1, minWidth: 0, gap: 5 },
  activityTopline: { flexDirection: "row", alignItems: "center", gap: 7 },
  activityTitle: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: "900" },
  activityStatus: {
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  activityStatusText: {
    fontSize: 8.5,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  activityMeta: { fontSize: 10.5, lineHeight: 14 },
  tasksShortcut: {
    minHeight: 82,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  tasksIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tasksCopy: { flex: 1, gap: 3 },
  tasksTitle: { fontSize: 16, fontWeight: "900" },
  tasksBody: { fontSize: 12, lineHeight: 17 },
  trustBand: {
    minHeight: 124,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
    flexDirection: "row",
    gap: 6,
  },
  trustItem: { flex: 1, alignItems: "center", gap: 5 },
  trustIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  trustTitle: {
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  trustBody: { fontSize: 8, lineHeight: 11, textAlign: "center" },
  startBand: {
    minHeight: 92,
    borderRadius: radius.lg,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  startCopy: { flex: 1, gap: 4 },
  startTitle: {
    color: "white",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
  },
  startBody: { color: "#c9cdd1", fontSize: 10.5, lineHeight: 15 },
  startButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  providerHero: {
    minHeight: 240,
    borderRadius: radius.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  providerHeroCopy: { padding: 18, gap: 10 },
  providerHeroKicker: { color: "#ffadb2", fontSize: 11, fontWeight: "900" },
  providerHeroTitle: {
    color: "white",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
  },
  quickGrid: { flexDirection: "row", gap: 10 },
  quickCard: {
    flex: 1,
    minHeight: 112,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    gap: 7,
  },
  quickTitle: { fontSize: 16, fontWeight: "900" },
  quickMeta: { fontSize: 12 },
  providerStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  providerStat: {
    width: "47.8%",
    minHeight: 78,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    gap: 4,
  },
  providerStatIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  providerStatValue: { fontSize: 20, lineHeight: 23, fontWeight: "900" },
  providerStatLabel: { fontSize: 10.5, lineHeight: 13, fontWeight: "800" },
  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modeCard: {
    width: "47.8%",
    minHeight: 72,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    gap: 6,
  },
  modeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  modeTitle: { flex: 1, fontSize: 13, lineHeight: 17, fontWeight: "900" },
  modeBody: { fontSize: 11, lineHeight: 14 },
  jobMini: {
    width: 260,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  jobImage: { height: 118, width: "100%" },
  jobMiniBody: { padding: 12, gap: 6 },
  jobMiniTitle: {
    minHeight: 42,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  jobMiniMeta: { fontSize: 12, lineHeight: 17 },
  link: { fontSize: 13, fontWeight: "900" },
  pipelineCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    flexDirection: "row",
    gap: 5,
  },
  pipelineStep: { flex: 1, alignItems: "center", gap: 3 },
  pipelineDot: { width: 12, height: 12, borderRadius: 6 },
  pipelineTitle: { fontSize: 11, lineHeight: 14, fontWeight: "900" },
  pipelineBody: { fontSize: 10, lineHeight: 12, textAlign: "center" },
  growthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  growthCard: {
    width: "47.8%",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    minHeight: 84,
    gap: 6,
  },
  growthIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  growthTitle: { fontSize: 12.5, lineHeight: 16, fontWeight: "900" },
  growthBody: { fontSize: 10.5, lineHeight: 13 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
