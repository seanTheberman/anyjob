import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Target,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  ErrorState,
  Header,
  LoadingState,
  Pill,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { api } from "@/lib/api";
import { isProviderRole, useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";

export default function MilestonesScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const role = isProviderRole(user?.role) ? "provider" : "buyer";
  const [expanded, setExpanded] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["milestones", role],
    queryFn: () => api<any>(`/api/badges/milestones?role=${role}`),
  });

  if (query.isLoading)
    return (
      <Screen>
        <LoadingState label="Calculating live milestones…" />
      </Screen>
    );
  if (query.isError)
    return (
      <Screen>
        <ErrorState message={(query.error as Error).message} />
      </Screen>
    );

  const data = query.data;
  return (
    <Screen>
      <Header
        title="Milestones"
        subtitle="Progress toward your next marketplace badge."
      />
      <View
        style={[
          styles.hero,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <View
          style={[styles.awardWell, { backgroundColor: `${colors.brand}14` }]}
        >
          <Award color={colors.brand} size={30} />
        </View>
        <View style={styles.levelCopy}>
          <Text style={[styles.eyebrow, { color: colors.brand }]}>
            {role === "provider" ? "PROVIDER LEVEL" : "BUYER LEVEL"}
          </Text>
          <Text style={[styles.levelName, { color: colors.ink }]}>
            {data.summary.currentLevelName}
          </Text>
          <Text style={[styles.progressCopy, { color: colors.muted }]}>
            {data.summary.earnedCount} of {data.summary.totalCount} badges
            earned
          </Text>
        </View>
        <View style={[styles.progressBadge, { backgroundColor: colors.soft }]}>
          <Text style={[styles.progressNumber, { color: colors.ink }]}>
            {data.summary.progress}%
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.softStrong }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${data.summary.progress}%`,
                backgroundColor: colors.brand,
              },
            ]}
          />
        </View>
        {data.summary.nextBadgeName ? (
          <View style={[styles.nextRow, { backgroundColor: colors.soft }]}>
            <Target color={colors.brand} size={17} />
            <Text style={[styles.nextText, { color: colors.ink }]}>
              Next: {data.summary.nextBadgeName}
            </Text>
          </View>
        ) : null}
      </View>

      <SectionHeader title="Performance" />
      <View style={styles.metricGrid}>
        {(data.metrics || []).map((metric: any) => (
          <View
            key={metric.key}
            style={[
              styles.metric,
              { backgroundColor: colors.surface, borderColor: colors.line },
            ]}
          >
            <View style={styles.metricHead}>
              <Text
                numberOfLines={2}
                style={[styles.metricLabel, { color: colors.muted }]}
              >
                {metric.label}
              </Text>
              {metric.complete ? (
                <CheckCircle2 color={colors.success} size={17} />
              ) : (
                <Clock3 color={colors.warning} size={17} />
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[styles.metricValue, { color: colors.ink }]}
            >
              {metric.valueLabel}
            </Text>
            <Text
              style={[
                styles.metricState,
                { color: metric.complete ? colors.success : colors.warning },
              ]}
            >
              {metric.complete ? "Target reached" : "In progress"}
            </Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Badge requirements" />
      <View style={styles.badges}>
        {(data.badges || []).map((badge: any) => {
          const isOpen = expanded === badge.id;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${badge.name}: ${badge.earned ? "earned" : "pending"}, ${badge.progress}% complete`}
              key={badge.id}
              onPress={() => setExpanded(isOpen ? null : badge.id)}
            >
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: colors.surface,
                    borderColor: badge.earned ? colors.success : colors.line,
                  },
                ]}
              >
                <View
                  style={[
                    styles.badgeIcon,
                    {
                      backgroundColor: badge.earned
                        ? colors.successSoft
                        : colors.warningSoft,
                    },
                  ]}
                >
                  {badge.earned ? (
                    <CheckCircle2 color={colors.success} size={21} />
                  ) : (
                    <Clock3 color={colors.warning} size={21} />
                  )}
                </View>
                <View style={styles.badgeCopy}>
                  <View style={styles.badgeTitleLine}>
                    <Text style={[styles.badgeName, { color: colors.ink }]}>
                      {badge.name}
                    </Text>
                    <Pill
                      text={badge.earned ? "Earned" : `${badge.progress}%`}
                      tone={badge.earned ? "success" : "warning"}
                    />
                  </View>
                  <Text style={[styles.description, { color: colors.muted }]}>
                    {badge.description}
                  </Text>
                </View>
                <ChevronDown
                  color={colors.subtle}
                  size={18}
                  style={{
                    transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                  }}
                />
                <View
                  style={[
                    styles.badgeTrack,
                    { backgroundColor: colors.softStrong },
                  ]}
                >
                  <View
                    style={[
                      styles.badgeFill,
                      {
                        width: `${badge.progress}%`,
                        backgroundColor: badge.earned
                          ? colors.success
                          : colors.brand,
                      },
                    ]}
                  />
                </View>
                {isOpen ? (
                  <View style={styles.rules}>
                    {badge.rules.map((rule: any) => (
                      <View
                        key={rule.id}
                        style={[styles.rule, { backgroundColor: colors.soft }]}
                      >
                        <View
                          style={[
                            styles.ruleIcon,
                            {
                              backgroundColor: rule.complete
                                ? colors.successSoft
                                : colors.warningSoft,
                            },
                          ]}
                        >
                          {rule.complete ? (
                            <Check
                              color={colors.success}
                              size={15}
                              strokeWidth={3}
                            />
                          ) : (
                            <Clock3 color={colors.warning} size={15} />
                          )}
                        </View>
                        <View style={styles.ruleCopy}>
                          <Text
                            style={[styles.ruleTitle, { color: colors.ink }]}
                          >
                            {rule.requirement}
                          </Text>
                          <Text
                            style={[styles.ruleState, { color: colors.muted }]}
                          >
                            {rule.complete
                              ? `Complete · ${rule.valueLabel}`
                              : `Current ${rule.valueLabel} · needs ${rule.thresholdLabel}`}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 11,
  },
  awardWell: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  levelCopy: { flex: 1, minWidth: 150, gap: 2 },
  eyebrow: { fontSize: 9.5, fontWeight: "900" },
  levelName: { fontSize: 19, lineHeight: 24, fontWeight: "900" },
  progressCopy: { fontSize: 11.5 },
  progressBadge: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  progressNumber: { fontWeight: "900", fontSize: 15 },
  track: { width: "100%", height: 7, borderRadius: 5, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5 },
  nextRow: {
    minHeight: 38,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    gap: 7,
  },
  nextText: { fontSize: 11.5, fontWeight: "800" },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  metric: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
    gap: 7,
  },
  metricHead: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  metricLabel: { flex: 1, fontSize: 11.5, lineHeight: 16, fontWeight: "800" },
  metricValue: { fontSize: 22, lineHeight: 27, fontWeight: "900" },
  metricState: { fontSize: 10.5, fontWeight: "800" },
  badges: { gap: 10 },
  badge: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCopy: { flex: 1, minWidth: 180, gap: 5 },
  badgeTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  badgeName: { flexShrink: 1, fontSize: 15, fontWeight: "900" },
  description: { fontSize: 11.5, lineHeight: 17 },
  badgeTrack: { width: "100%", height: 6, borderRadius: 4, overflow: "hidden" },
  badgeFill: { height: "100%", borderRadius: 4 },
  rules: { width: "100%", gap: 7 },
  rule: {
    minHeight: 54,
    borderRadius: 12,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  ruleIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleCopy: { flex: 1, gap: 2 },
  ruleTitle: { fontSize: 11.5, lineHeight: 16, fontWeight: "800" },
  ruleState: { fontSize: 10.5, lineHeight: 15 },
});
