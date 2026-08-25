import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ClipboardList, Plus } from "lucide-react-native";

import { api } from "@/lib/api";
import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  ListGroup,
  LoadingState,
  Pill,
  RowLink,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { colors } from "@/theme/tokens";

function requestStatus(row: any) {
  if (row.request_visibility !== "private") return row.status || "pending";
  if (row.provider_decision_status === "accepted") return "Provider accepted";
  if (row.provider_decision_status === "rejected") return "Provider declined";
  return "Requirements sent";
}

export default function RequestsScreen() {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["requests"],
    queryFn: () => api<any>("/api/dashboard/request-summaries"),
  });
  const rows = query.data?.requests || query.data?.inquiries || [];
  const startRequest = () =>
    router.push({ pathname: "/request/new", params: { requestKey: String(Date.now()) } });

  return (
    <Screen>
      <Header
        title="My requests"
        subtitle="Quotes, bookings, and completed tasks."
        action={
          <Button
            title="New"
            icon={<Plus color="white" size={17} />}
            onPress={startRequest}
          />
        }
      />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          message={(query.error as Error).message}
          retry={() => void query.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          body="Post a task to start receiving quotes from approved providers."
          action={<Button title="Post a task" onPress={startRequest} />}
        />
      ) : (
        <>
          <SectionHeader title={`${rows.length} task${rows.length === 1 ? "" : "s"}`} />
          <ListGroup>
            {rows.map((row: any) => {
              const quoteCount = row.quotes?.total ?? row.bid_count ?? row.bids?.length ?? 0;
              const title = row.title || String(row.job_description || "Service request")
                .replace(/^Title:\s*/i, "")
                .split("\n")[0];
              return (
                <RowLink
                  key={row.id}
                  title={title}
                  subtitle={`${row.city || "Ireland"} · ${quoteCount} quote${quoteCount === 1 ? "" : "s"}`}
                  icon={<ClipboardList color={colors.ink} size={20} />}
                  trailing={
                    <Pill
                      text={requestStatus(row)}
                      tone={row.provider_decision_status === "accepted" || row.status === "completed" ? "success" : "info"}
                    />
                  }
                  onPress={() => router.push(`/requests/${row.id}`)}
                />
              );
            })}
          </ListGroup>
        </>
      )}
    </Screen>
  );
}
