import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Heart,
  MapPin,
  Plus,
  Search,
  Star,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppHeader } from "@/components/app-header";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Pill,
  Screen,
} from "@/components/ui";
import { api } from "@/lib/api";
import { serviceCover } from "@/lib/service-assets";
import { isProviderRole, useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";
import { radius } from "@/theme/tokens";

type Filter = "all" | "active" | "completed";
type PublicTask = {
  id: string;
  source: "buyer" | "business";
  title: string;
  category: string;
  description: string;
  location: string;
  priceMin: number;
  priceMax: number;
  quoteCount: number;
  lowestQuoteTotal: number | null;
  startsAt: string | null;
  href: string;
  workImages?: Array<{ id: string; image_url: string }>;
  buyerTrust?: {
    jobsPosted: number;
    hires: number;
    hireRate: number;
    paymentStatus: "verified" | "unverified";
    isNewClient: boolean;
    totalSpentLabel: string;
    badges: Array<{ label: string; tone: string }>;
  } | null;
};

const completedStatuses = new Set(["completed", "released", "paid"]);
const inactiveStatuses = new Set([
  "completed",
  "released",
  "paid",
  "cancelled",
  "rejected",
  "withdrawn",
]);

function statusOf(item: any) {
  return String(item?.status || "pending").toLowerCase();
}

function filterRows(rows: any[], filter: Filter) {
  if (filter === "completed")
    return rows.filter((item) => completedStatuses.has(statusOf(item)));
  if (filter === "active")
    return rows.filter((item) => !inactiveStatuses.has(statusOf(item)));
  return rows;
}

function taskTitle(row: any, provider: boolean) {
  const raw = provider
    ? row.inquiry?.job_description
    : row.title || row.job_description;
  return String(raw || "Service request")
    .replace(/^Title:\s*/i, "")
    .split("\n")[0];
}

function taskLocation(row: any, provider: boolean) {
  const source = provider ? row.inquiry || {} : row;
  return source.coarse_location_label || source.city || "Ireland";
}

function taskDate(row: any, provider: boolean) {
  const source = provider ? row.inquiry || {} : row;
  const value =
    source.preferred_date ||
    source.scheduled_date ||
    source.created_at ||
    row.created_at;
  if (!value) return "Date flexible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function publicTaskPrice(task: PublicTask) {
  const amount = Number(task.lowestQuoteTotal || task.priceMax || task.priceMin || 0);
  if (!amount) return "Open budget";
  if (task.lowestQuoteTotal) return `From €${amount.toFixed(0)}`;
  if (task.priceMin && task.priceMax && task.priceMin !== task.priceMax) {
    return `€${task.priceMin.toFixed(0)}-${task.priceMax.toFixed(0)}`;
  }
  return `€${amount.toFixed(0)}`;
}

function publicTaskDate(value?: string | null) {
  if (!value) return "Flexible timing";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Flexible timing";
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function toneForStatus(status: string): "success" | "warning" | "info" {
  if (completedStatuses.has(status)) return "success";
  if (["accepted", "in_progress", "confirmed"].includes(status)) return "info";
  return "warning";
}

function PublicTaskCard({
  task,
  selected,
  onPress,
}: {
  task: PublicTask;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.publicTaskCard,
        {
          backgroundColor: selected ? `${colors.brand}12` : colors.surface,
          borderColor: selected ? `${colors.brand}55` : colors.line,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.publicTaskTop}>
        <View style={styles.publicTaskCopy}>
          <Text numberOfLines={2} style={[styles.publicTaskTitle, { color: colors.ink }]}>
            {task.title}
          </Text>
          <View style={styles.publicTaskMeta}>
            <MapPin color={colors.muted} size={14} />
            <Text numberOfLines={1} style={[styles.publicTaskMetaText, { color: colors.muted }]}>
              {task.location}
            </Text>
          </View>
          <View style={styles.publicTaskMeta}>
            <CalendarDays color={colors.muted} size={14} />
            <Text style={[styles.publicTaskMetaText, { color: colors.muted }]}>
              {publicTaskDate(task.startsAt)}
            </Text>
          </View>
        </View>
        <Text style={[styles.publicTaskPrice, { color: colors.ink }]}>
          {publicTaskPrice(task)}
        </Text>
      </View>
      <View style={styles.publicTaskBadges}>
        <Pill text={task.category.replaceAll("-", " ")} tone="info" />
        <Pill
          text={task.source === "business" ? "Business post" : "Buyer request"}
          tone={task.source === "business" ? "warning" : "success"}
        />
        <View style={styles.offerLine}>
          {task.source === "business" ? (
            <Briefcase color={colors.brand} size={14} />
          ) : (
            <ClipboardList color={colors.brand} size={14} />
          )}
          <Text style={[styles.offerText, { color: colors.brand }]}>
            {task.source === "business"
              ? "Applications open"
              : `${task.quoteCount} offer${task.quoteCount === 1 ? "" : "s"}`}
          </Text>
        </View>
      </View>
      {task.buyerTrust?.badges?.length ? (
        <View style={styles.publicTaskBadges}>
          {task.buyerTrust.badges.slice(0, 3).map((badge) => (
            <Pill key={badge.label} text={badge.label} tone="success" />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

function Segment({
  value,
  active,
  onPress,
}: {
  value: Filter;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.segment,
        {
          backgroundColor: active ? colors.ink : "transparent",
          borderColor: active ? colors.ink : "transparent",
        },
      ]}
    >
      <Text
        style={[
          styles.segmentText,
          { color: active ? colors.canvas : colors.muted },
        ]}
      >
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Text>
    </Pressable>
  );
}

function TaskCard({
  row,
  provider,
  onPress,
}: {
  row: any;
  provider: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const source = provider ? row.inquiry || {} : row;
  const status = statusOf(row);
  const imageUrl =
    source.workImages?.[0]?.image_url ||
    source.work_images?.[0]?.image_url ||
    source.images?.[0]?.image_url;
  const quoteCount = Number(
    source.quotes?.total ?? source.bid_count ?? source.bids?.length ?? 0,
  );
  const amount = provider
    ? Number(row.amount || 0)
    : Number(source.quotes?.acceptedTotal || source.budget_range_max || 0);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.taskCard,
        { backgroundColor: colors.surface, borderColor: colors.line },
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={
          imageUrl
            ? { uri: imageUrl }
            : serviceCover(source.category_slug || source.category)
        }
        alt=""
        contentFit="cover"
        style={styles.taskImage}
      />
      <View style={styles.taskMain}>
        <View style={styles.taskTopline}>
          <Pill
            text={status.replaceAll("_", " ")}
            tone={toneForStatus(status)}
          />
          <ChevronRight color={colors.subtle} size={18} />
        </View>
        <Text
          numberOfLines={2}
          style={[styles.taskTitle, { color: colors.ink }]}
        >
          {taskTitle(row, provider)}
        </Text>
        <View style={styles.taskMetaRow}>
          <View style={styles.taskMetaItem}>
            <MapPin color={colors.muted} size={13} />
            <Text
              numberOfLines={1}
              style={[styles.taskMeta, { color: colors.muted }]}
            >
              {taskLocation(row, provider)}
            </Text>
          </View>
          <View style={styles.taskMetaItem}>
            <CalendarDays color={colors.muted} size={13} />
            <Text style={[styles.taskMeta, { color: colors.muted }]}>
              {taskDate(row, provider)}
            </Text>
          </View>
        </View>
        <View style={[styles.taskFooter, { borderTopColor: colors.line }]}>
          <Text style={[styles.taskPrice, { color: colors.ink }]}>
            {amount ? `€${amount.toFixed(0)}` : "Open budget"}
          </Text>
          <Text style={[styles.taskQuotes, { color: colors.brand }]}>
            {provider
              ? "Your quote"
              : `${quoteCount} quote${quoteCount === 1 ? "" : "s"}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function QuickLink({
  title,
  subtitle,
  Icon,
  tint,
  onPress,
}: {
  title: string;
  subtitle: string;
  Icon: typeof ClipboardList;
  tint: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickLink,
        { backgroundColor: colors.surface, borderColor: colors.line },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: `${tint}18` }]}>
        <Icon color={tint} size={21} />
      </View>
      <Text style={[styles.quickLinkTitle, { color: colors.ink }]}>
        {title}
      </Text>
      <Text style={[styles.quickLinkBody, { color: colors.muted }]}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export default function WorkScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const provider = isProviderRole(user?.role);
  const [filter, setFilter] = useState<Filter>("all");
  const [publicSearch, setPublicSearch] = useState("");
  const [publicMode, setPublicMode] = useState<"all" | "buyer" | "business">("all");
  const [selectedPublicKey, setSelectedPublicKey] = useState<string | null>(null);
  const buyerQuery = useQuery({
    queryKey: ["requests"],
    queryFn: () => api<any>("/api/dashboard/request-summaries"),
    enabled: Boolean(user) && !provider,
    staleTime: 60_000,
  });
  const providerQuery = useQuery({
    queryKey: ["provider-bids"],
    queryFn: () => api<any>("/api/bids?role=provider"),
    enabled: provider,
    staleTime: 45_000,
  });
  const publicTasksQuery = useQuery({
    queryKey: ["public-tasks", publicSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicSearch.trim()) params.set("q", publicSearch.trim());
      return api<any>(`/api/tasks?${params.toString()}`);
    },
    enabled: !user,
    staleTime: 45_000,
  });
  const query = provider ? providerQuery : buyerQuery;
  const allRows = useMemo(
    () =>
      provider
        ? providerQuery.data?.bids || []
        : buyerQuery.data?.requests || buyerQuery.data?.inquiries || [],
    [buyerQuery.data, provider, providerQuery.data],
  );
  const rows = useMemo(() => filterRows(allRows, filter), [allRows, filter]);
  const activeCount = filterRows(allRows, "active").length;
  const completedCount = filterRows(allRows, "completed").length;
  const quoteCount = provider
    ? allRows.length
    : allRows.reduce(
        (total: number, row: any) => total + Number(row.quotes?.total || 0),
        0,
      );

  const openRow = (row: any) =>
    router.push(provider ? `/jobs/${row.inquiry_id}` : `/requests/${row.id}`);

  if (!user) {
    const publicTasks = ((publicTasksQuery.data?.tasks || []) as PublicTask[])
      .filter((task) => publicMode === "all" || task.source === publicMode)
      .slice(0, 12);
    const selectedPublicTask =
      publicTasks.find((task) => `${task.source}-${task.id}` === selectedPublicKey) ||
      publicTasks[0] ||
      null;
    return (
      <Screen>
        <AppHeader compact />
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={[styles.eyebrow, { color: colors.brand }]}>
              BROWSE JOBS
            </Text>
            <Text style={[styles.heading, { color: colors.ink }]}>
              Find open work near you
            </Text>
            <Text style={[styles.headingBody, { color: colors.muted }]}>
              Browse buyer requests and business work posts. Sign in as a
              provider to inspect full details and quote.
            </Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.countBadgeText, { color: colors.muted }]}>
              {publicTasksQuery.isLoading
                ? "Loading..."
                : `${publicTasks.length} open`}
            </Text>
          </View>
        </View>

        <View style={[styles.publicSearchBar, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Search color={colors.muted} size={19} />
          <TextInput
            accessibilityLabel="Search for a task"
            value={publicSearch}
            onChangeText={setPublicSearch}
            placeholder="Search for a task"
            placeholderTextColor={colors.subtle}
            style={[styles.publicSearchInput, { color: colors.ink }]}
          />
        </View>

        <View style={[styles.publicModeSwitch, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {[
            ["all", "All"],
            ["buyer", "Day jobs"],
            ["business", "Work shifts"],
          ].map(([value, label]) => {
            const active = publicMode === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setPublicMode(value as "all" | "buyer" | "business");
                  setSelectedPublicKey(null);
                }}
                style={[styles.publicModeItem, { backgroundColor: active ? colors.brand : "transparent" }]}
              >
                <Text style={[styles.publicModeText, { color: active ? "white" : colors.muted }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {publicTasksQuery.isLoading ? (
          <LoadingState label="Loading open tasks..." />
        ) : publicTasksQuery.isError ? (
          <ErrorState
            message={(publicTasksQuery.error as Error).message}
            retry={() => void publicTasksQuery.refetch()}
          />
        ) : publicTasks.length ? (
          <>
            <View style={styles.publicTaskList}>
              {publicTasks.map((task) => {
                const key = `${task.source}-${task.id}`;
                return (
                  <PublicTaskCard
                    key={key}
                    task={task}
                    selected={selectedPublicTask ? `${selectedPublicTask.source}-${selectedPublicTask.id}` === key : false}
                    onPress={() => setSelectedPublicKey(key)}
                  />
                );
              })}
            </View>
            {selectedPublicTask ? (
              <View style={[styles.publicDetail, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <View style={styles.publicTaskBadges}>
                  <Pill text="Open" tone="success" />
                  <Pill
                    text={selectedPublicTask.source === "business" ? "Business post" : "Buyer request"}
                    tone="info"
                  />
                </View>
                <Text style={[styles.publicDetailTitle, { color: colors.ink }]}>
                  {selectedPublicTask.title}
                </Text>
                <View style={styles.publicDetailGrid}>
                  <View style={styles.publicDetailItem}>
                    <MapPin color={colors.brand} size={17} />
                    <View>
                      <Text style={[styles.publicDetailLabel, { color: colors.muted }]}>Location</Text>
                      <Text style={[styles.publicDetailValue, { color: colors.ink }]}>{selectedPublicTask.location}</Text>
                    </View>
                  </View>
                  <View style={styles.publicDetailItem}>
                    <CalendarDays color={colors.brand} size={17} />
                    <View>
                      <Text style={[styles.publicDetailLabel, { color: colors.muted }]}>To be done</Text>
                      <Text style={[styles.publicDetailValue, { color: colors.ink }]}>{publicTaskDate(selectedPublicTask.startsAt)}</Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.publicDetailBody, { color: colors.muted }]} numberOfLines={5}>
                  {selectedPublicTask.description || "No extra detail has been added yet."}
                </Text>
                <View style={[styles.publicBudgetBox, { backgroundColor: colors.soft }]}>
                  <Text style={[styles.publicDetailLabel, { color: colors.muted }]}>Task budget</Text>
                  <Text style={[styles.publicBudget, { color: colors.ink }]}>{publicTaskPrice(selectedPublicTask)}</Text>
                </View>
                <Button
                  title="Sign in to open job"
                  onPress={() =>
                    router.push({
                      pathname: "/(auth)/sign-in",
                      params: { redirectTo: selectedPublicTask.href },
                    })
                  }
                />
                <Text style={[styles.publicFinePrint, { color: colors.muted }]}>
                  Exact contact details unlock after paid acceptance. Providers
                  see enough to decide whether to quote.
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <EmptyState
            title="No tasks match these filters"
            body="Try a wider search, another service, or check back later."
            action={
              <Button
                title="Browse providers"
                onPress={() => router.push("/(app)/explore")}
              />
            }
          />
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader compact />
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={[styles.eyebrow, { color: colors.brand }]}>
            {provider ? "YOUR WORK" : "YOUR TASKS"}
          </Text>
          <Text style={[styles.heading, { color: colors.ink }]}>
            {provider ? "Jobs, all in one place" : "Keep every task moving"}
          </Text>
          <Text style={[styles.headingBody, { color: colors.muted }]}>
            {provider
              ? "Follow quotes from submission through completion."
              : "Compare quotes, track progress and review completed work."}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={provider ? "Find work" : "Post a task"}
          onPress={() => {
            if (provider) router.push("/(app)/explore");
            else {
              router.push({
                pathname: "/request/new",
                params: { requestKey: String(Date.now()) },
              });
            }
          }}
          style={[styles.addButton, { backgroundColor: colors.brand }]}
        >
          {provider ? (
            <Search color="white" size={22} />
          ) : (
            <Plus color="white" size={24} />
          )}
        </Pressable>
      </View>

      <View
        style={[
          styles.summary,
          { backgroundColor: isDark ? colors.elevated : "#f0f7f4" },
        ]}
      >
        <View style={styles.summaryItem}>
          <Clock3 color={colors.warning} size={19} />
          <Text style={[styles.summaryValue, { color: colors.ink }]}>
            {activeCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>
            Active
          </Text>
        </View>
        <View
          style={[styles.summaryDivider, { backgroundColor: colors.line }]}
        />
        <View style={styles.summaryItem}>
          <CheckCircle2 color={colors.success} size={19} />
          <Text style={[styles.summaryValue, { color: colors.ink }]}>
            {completedCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>
            Done
          </Text>
        </View>
        <View
          style={[styles.summaryDivider, { backgroundColor: colors.line }]}
        />
        <View style={styles.summaryItem}>
          <CircleDollarSign color={colors.info} size={19} />
          <Text style={[styles.summaryValue, { color: colors.ink }]}>
            {quoteCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>
            {provider ? "Quotes" : "Offers"}
          </Text>
        </View>
      </View>

      <View style={[styles.segments, { backgroundColor: colors.soft }]}>
        {(["all", "active", "completed"] as Filter[]).map((value) => (
          <Segment
            key={value}
            value={value}
            active={filter === value}
            onPress={() => setFilter(value)}
          />
        ))}
      </View>

      {query.isLoading ? (
        <LoadingState label="Loading your tasks…" />
      ) : query.isError ? (
        <ErrorState
          message={(query.error as Error).message}
          retry={() => void query.refetch()}
        />
      ) : rows.length ? (
        <View style={styles.taskList}>
          {rows.map((row: any) => (
            <TaskCard
              key={row.id}
              row={row}
              provider={provider}
              onPress={() => openRow(row)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          title={filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
          body={
            provider
              ? "Browse local opportunities and send your first quote."
              : "Post what you need and approved providers can send quotes."
          }
          action={
            filter === "all" ? (
              <Button
                title={provider ? "Find work" : "Post a task"}
                onPress={() => {
                  if (provider) router.push("/(app)/explore");
                  else {
                    router.push({
                      pathname: "/request/new",
                      params: { requestKey: String(Date.now()) },
                    });
                  }
                }}
              />
            ) : undefined
          }
        />
      )}

      <View style={styles.quickGrid}>
        {provider ? (
          <>
            <QuickLink
              title="Completed"
              subtitle="Work history"
              Icon={CheckCircle2}
              tint={colors.success}
              onPress={() => router.push("/provider/completed")}
            />
            <QuickLink
              title="Earnings"
              subtitle="Balance and payouts"
              Icon={CircleDollarSign}
              tint="#2f88df"
              onPress={() => router.push("/earnings")}
            />
            <QuickLink
              title="Shifts"
              subtitle="Business work"
              Icon={Building2}
              tint="#7d5ce7"
              onPress={() => router.push("/shifts")}
            />
          </>
        ) : (
          <>
            <QuickLink
              title="Saved"
              subtitle="Favorite taskers"
              Icon={Heart}
              tint="#e54b73"
              onPress={() => router.push("/saved")}
            />
            <QuickLink
              title="Business"
              subtitle="Manage shifts"
              Icon={Building2}
              tint="#7d5ce7"
              onPress={() => router.push("/business")}
            />
            <QuickLink
              title="Reviews"
              subtitle="Your feedback"
              Icon={Star}
              tint="#ed9a18"
              onPress={() => router.push("/reviews")}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  headingCopy: { flex: 1, gap: 4 },
  eyebrow: { fontSize: 10, fontWeight: "900" },
  heading: { fontSize: 27, lineHeight: 32, fontWeight: "900" },
  headingBody: { fontSize: 13, lineHeight: 18 },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: {
    minHeight: 94,
    borderRadius: radius.lg,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 3 },
  summaryValue: { fontSize: 22, lineHeight: 25, fontWeight: "900" },
  summaryLabel: { fontSize: 11, fontWeight: "800" },
  summaryDivider: { width: 1, height: 48 },
  segments: {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.md,
  },
  segment: {
    flex: 1,
    minHeight: 39,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: { fontSize: 12, fontWeight: "900" },
  taskList: { gap: 11 },
  taskCard: {
    minHeight: 156,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 10,
    flexDirection: "row",
    gap: 11,
  },
  taskImage: { width: 94, minHeight: 134, borderRadius: radius.md },
  taskMain: { flex: 1, minWidth: 0, gap: 7 },
  taskTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  taskMetaRow: { gap: 4 },
  taskMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  taskMeta: { flexShrink: 1, fontSize: 11, lineHeight: 15 },
  taskFooter: {
    marginTop: "auto",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskPrice: { fontSize: 14, fontWeight: "900" },
  taskQuotes: { fontSize: 11, fontWeight: "900" },
  countBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countBadgeText: { fontSize: 11, fontWeight: "900" },
  publicSearchBar: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  publicSearchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "700",
  },
  publicModeSwitch: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 5,
    flexDirection: "row",
    gap: 5,
  },
  publicModeItem: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  publicModeText: { fontSize: 12, fontWeight: "900" },
  publicTaskList: { gap: 10 },
  publicTaskCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 13,
    gap: 11,
  },
  publicTaskTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  publicTaskCopy: { flex: 1, minWidth: 0, gap: 5 },
  publicTaskTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  publicTaskPrice: { fontSize: 16, fontWeight: "900" },
  publicTaskMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  publicTaskMetaText: { flexShrink: 1, fontSize: 12, fontWeight: "700" },
  publicTaskBadges: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  offerLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  offerText: { fontSize: 11, fontWeight: "900" },
  publicDetail: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 15,
    gap: 13,
  },
  publicDetailTitle: { fontSize: 22, lineHeight: 27, fontWeight: "900" },
  publicDetailGrid: { gap: 11 },
  publicDetailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  publicDetailLabel: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  publicDetailValue: { fontSize: 13, fontWeight: "800" },
  publicDetailBody: { fontSize: 14, lineHeight: 21 },
  publicBudgetBox: { borderRadius: radius.md, padding: 12, gap: 4 },
  publicBudget: { fontSize: 25, fontWeight: "900" },
  publicFinePrint: { fontSize: 11, lineHeight: 16, fontWeight: "700" },
  publicGrid: { flexDirection: "row", gap: 9 },
  publicSectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 18, fontWeight: "900" },
  sectionAction: { fontSize: 12, fontWeight: "900" },
  previewStack: { gap: 10 },
  previewCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    gap: 9,
  },
  previewTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  previewPrice: { fontSize: 12, fontWeight: "900" },
  previewTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  previewBody: { fontSize: 12, lineHeight: 17 },
  quickGrid: { flexDirection: "row", gap: 9 },
  quickLink: {
    flex: 1,
    minHeight: 128,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 11,
    gap: 7,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLinkTitle: { fontSize: 13, fontWeight: "900" },
  quickLinkBody: { fontSize: 10.5, lineHeight: 14 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
