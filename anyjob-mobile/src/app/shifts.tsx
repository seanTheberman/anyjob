import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Filter,
  MapPin,
  Search,
  Users,
} from "lucide-react-native";
import { cloneElement } from "react";
import type React from "react";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api, jsonBody } from "@/lib/api";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Pill,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { useAppTheme } from "@/providers/theme-provider";
import { radius } from "@/theme/tokens";

const WORK_TYPE_LABELS: Record<string, string> = {
  day_wage: "Day wage",
  long_duration_shift: "Long shift",
  urgent_shift: "Urgent",
  recurring_shift: "Recurring",
};

function formatDate(value?: string | null) {
  if (!value) return "Flexible";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function hourlyRate(job: any) {
  return Number(job.business_preferred_hourly_rate || 0);
}

function dayRate(job: any) {
  return Number(job.business_preferred_day_rate || 0);
}

export default function ShiftsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [niche, setNiche] = useState("all");
  const [workType, setWorkType] = useState("all");
  const [state, setState] = useState("all");
  const [minRate, setMinRate] = useState("all");

  const query = useQuery({
    queryKey: ["shifts"],
    queryFn: () => api<any>("/api/shifts"),
    staleTime: 45_000,
  });

  const apply = useMutation({
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
      void query.refetch();
      void client.invalidateQueries({ queryKey: ["notifications"] });
      Alert.alert(
        "Application sent",
        "The business has been notified and can review your application.",
      );
    },
    onError: (error: Error) => Alert.alert("Could not apply", error.message),
  });

  const rows: any[] = useMemo(
    () => query.data?.jobs || [],
    [query.data?.jobs],
  );
  const workerNiches: string[] = Array.isArray(query.data?.workerProfile?.niches)
    ? query.data.workerProfile.niches.map(String).filter(Boolean)
    : [];

  const visibleRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((job: any) => {
      const app = job.myApplication;
      const text = [
        job.role_title,
        job.description,
        job.city,
        job.niche,
        job.work_type,
        job.business?.business_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (needle && !text.includes(needle)) return false;
      if (niche !== "all" && String(job.niche || "") !== niche) return false;
      if (workType !== "all" && String(job.work_type || "") !== workType) return false;
      if (state === "open" && app) return false;
      if (state === "applied" && !app) return false;
      if (minRate !== "all" && hourlyRate(job) < Number(minRate)) return false;
      return true;
    });
  }, [minRate, niche, rows, search, state, workType]);

  const workTypes: string[] = Array.from(
    new Set(rows.map((job: any) => String(job.work_type || "")).filter(Boolean)),
  );

  return (
    <Screen>
      <Header
        title="Work shifts"
        subtitle="Business day-wage and longer shift posts matching your shift profile."
      />

      <View style={styles.switcher}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(app)/explore")}
          style={[styles.switchButton, { backgroundColor: colors.surface, borderColor: colors.line }]}
        >
          <BriefcaseBusiness color={colors.muted} size={17} />
          <Text style={[styles.switchText, { color: colors.muted }]}>Day jobs</Text>
        </Pressable>
        <View style={[styles.switchButton, styles.switchActive, { backgroundColor: colors.brand }]}>
          <CalendarDays color="white" size={17} />
          <Text style={[styles.switchText, { color: "white" }]}>Work shifts</Text>
        </View>
      </View>

      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <Search color={colors.muted} size={18} />
        <TextInput
          accessibilityLabel="Search shifts"
          value={search}
          onChangeText={setSearch}
          placeholder="Search role, business, city"
          placeholderTextColor={colors.subtle}
          style={[styles.searchInput, { color: colors.ink }]}
        />
      </View>

      <View style={styles.filterHeader}>
        <View style={styles.filterTitle}>
          <Filter color={colors.brand} size={16} />
          <Text style={[styles.filterTitleText, { color: colors.ink }]}>Shift filters</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setSearch("");
            setNiche("all");
            setWorkType("all");
            setState("all");
            setMinRate("all");
          }}
        >
          <Text style={[styles.clear, { color: colors.brand }]}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <FilterChip
          label="All niches"
          selected={niche === "all"}
          onPress={() => setNiche("all")}
        />
        {workerNiches.map((item) => (
          <FilterChip
            key={item}
            label={item.replaceAll("_", " ")}
            selected={niche === item}
            onPress={() => setNiche(item)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <FilterChip
          label="All types"
          selected={workType === "all"}
          onPress={() => setWorkType("all")}
        />
        {workTypes.map((item) => (
          <FilterChip
            key={item}
            label={WORK_TYPE_LABELS[item] || item.replaceAll("_", " ")}
            selected={workType === item}
            onPress={() => setWorkType(item)}
          />
        ))}
      </ScrollView>

      <View style={styles.compactFilters}>
        <FilterChip label="All" selected={state === "all"} onPress={() => setState("all")} />
        <FilterChip label="Open only" selected={state === "open"} onPress={() => setState("open")} />
        <FilterChip label="Applied" selected={state === "applied"} onPress={() => setState("applied")} />
        <FilterChip label="€20+/h" selected={minRate === "20"} onPress={() => setMinRate(minRate === "20" ? "all" : "20")} />
        <FilterChip label="€30+/h" selected={minRate === "30"} onPress={() => setMinRate(minRate === "30" ? "all" : "30")} />
      </View>

      {query.data?.reason ? (
        <Card>
          <Text style={[styles.warning, { color: colors.warning }]}>
            {query.data.reason}
          </Text>
        </Card>
      ) : null}

      <View style={styles.summary}>
        <Text style={[styles.summaryText, { color: colors.muted }]}>
          {visibleRows.length} of {rows.length} shift{rows.length === 1 ? "" : "s"}
        </Text>
      </View>

      {query.isLoading ? (
        <LoadingState label="Finding business shifts..." />
      ) : query.isError ? (
        <ErrorState
          message={(query.error as Error).message}
          retry={() => void query.refetch()}
        />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          title="No matching shifts"
          body="Adjust filters or check back when approved businesses post matching shifts."
        />
      ) : (
        <View style={styles.list}>
          <SectionHeader title="Matching shifts" />
          {visibleRows.map((job: any) => {
            const application = job.myApplication;
            const payment = application?.payment;
            const rate = hourlyRate(job);
            const day = dayRate(job);
            return (
              <Card key={job.id} style={styles.shiftCard}>
                <View style={styles.head}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.pills}>
                      <Pill text={WORK_TYPE_LABELS[job.work_type] || "Shift"} tone="info" />
                      <Pill
                        text={application?.status || job.status || "open"}
                        tone={application?.status === "completed" ? "success" : "neutral"}
                      />
                    </View>
                    <Text numberOfLines={2} style={[styles.title, { color: colors.ink }]}>
                      {job.role_title || "Business shift"}
                    </Text>
                    <Text numberOfLines={1} style={[styles.meta, { color: colors.muted }]}>
                      {job.business?.business_name || "Approved business"}
                    </Text>
                  </View>
                  <View style={[styles.rateBadge, { backgroundColor: colors.successSoft }]}>
                    <Text style={[styles.rate, { color: colors.success }]}>
                      {rate ? `€${rate}/h` : `€${day || 0}/day`}
                    </Text>
                  </View>
                </View>

                <Text numberOfLines={3} style={[styles.body, { color: colors.muted }]}>
                  {job.description || "No shift details provided yet."}
                </Text>

                <View style={[styles.details, { borderColor: colors.line }]}>
                  <ShiftFact icon={<MapPin />} label="City" value={job.city || "Shared by business"} />
                  <ShiftFact icon={<CalendarDays />} label="Date" value={formatDate(job.starts_at)} />
                  <ShiftFact icon={<Users />} label="Workers" value={String(job.headcount || 1)} />
                  <ShiftFact icon={<CircleDollarSign />} label="Day" value={day ? `€${day}` : "Ask"} />
                </View>

                {!application ? (
                  <Button
                    title="Apply for shift"
                    loading={apply.isPending}
                    onPress={() => apply.mutate(job)}
                  />
                ) : application.status === "completed" && !application.myReview ? (
                  <Button
                    title="Review business"
                    onPress={() =>
                      router.push(
                        `/review/new?shiftApplicationId=${application.id}&type=seller_to_buyer&revieweeId=${application.owner_user_id}`,
                      )
                    }
                  />
                ) : (
                  <Text style={[styles.state, { color: colors.info }]}>
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
        </View>
      )}
    </Screen>
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
        styles.chip,
        {
          backgroundColor: selected ? colors.brand : colors.surface,
          borderColor: selected ? colors.brand : colors.line,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? "white" : colors.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ShiftFact({
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
    <View style={styles.fact}>
      <View style={styles.factIcon}>
        {cloneElement(icon, { color: colors.muted, size: 16 })}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.factLabel, { color: colors.muted }]}>{label}</Text>
        <Text numberOfLines={1} style={[styles.factValue, { color: colors.ink }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  switcher: { flexDirection: "row", gap: 9 },
  switchButton: {
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
  switchActive: { borderWidth: 0 },
  switchText: { fontSize: 13, fontWeight: "900" },
  searchBox: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 14 },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterTitle: { flexDirection: "row", alignItems: "center", gap: 7 },
  filterTitleText: { fontSize: 14, fontWeight: "900" },
  clear: { fontSize: 12, fontWeight: "900" },
  chips: { gap: 8, paddingRight: 16 },
  compactFilters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 12, fontWeight: "900", textTransform: "capitalize" },
  warning: { lineHeight: 20, fontWeight: "700" },
  summary: { marginTop: -4 },
  summaryText: { fontSize: 12, fontWeight: "800" },
  list: { gap: 12 },
  shiftCard: { gap: 12 },
  head: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  title: { fontWeight: "900", fontSize: 18, lineHeight: 23 },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  rateBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  rate: { fontWeight: "900", fontSize: 13 },
  body: { lineHeight: 20, fontSize: 13 },
  details: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
    gap: 10,
  },
  fact: { flexDirection: "row", alignItems: "center", gap: 9 },
  factIcon: { width: 18, alignItems: "center" },
  factLabel: { fontSize: 10, lineHeight: 13, fontWeight: "900", textTransform: "uppercase" },
  factValue: { fontSize: 13, lineHeight: 17, fontWeight: "900" },
  state: { fontWeight: "900", fontSize: 13 },
});
