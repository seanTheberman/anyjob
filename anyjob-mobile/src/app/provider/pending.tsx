import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { CalendarCheck } from "lucide-react-native";

import { api } from "@/lib/api";
import { EmptyState, ErrorState, Header, ListGroup, LoadingState, Pill, RowLink, Screen, SectionHeader } from "@/components/ui";
import { colors } from "@/theme/tokens";

export default function PendingScreen() {
  const router = useRouter(); const query = useQuery({ queryKey: ["provider-bids"], queryFn: () => api<any>("/api/bids?role=provider") }); const rows = (query.data?.bids || []).filter((bid: any) => !["rejected", "withdrawn", "completed"].includes(bid.status));
  return <Screen><Header title="Pending and active" subtitle="Your quotes and accepted service jobs." />{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState message={(query.error as Error).message} /> : rows.length === 0 ? <EmptyState title="Nothing pending" body="Submitted and accepted quotes will appear here." /> : <><SectionHeader title={`${rows.length} job${rows.length === 1 ? "" : "s"}`} /><ListGroup>{rows.map((bid: any) => <RowLink key={bid.id} title={String(bid.inquiry?.job_description || "Service request").replace(/^Title:\s*/i, "").split("\n")[0]} subtitle={`Your quote €${Number(bid.amount).toFixed(2)} · ${bid.inquiry?.city || "Ireland"}`} icon={<CalendarCheck color={colors.ink} size={20} />} trailing={<Pill text={bid.status} tone={bid.status === "accepted" ? "success" : "info"} />} onPress={() => router.push(`/jobs/${bid.inquiry_id}`)} />)}</ListGroup></>}</Screen>;
}
