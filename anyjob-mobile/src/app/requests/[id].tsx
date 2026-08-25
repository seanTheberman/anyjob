import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";

import { api, jsonBody } from "@/lib/api";
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  Header,
  LoadingState,
  Pill,
  Rating,
  RowLink,
  Screen,
} from "@/components/ui";
import { colors } from "@/theme/tokens";

type LooseRow = Record<string, any>;

function privateRequestCopy(item: LooseRow) {
  const provider = item.target_provider_name || "the selected provider";
  if (item.provider_decision_status === "accepted") {
    return {
      title: `${provider} accepted your request`,
      body: "Review the provider quote below. Payment is now available.",
      tone: "success" as const,
    };
  }
  if (item.provider_decision_status === "rejected") {
    return {
      title: `${provider} declined your request`,
      body: item.provider_rejection_reason || "You can choose another provider or post the job publicly.",
      tone: "neutral" as const,
    };
  }
  return {
    title: `Requirements sent to ${provider}`,
    body: "The provider is reviewing the job. You will receive an email when they accept or decline.",
    tone: "info" as const,
  };
}

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const detail = useQuery({
    queryKey: ["request", id],
    queryFn: () => api<any>(`/api/dashboard/requests/${id}`),
  });
  const bids = useQuery({
    queryKey: ["bids", id],
    queryFn: () => api<any>(`/api/bids?inquiry_id=${id}`),
  });

  const refresh = async () => {
    await Promise.all([
      detail.refetch(),
      bids.refetch(),
      client.invalidateQueries({ queryKey: ["requests"] }),
      client.invalidateQueries({ queryKey: ["notifications"] }),
    ]);
  };
  const status = useMutation({
    mutationFn: (next: string) =>
      api(`/api/dashboard/requests/${id}`, {
        method: "PATCH",
        ...jsonBody({ status: next }),
      }),
    onSuccess: refresh,
    onError: (error: Error) => Alert.alert("Could not update job", error.message),
  });
  const accept = useMutation({
    mutationFn: (bidId: string) =>
      api<any>("/api/payments/bid-checkout", {
        method: "POST",
        ...jsonBody({ bid_id: bidId }),
      }),
    onSuccess: async (data) => {
      if (data.checkoutUrl && !data.dummyPayment) {
        await WebBrowser.openBrowserAsync(data.checkoutUrl);
      }
      await refresh();
      Alert.alert(
        "Provider confirmed",
        data.dummyPayment
          ? "Test payment completed and chat is unlocked."
          : "Return after payment to refresh the job.",
      );
    },
    onError: (error: Error) => Alert.alert("Could not accept quote", error.message),
  });

  if (detail.isLoading) return <Screen><LoadingState /></Screen>;
  if (detail.isError) {
    return (
      <Screen>
        <ErrorState
          message={(detail.error as Error).message}
          retry={() => void detail.refetch()}
        />
      </Screen>
    );
  }

  const item: LooseRow = detail.data?.inquiry || {};
  const title = String(item.job_description || "Service request")
    .replace(/^Title:\s*/i, "")
    .split("\n")[0];
  const rows: LooseRow[] = bids.data?.bids || [];
  const isPrivate = item.request_visibility === "private";
  const privateCopy = isPrivate ? privateRequestCopy(item) : null;
  const paymentUnlocked = !isPrivate || item.provider_decision_status === "accepted";

  return (
    <Screen>
      <Header
        title={title}
        subtitle={`${item.city || "Ireland"} · ${item.preferred_date || "Flexible"}`}
      />
      <View style={styles.pills}>
        <Pill
          text={item.status || "pending"}
          tone={item.status === "completed" ? "success" : "info"}
        />
        {isPrivate ? <Pill text="Private request" tone="brand" /> : null}
      </View>

      {privateCopy ? (
        <Card style={privateCopy.tone === "success" ? styles.acceptedCard : styles.privateCard}>
          <Text style={styles.heading}>{privateCopy.title}</Text>
          <Text style={styles.body}>{privateCopy.body}</Text>
          {item.conversation_id ? (
            <RowLink
              title="Open requirements messages"
              onPress={() => router.push(`/conversation/${item.conversation_id}`)}
            />
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.heading}>Job description</Text>
        <Text style={styles.body}>
          {String(item.job_description || "").replace(/^Title:[^\n]*\n+/i, "")}
        </Text>
        <View style={styles.price}>
          <Text style={styles.muted}>Budget</Text>
          <Text style={styles.amount}>
            €{item.budget_range_min || 0}–{item.budget_range_max || "Open"}
          </Text>
        </View>
      </Card>

      {item.visit_verification_code ? (
        <VisitCodeCard code={item.visit_verification_code} audience="buyer" />
      ) : null}
      {item.status === "bid_accepted" || item.status === "confirmed" ? (
        <Button title="Start job" loading={status.isPending} onPress={() => status.mutate("in_progress")} />
      ) : null}
      {item.status === "in_progress" ? (
        <Button title="Mark completed" loading={status.isPending} onPress={() => status.mutate("completed")} />
      ) : null}
      {item.status === "completed" ? (
        <Button
          title="Leave provider review"
          onPress={() => router.push(`/review/new?serviceInquiryId=${id}&type=buyer_to_seller`)}
        />
      ) : null}

      <Text style={styles.section}>Quotes</Text>
      {bids.isLoading ? (
        <LoadingState label="Loading quotes..." />
      ) : rows.length === 0 ? (
        <Card>
          <Text style={styles.muted}>
            {isPrivate && item.provider_decision_status === "pending"
              ? "Waiting for the selected provider to review your requirements."
              : "No provider quotes yet."}
          </Text>
        </Card>
      ) : (
        rows.map((bid) => {
          const name = [bid.provider?.first_name, bid.provider?.last_name]
            .filter(Boolean)
            .join(" ") || "Provider";
          return (
            <Card key={bid.id}>
              <View style={styles.provider}>
                <Avatar name={name} uri={bid.provider?.profile_image_url} />
                <View style={styles.flex}>
                  <Text style={styles.heading}>{name}</Text>
                  <Rating value={bid.provider?.rating} count={bid.provider?.review_count} />
                  <Text style={styles.muted}>{bid.provider?.total_jobs || 0} completed jobs</Text>
                </View>
                <Text style={styles.quote}>€{Number(bid.amount).toFixed(2)}</Text>
              </View>
              {bid.message ? <Text style={styles.body}>{bid.message}</Text> : null}
              <Pill text={bid.status} tone={bid.status === "accepted" ? "success" : "info"} />
              {bid.status === "accepted" && bid.visit_verification_code ? (
                <VisitCodeCard code={bid.visit_verification_code} audience="buyer" />
              ) : null}
              {bid.status === "pending" && paymentUnlocked ? (
                <Button
                  title="Accept quote and pay"
                  loading={accept.isPending}
                  onPress={() => accept.mutate(bid.id)}
                />
              ) : bid.status === "accepted" && item.conversation_id ? (
                <RowLink
                  title="Message provider"
                  onPress={() => router.push(`/conversation/${item.conversation_id}`)}
                />
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function VisitCodeCard({ code, audience }: { code: string; audience: "buyer" | "provider" }) {
  return (
    <Card style={styles.codeCard}>
      <Text style={styles.codeLabel}>Visit verification code</Text>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.codeHelp}>
        {audience === "buyer"
          ? "Ask the provider to show this code at the door before work starts."
          : "Show this code to the buyer when you arrive."}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  heading: { fontSize: 18, fontWeight: "800", color: colors.ink },
  body: { color: colors.ink, fontSize: 15, lineHeight: 23 },
  muted: { color: colors.muted },
  price: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amount: { color: colors.success, fontSize: 20, fontWeight: "900" },
  section: { fontSize: 20, fontWeight: "800", color: colors.ink, marginTop: 8 },
  provider: { flexDirection: "row", alignItems: "center", gap: 10 },
  quote: { color: colors.ink, fontWeight: "900", fontSize: 20 },
  privateCard: { backgroundColor: "#fff7ed", borderColor: "#fed7aa" },
  acceptedCard: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  codeCard: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  codeLabel: { color: "#1d4ed8", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  code: { color: "#172554", fontSize: 34, fontWeight: "900", letterSpacing: 10, fontVariant: ["tabular-nums"] },
  codeHelp: { color: "#1e40af", fontSize: 13, lineHeight: 19, fontWeight: "700" },
});
