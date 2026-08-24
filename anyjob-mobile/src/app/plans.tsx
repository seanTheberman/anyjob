import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { Check, Crown, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  Button,
  ErrorState,
  Header,
  LoadingState,
  Pill,
  Screen,
} from "@/components/ui";
import { api, API_URL, jsonBody } from "@/lib/api";
import { isProviderRole, useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";

export default function PlansScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const client = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["plans"],
    queryFn: () => api<any>("/api/mobile/plans"),
  });

  if (query.isLoading)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (query.isError)
    return (
      <Screen>
        <ErrorState message={(query.error as Error).message} />
      </Screen>
    );

  const provider = isProviderRole(user?.role);
  const business = !provider && query.data?.hasBusiness;
  const plans = provider
    ? query.data.rules.plans
    : business
      ? query.data.rules.businessPlans
      : query.data.rules.buyerPlans;

  const checkout = async (plan: any) => {
    if (plan.priceMonthly <= 0 || query.data?.activePlanId === plan.id) return;
    try {
      setBusy(plan.id);
      if (business) {
        await WebBrowser.openBrowserAsync(`${API_URL}/pricing`);
        return;
      }
      const endpoint = provider
        ? "/api/payments/provider-plan-checkout"
        : "/api/payments/buyer-plan-checkout";
      const result = await api<any>(endpoint, {
        method: "POST",
        ...jsonBody({ planId: plan.id }),
      });
      if (result.dummyPayment) {
        await client.invalidateQueries({ queryKey: ["plans"] });
        Alert.alert(
          "Plan activated",
          `${plan.name} is active for the next 30 days.`,
        );
        return;
      }
      if (!result.checkoutUrl)
        throw new Error("Checkout URL was not returned.");
      const url = result.checkoutUrl.startsWith("http")
        ? result.checkoutUrl
        : `${API_URL}${result.checkoutUrl}`;
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      Alert.alert(
        "Could not open checkout",
        error instanceof Error ? error.message : "Try again.",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Header
        title="Plans"
        subtitle="Choose the marketplace access that fits your work."
      />
      <View style={[styles.intro, { backgroundColor: colors.infoSoft }]}>
        <View style={[styles.introIcon, { backgroundColor: colors.surface }]}>
          <Crown color={colors.info} size={22} />
        </View>
        <View style={styles.introCopy}>
          <Text style={[styles.introTitle, { color: colors.ink }]}>
            Simple monthly plans
          </Text>
          <Text style={[styles.introBody, { color: colors.muted }]}>
            Upgrade or keep the free plan. Your active plan is always clearly
            marked.
          </Text>
        </View>
      </View>
      <View style={styles.planList}>
        {plans.map((plan: any) => {
          const current = query.data?.activePlanId === plan.id;
          return (
            <View
              key={plan.id}
              style={[
                styles.plan,
                {
                  backgroundColor: colors.surface,
                  borderColor: plan.featured ? colors.brand : colors.line,
                },
              ]}
            >
              <View style={styles.head}>
                <View style={styles.planCopy}>
                  <View style={styles.nameLine}>
                    <Text style={[styles.name, { color: colors.ink }]}>
                      {plan.name}
                    </Text>
                    {current ? (
                      <Pill text="Current" tone="success" />
                    ) : plan.featured ? (
                      <Pill text="Popular" tone="brand" />
                    ) : null}
                  </View>
                  <Text style={[styles.description, { color: colors.muted }]}>
                    {plan.description}
                  </Text>
                </View>
              </View>
              <View style={styles.priceLine}>
                <Text style={[styles.price, { color: colors.ink }]}>
                  {plan.priceMonthly <= 0 ? "Free" : `€${plan.priceMonthly}`}
                </Text>
                {plan.priceMonthly > 0 ? (
                  <Text style={[styles.period, { color: colors.muted }]}>
                    / month
                  </Text>
                ) : null}
              </View>
              <View style={styles.perks}>
                {plan.perks.map((perk: string) => (
                  <View
                    key={perk}
                    style={[styles.perk, { backgroundColor: colors.soft }]}
                  >
                    <View
                      style={[
                        styles.check,
                        { backgroundColor: colors.successSoft },
                      ]}
                    >
                      <Check color={colors.success} size={14} strokeWidth={3} />
                    </View>
                    <Text style={[styles.perkText, { color: colors.ink }]}>
                      {perk}
                    </Text>
                  </View>
                ))}
              </View>
              <Button
                title={
                  current
                    ? "Current plan"
                    : plan.priceMonthly <= 0
                      ? "Included by default"
                      : plan.cta || "Choose plan"
                }
                variant={
                  current || plan.priceMonthly <= 0 ? "secondary" : "primary"
                }
                disabled={current || plan.priceMonthly <= 0}
                loading={busy === plan.id}
                icon={
                  !current && plan.priceMonthly > 0 ? (
                    <Sparkles color="white" size={17} />
                  ) : undefined
                }
                onPress={() => void checkout(plan)}
              />
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  introIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  introCopy: { flex: 1, gap: 3 },
  introTitle: { fontSize: 14, fontWeight: "900" },
  introBody: { fontSize: 11.5, lineHeight: 17 },
  planList: { gap: 12 },
  plan: { borderWidth: 1, borderRadius: 18, padding: 15, gap: 13 },
  head: { flexDirection: "row", gap: 12 },
  planCopy: { flex: 1, gap: 5 },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  name: { fontSize: 19, lineHeight: 24, fontWeight: "900" },
  description: { fontSize: 11.5, lineHeight: 17 },
  priceLine: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  price: { fontSize: 29, lineHeight: 33, fontWeight: "900" },
  period: { fontSize: 11.5, paddingBottom: 4 },
  perks: { gap: 6 },
  perk: {
    minHeight: 42,
    borderRadius: 11,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  check: {
    width: 25,
    height: 25,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  perkText: { flex: 1, fontSize: 11.5, lineHeight: 16, fontWeight: "700" },
});
