import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Filter,
  Gavel,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react-native";
import { cloneElement, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppHeader } from "@/components/app-header";
import {
  ProviderCard,
  type ProviderCardData,
} from "@/components/provider-card";
import {
  EmptyState,
  ErrorState,
  Button,
  Card,
  LoadingState,
  Pill,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { useAppContent } from "@/lib/content";
import { isProviderRole, useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { radius } from "@/theme/tokens";
import type { Job } from "@/types/domain";

const categoryNames: Record<string, string> = {
  menage: "Cleaning",
  bricolage: "Handyman",
  jardinage: "Gardening",
  demenagement: "Moving",
  enfants: "Childcare",
  animaux: "Pet care",
  informatique: "IT support",
  "aide-domicile": "Home help",
  "cours-particuliers": "Tutoring",
  hiver: "Winter services",
  custom: "Custom job request",
};

const workTypeLabels: Record<string, string> = {
  day_wage: "Day wage",
  long_duration_shift: "Long shift",
  urgent_shift: "Urgent",
  recurring_shift: "Recurring",
};

function jobCopy(row: Record<string, unknown>) {
  const raw = String(row.job_description || "").trim();
  const blocks = raw
    .split(/\n\s*\n/)
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    title: String(
      row.title || row.service_name || blocks[0] || "Service request",
    ).replace(/^Title:\s*/i, ""),
    description: String(
      row.description ||
        (blocks.length > 1
          ? blocks.slice(1).join("\n\n")
          : "Open service request"),
    ),
  };
}
function budgetLabel(row: Job) {
  const budget = row.budget as { min?: number; max?: number } | undefined;
  const min = Number(
    row.budget_min || row.budget_range_min || budget?.min || 0,
  );
  const max = Number(
    row.budget_max || row.budget_range_max || budget?.max || 0,
  );
  if (!min && !max) return "Quote required";
  return min && max && min !== max ? `€${min}–${max}` : `€${max || min}`;
}

function dateLabel(value?: unknown) {
  if (!value) return "Flexible date";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function providerTrustBadges(row: any) {
  return (row.buyerTrust?.badges || []).slice(0, 3) as Array<{ label: string }>;
}

function hourlyRate(row: any) {
  return Number(row.business_preferred_hourly_rate || 0);
}

function dayRate(row: any) {
  return Number(row.business_preferred_day_rate || 0);
}

export default function ExploreScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { copy } = useAppContent();
  const provider = isProviderRole(user?.role);
  const [search, setSearch] = useState("");
  const [boardMode, setBoardMode] = useState<"day" | "shift">("day");
  const [shiftNiche, setShiftNiche] = useState("all");
  const [shiftType, setShiftType] = useState("all");
  const [shiftState, setShiftState] = useState("all");
  const [shiftRate, setShiftRate] = useState("all");
  const [showBuyerFilters, setShowBuyerFilters] = useState(false);
  const [buyerCategory, setBuyerCategory] = useState("all");
  const [buyerAreaOnly, setBuyerAreaOnly] = useState(false);
  const [buyerShiftOnly, setBuyerShiftOnly] = useState(false);
  const [buyerSort, setBuyerSort] = useState<"recommended" | "rate" | "rating">("recommended");
  const query = useQuery({
    queryKey: [provider ? "jobs" : "providers"],
    queryFn: () => api<any>(provider ? "/api/jobs" : "/api/providers"),
    staleTime: provider ? 45_000 : 300_000,
  });
  const shifts = useQuery({
    queryKey: ["shifts"],
    queryFn: () => api<any>("/api/shifts"),
    enabled: provider,
    staleTime: 45_000,
  });
  const applyShift = useMutation({
    mutationFn: (job: any) =>
      api("/api/shifts/apply", {
        method: "POST",
        ...jsonBody({
          postId: job.id,
          proposedHourlyRate: job.business_preferred_hourly_rate,
          proposedDayRate: job.business_preferred_day_rate,
          message: "I am available and interested in this AnyJob shift.",
        }),
      }),
    onSuccess: () => {
      void shifts.refetch();
      Alert.alert("Application sent", "The business can now review your application.");
    },
    onError: (error: Error) => Alert.alert("Could not apply", error.message),
  });
  const rows = useMemo(() => {
    const source = provider
      ? ((query.data?.jobs || []) as Job[])
      : ((query.data?.providers || []) as ProviderCardData[]);
    const needle = search.trim().toLowerCase();
    const searched = needle
      ? source.filter((row) => JSON.stringify(row).toLowerCase().includes(needle))
      : source;
    if (provider) return searched;
    const filtered = (searched as ProviderCardData[]).filter((row) => {
      if (buyerCategory !== "all" && row.category !== buyerCategory) return false;
      if (buyerAreaOnly && row.worksInViewerArea !== true) return false;
      if (buyerShiftOnly && row.availableForShifts !== true) return false;
      return true;
    });
    if (buyerSort === "rate") {
      return [...filtered].sort((a, b) => {
        const left = Number(a.rate || Number.MAX_SAFE_INTEGER);
        const right = Number(b.rate || Number.MAX_SAFE_INTEGER);
        return left - right;
      });
    }
    if (buyerSort === "rating") {
      return [...filtered].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }
    return filtered;
  }, [buyerAreaOnly, buyerCategory, buyerShiftOnly, buyerSort, provider, query.data, search]);
  const buyerCategories = useMemo(
    () => Array.from(new Set(
      ((query.data?.providers || []) as ProviderCardData[])
        .map((row) => row.category || "")
        .filter(Boolean),
    )).sort(),
    [query.data?.providers],
  );
  const buyerFilterCount =
    (buyerCategory !== "all" ? 1 : 0) +
    (buyerAreaOnly ? 1 : 0) +
    (buyerShiftOnly ? 1 : 0) +
    (buyerSort !== "recommended" ? 1 : 0);
  const shiftRows: any[] = useMemo(
    () => shifts.data?.jobs || [],
    [shifts.data?.jobs],
  );
  const workerNiches: string[] = Array.isArray(shifts.data?.workerProfile?.niches)
    ? shifts.data.workerProfile.niches.map(String).filter(Boolean)
    : [];
  const shiftTypes = Array.from(
    new Set(shiftRows.map((row: any) => String(row.work_type || "")).filter(Boolean)),
  );
  const visibleShifts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return shiftRows.filter((row: any) => {
      const application = row.myApplication;
      const text = [
        row.role_title,
        row.description,
        row.city,
        row.niche,
        row.work_type,
        row.business?.business_name,
      ].filter(Boolean).join(" ").toLowerCase();
      if (needle && !text.includes(needle)) return false;
      if (shiftNiche !== "all" && String(row.niche || "") !== shiftNiche) return false;
      if (shiftType !== "all" && String(row.work_type || "") !== shiftType) return false;
      if (shiftState === "open" && application) return false;
      if (shiftState === "applied" && !application) return false;
      if (shiftRate !== "all" && hourlyRate(row) < Number(shiftRate)) return false;
      return true;
    });
  }, [search, shiftNiche, shiftRate, shiftRows, shiftState, shiftType]);
  return (
    <Screen>
      <AppHeader compact />
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.ink }]}>
          {provider ? copy("explore.provider.title", "Find work") : copy("explore.buyer.title", "Discover local pros")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {provider
            ? copy("explore.provider.subtitle", "Approved jobs with approximate buyer areas.")
            : copy("explore.buyer.subtitle", "Portfolio work, verified reviews and clear pricing.")}
        </Text>
      </View>
      {provider ? (
        <View style={styles.boardSwitch}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Day jobs"
            onPress={() => setBoardMode("day")}
            style={[
              styles.boardSwitchItem,
              {
                backgroundColor:
                  boardMode === "day" ? colors.brand : colors.surface,
                borderColor: boardMode === "day" ? colors.brand : colors.line,
              },
            ]}
          >
            <Gavel color={boardMode === "day" ? "white" : colors.muted} size={17} />
            <Text
              style={[
                styles.boardSwitchText,
                { color: boardMode === "day" ? "white" : colors.muted },
              ]}
            >
              Day jobs
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Work shifts"
            onPress={() => setBoardMode("shift")}
            style={[
              styles.boardSwitchItem,
              {
                backgroundColor:
                  boardMode === "shift" ? colors.brand : colors.surface,
                borderColor: boardMode === "shift" ? colors.brand : colors.line,
              },
            ]}
          >
            <BriefcaseBusiness
              color={boardMode === "shift" ? "white" : colors.muted}
              size={17}
            />
            <Text
              style={[
                styles.boardSwitchText,
                { color: boardMode === "shift" ? "white" : colors.muted },
              ]}
            >
              Work shifts
            </Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.searchLine}>
        <View
          style={[
            styles.search,
            { backgroundColor: colors.surface, borderColor: colors.line },
          ]}
        >
          <Search color={colors.muted} size={20} />
          <TextInput
            accessibilityLabel={provider ? "Search jobs" : "Search providers"}
            value={search}
            onChangeText={setSearch}
            placeholder={
              provider
                ? boardMode === "shift"
                  ? "Role, business or city"
                  : "Job, category or area"
                : "Service or provider"
            }
            placeholderTextColor={colors.subtle}
            style={[styles.searchInput, { color: colors.ink }]}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filters"
          onPress={() => {
            if (provider) setBoardMode(boardMode === "day" ? "shift" : "day");
            else setShowBuyerFilters((current) => !current);
          }}
          style={[
            styles.filter,
            { backgroundColor: colors.surface, borderColor: colors.line },
          ]}
        >
          <SlidersHorizontal color={colors.ink} size={20} />
          {!provider && buyerFilterCount ? (
            <View style={[styles.filterCount, { backgroundColor: colors.brand }]}>
              <Text style={styles.filterCountText}>{buyerFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      {!provider && showBuyerFilters ? (
        <View style={[styles.buyerFilters, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.shiftFilterHeader}>
            <View style={styles.shiftFilterTitle}>
              <Filter color={colors.brand} size={16} />
              <Text style={[styles.shiftFilterTitleText, { color: colors.ink }]}>Provider filters</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setBuyerCategory("all");
                setBuyerAreaOnly(false);
                setBuyerShiftOnly(false);
                setBuyerSort("recommended");
              }}
            >
              <Text style={[styles.clear, { color: colors.brand }]}>Clear</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            <FilterChip label="All services" selected={buyerCategory === "all"} onPress={() => setBuyerCategory("all")} />
            {buyerCategories.map((category) => (
              <FilterChip key={category} label={category} selected={buyerCategory === category} onPress={() => setBuyerCategory(category)} />
            ))}
          </ScrollView>
          <View style={styles.compactFilters}>
            <FilterChip label="Works in my area" selected={buyerAreaOnly} onPress={() => setBuyerAreaOnly((current) => !current)} />
            <FilterChip label="Available for shifts" selected={buyerShiftOnly} onPress={() => setBuyerShiftOnly((current) => !current)} />
          </View>
          <View style={styles.compactFilters}>
            <FilterChip label="Recommended" selected={buyerSort === "recommended"} onPress={() => setBuyerSort("recommended")} />
            <FilterChip label="Lowest rate" selected={buyerSort === "rate"} onPress={() => setBuyerSort("rate")} />
            <FilterChip label="Top rated" selected={buyerSort === "rating"} onPress={() => setBuyerSort("rating")} />
          </View>
        </View>
      ) : null}
      {provider && boardMode === "shift" ? (
        <View style={styles.shiftFilters}>
          <View style={styles.shiftFilterHeader}>
            <View style={styles.shiftFilterTitle}>
              <Filter color={colors.brand} size={16} />
              <Text style={[styles.shiftFilterTitleText, { color: colors.ink }]}>
                Shift filters
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSearch("");
                setShiftNiche("all");
                setShiftType("all");
                setShiftState("all");
                setShiftRate("all");
              }}
            >
              <Text style={[styles.clear, { color: colors.brand }]}>Clear</Text>
            </Pressable>
          </View>
          {workerNiches.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChips}
            >
              <FilterChip label="All niches" selected={shiftNiche === "all"} onPress={() => setShiftNiche("all")} />
              {workerNiches.map((item) => (
                <FilterChip
                  key={item}
                  label={item.replaceAll("_", " ")}
                  selected={shiftNiche === item}
                  onPress={() => setShiftNiche(item)}
                />
              ))}
            </ScrollView>
          ) : null}
          {shiftTypes.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChips}
            >
              <FilterChip label="All types" selected={shiftType === "all"} onPress={() => setShiftType("all")} />
              {shiftTypes.map((item) => (
                <FilterChip
                  key={item}
                  label={workTypeLabels[item] || item.replaceAll("_", " ")}
                  selected={shiftType === item}
                  onPress={() => setShiftType(item)}
                />
              ))}
            </ScrollView>
          ) : null}
          <View style={styles.compactFilters}>
            <FilterChip label="All" selected={shiftState === "all"} onPress={() => setShiftState("all")} />
            <FilterChip label="Open only" selected={shiftState === "open"} onPress={() => setShiftState("open")} />
            <FilterChip label="Applied" selected={shiftState === "applied"} onPress={() => setShiftState("applied")} />
            <FilterChip label="€20+/h" selected={shiftRate === "20"} onPress={() => setShiftRate(shiftRate === "20" ? "all" : "20")} />
            <FilterChip label="€30+/h" selected={shiftRate === "30"} onPress={() => setShiftRate(shiftRate === "30" ? "all" : "30")} />
          </View>
        </View>
      ) : null}
      <View style={styles.boardSummary}>
        <Text style={[styles.count, { color: colors.muted }]}>
          {provider
            ? boardMode === "shift"
              ? `${visibleShifts.length} of ${shiftRows.length} shifts`
              : `${rows.length} live jobs`
            : `${rows.length} approved providers`}
        </Text>
        {provider && boardMode === "day" ? (
          <Text style={[styles.summaryHint, { color: colors.muted }]}>
            Approximate buyer area only until paid acceptance
          </Text>
        ) : null}
      </View>
      {provider && boardMode === "shift" ? (
        shifts.isLoading ? (
          <LoadingState label="Finding business shifts..." />
        ) : shifts.isError ? (
          <ErrorState
            message={(shifts.error as Error).message}
            retry={() => void shifts.refetch()}
          />
        ) : (
          <ShiftBoard
            rows={visibleShifts}
            reason={shifts.data?.reason}
            applyPending={applyShift.isPending}
            onApply={(job) => applyShift.mutate(job)}
          />
        )
      ) : query.isLoading ? (
        <LoadingState
          label={provider ? "Finding live jobs…" : "Finding providers…"}
        />
      ) : query.isError ? (
        <ErrorState
          message={(query.error as Error).message}
          retry={() => void query.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No matches found"
          body="Try a broader search or check back when new work is available."
        />
      ) : provider ? (
        <View style={styles.jobs}>
          <SectionHeader title="Day-to-day jobs" />
          {rows.map((row: any) => {
            const copy = jobCopy(row);
            return (
              <Pressable
                accessibilityRole="button"
                key={row.id}
                onPress={() => router.push(`/jobs/${row.id}`)}
                style={({ pressed }) => [
                  styles.jobCard,
                  { backgroundColor: colors.surface, borderColor: colors.line },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.jobBody}>
                  <View style={styles.jobHeader}>
                    <View style={styles.jobStatusLine}>
                      <Pill
                        text={
                          categoryNames[String(row.category_slug || "")] ||
                          "Service request"
                        }
                        tone="info"
                      />
                    {row.anyjob_select ? (
                      <Pill text="AnyJob Select" tone="brand" />
                    ) : null}
                      {row.my_bid ? (
                        <Pill text="Offer sent" tone="success" />
                      ) : null}
                    </View>
                    <Text style={[styles.jobBudget, { color: colors.ink }]}>
                      {budgetLabel(row)}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={2}
                    style={[styles.jobTitle, { color: colors.ink }]}
                  >
                    {copy.title}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[styles.description, { color: colors.muted }]}
                  >
                    {copy.description}
                  </Text>
                  <View
                    style={[
                      styles.detailGrid,
                      {
                        borderTopColor: colors.line,
                        borderBottomColor: colors.line,
                      },
                    ]}
                  >
                    <JobFact
                      icon={<MapPin />}
                      label="Area"
                      value={
                        row.coarse_location_label ||
                        row.address ||
                        row.city ||
                        "Approximate"
                      }
                    />
                    <JobFact
                      icon={<CalendarDays />}
                      label="Date"
                      value={dateLabel(row.preferred_date || row.scheduled_date)}
                    />
                    <JobFact
                      icon={<Clock3 />}
                      label="Workload"
                      value={
                        row.estimated_duration_hours
                          ? `${row.estimated_duration_hours}h`
                          : "Flexible"
                      }
                    />
                    <JobFact
                      icon={<Users />}
                      label="People"
                      value={String(row.number_of_people_needed || 1)}
                    />
                  </View>
                  <View style={styles.jobFooter}>
                    <View style={styles.metaItem}>
                      <Gavel size={15} color={colors.brand} />
                      <Text style={[styles.metaText, { color: colors.brand }]}>
                        {row.bid_count || 0} offer
                        {Number(row.bid_count || 0) === 1 ? "" : "s"}
                      </Text>
                    </View>
                    {row.distance_km != null ? (
                      <Text style={[styles.distance, { color: colors.success }]}>
                        {row.distance_km} km away
                      </Text>
                    ) : null}
                  </View>
                  {providerTrustBadges(row).length ? (
                    <View style={styles.trustRow}>
                      {providerTrustBadges(row).map((badge) => (
                        <View
                          key={badge.label}
                          style={[
                            styles.trustChip,
                            { backgroundColor: colors.soft },
                          ]}
                        >
                          <Text
                            style={[styles.trustChipText, { color: colors.ink }]}
                          >
                            {badge.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <Text style={[styles.openHint, { color: colors.brand }]}>
                    Open full details
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.providerGrid}>
          {rows.map((row: ProviderCardData) => (
            <ProviderCard
              key={row.id}
              provider={row}
              grid
              onPress={() => router.push(`/provider/${row.id}`)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function JobFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactElement<{ color?: string; size?: number }>;
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.jobFact}>
      {cloneElement(icon, { color: colors.muted, size: 14 })}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.factLabel, { color: colors.muted }]}>{label}</Text>
        <Text numberOfLines={1} style={[styles.factValue, { color: colors.ink }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ShiftBoard({
  rows,
  reason,
  applyPending,
  onApply,
}: {
  rows: any[];
  reason?: string;
  applyPending: boolean;
  onApply: (job: any) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.jobs}>
      {reason ? (
        <Card>
          <Text style={[styles.shiftWarning, { color: colors.warning }]}>
            {reason}
          </Text>
        </Card>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState
          title="No matching shifts"
          body="Adjust filters or check back when approved businesses post matching shifts."
        />
      ) : (
        <>
          <SectionHeader title="Work shifts" />
          {rows.map((row) => {
            const application = row.myApplication;
            const payment = application?.payment;
            const rate = hourlyRate(row);
            const day = dayRate(row);
            return (
              <Card key={row.id} style={styles.shiftCard}>
                <View style={styles.shiftHead}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.jobStatusLine}>
                      <Pill text={workTypeLabels[row.work_type] || "Shift"} tone="info" />
                      <Pill
                        text={application?.status || row.status || "open"}
                        tone={application?.status === "completed" ? "success" : "neutral"}
                      />
                    </View>
                    <Text numberOfLines={2} style={[styles.jobTitle, { color: colors.ink }]}>
                      {row.role_title || "Business shift"}
                    </Text>
                    <Text numberOfLines={1} style={[styles.metaText, { color: colors.muted }]}>
                      {row.business?.business_name || "Approved business"}
                    </Text>
                  </View>
                  <View style={[styles.rateBadge, { backgroundColor: colors.successSoft }]}>
                    <Text style={[styles.rateText, { color: colors.success }]}>
                      {rate ? `€${rate}/h` : `€${day || 0}/day`}
                    </Text>
                  </View>
                </View>
                <Text numberOfLines={3} style={[styles.description, { color: colors.muted }]}>
                  {row.description || "No shift details provided yet."}
                </Text>
                <View
                  style={[
                    styles.detailGrid,
                    { borderTopColor: colors.line, borderBottomColor: colors.line },
                  ]}
                >
                  <JobFact icon={<MapPin />} label="City" value={row.city || "Shared"} />
                  <JobFact icon={<CalendarDays />} label="Date" value={dateLabel(row.starts_at)} />
                  <JobFact icon={<Users />} label="Workers" value={String(row.headcount || 1)} />
                  <JobFact icon={<CircleDollarSign />} label="Day" value={day ? `€${day}` : "Ask"} />
                </View>
                {!application ? (
                  <Button
                    title="Apply for shift"
                    loading={applyPending}
                    onPress={() => onApply(row)}
                  />
                ) : (
                  <Text style={[styles.openHint, { color: colors.info }]}>
                    {payment?.status === "held"
                      ? "Payment held by AnyJob"
                      : payment?.status === "released"
                        ? "Payment released to earnings"
                        : "Application sent"}
                  </Text>
                )}
              </Card>
            );
          })}
        </>
      )}
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? colors.brand : colors.surface,
          borderColor: selected ? colors.brand : colors.line,
        },
      ]}
    >
      <Text style={[styles.filterChipText, { color: selected ? "white" : colors.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 4 },
  title: { fontSize: 29, lineHeight: 34, fontWeight: "900" },
  subtitle: { fontSize: 14, lineHeight: 20 },
  searchLine: { flexDirection: "row", gap: 9 },
  search: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 9,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15 },
  boardSwitch: { flexDirection: "row", gap: 9 },
  boardSwitchItem: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  boardSwitchText: { fontSize: 13, fontWeight: "900" },
  shiftFilters: { gap: 9 },
  shiftFilterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shiftFilterTitle: { flexDirection: "row", alignItems: "center", gap: 7 },
  shiftFilterTitleText: { fontSize: 14, fontWeight: "900" },
  clear: { fontSize: 12, fontWeight: "900" },
  filterChips: { gap: 8, paddingRight: 16 },
  compactFilters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipText: { fontSize: 12, fontWeight: "900", textTransform: "capitalize" },
  filter: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterCount: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountText: { color: "white", fontSize: 10, fontWeight: "900" },
  buyerFilters: { borderWidth: 1, borderRadius: radius.md, padding: 12, gap: 10 },
  boardSummary: { gap: 2 },
  count: { fontSize: 13, fontWeight: "800" },
  summaryHint: { fontSize: 12, lineHeight: 17 },
  providerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "flex-start",
  },
  jobs: { gap: 14 },
  jobCard: { borderWidth: 1, borderRadius: radius.lg },
  jobBody: { padding: 14, gap: 10 },
  jobHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  jobStatusLine: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  jobBudget: { fontSize: 18, fontWeight: "900" },
  jobTitle: { fontSize: 19, lineHeight: 24, fontWeight: "900" },
  description: { fontSize: 14, lineHeight: 20 },
  detailGrid: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 11,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  jobFact: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  factLabel: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  factValue: { fontSize: 12.5, lineHeight: 17, fontWeight: "800" },
  jobFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontWeight: "700" },
  distance: { fontSize: 12, fontWeight: "900" },
  trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  trustChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  trustChipText: { fontSize: 10.5, fontWeight: "900" },
  openHint: { fontSize: 13, fontWeight: "900", alignSelf: "flex-start" },
  shiftWarning: { fontSize: 14, lineHeight: 20, fontWeight: "800" },
  shiftCard: { gap: 12 },
  shiftHead: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  rateBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  rateText: { fontSize: 13, fontWeight: "900" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.992 }] },
});
