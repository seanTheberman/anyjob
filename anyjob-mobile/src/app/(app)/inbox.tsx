import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import {
  Avatar,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  SectionHeader,
} from "@/components/ui";
import type { Conversation, Person } from "@/types/domain";
import { useAppTheme } from "@/providers/theme-provider";
import { AppHeader } from "@/components/app-header";

export default function InboxScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors: themeColors } = useAppTheme();
  const query = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => api<{ conversations: Conversation[] }>("/api/chat"),
  });
  const rows = query.data?.conversations || [];
  const unread = rows.reduce((sum, row) => sum + (row.unread_count || 0), 0);

  return (
    <Screen>
      <AppHeader compact />
      <Header
        title="Inbox"
        back={false}
        subtitle={
          unread
            ? `${unread} unread message${unread === 1 ? "" : "s"}`
            : "All caught up"
        }
      />
      {query.isLoading ? (
        <LoadingState label="Loading conversations…" />
      ) : query.isError ? (
        <ErrorState
          message={(query.error as Error).message}
          retry={() => void query.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No messages yet"
          body="Booking conversations will appear here."
        />
      ) : (
        <>
          <SectionHeader title="Messages" />
          <View style={styles.list}>
            {rows.map((conversation) => {
              const other = (
                conversation.client_id === user?.id
                  ? conversation.provider
                  : conversation.client
              ) as Person | undefined;
              const name =
                [other?.first_name, other?.last_name]
                  .filter(Boolean)
                  .join(" ") || "AnyJob user";
              const count = Number(conversation.unread_count || 0);
              return (
                <Pressable
                  accessibilityRole="button"
                  key={conversation.id}
                  onPress={() =>
                    router.push(`/conversation/${conversation.id}`)
                  }
                  style={({ pressed }) => [
                    styles.row,
                    { borderBottomColor: themeColors.line },
                    pressed && styles.pressed,
                  ]}
                >
                  <Avatar
                    name={name}
                    uri={other?.avatar_url || other?.profile_image_url}
                    size={52}
                  />
                  <View style={styles.copy}>
                    <View style={styles.nameLine}>
                      <Text
                        numberOfLines={1}
                        style={[styles.name, { color: themeColors.ink }]}
                      >
                        {name}
                      </Text>
                      {count ? (
                        <View
                          style={[
                            styles.unread,
                            { backgroundColor: themeColors.brand },
                          ]}
                        >
                          <Text style={styles.unreadText}>
                            {count > 99 ? "99+" : count}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.preview,
                        {
                          color:
                            count > 0 ? themeColors.ink : themeColors.muted,
                        },
                        count > 0 && styles.previewUnread,
                      ]}
                    >
                      {conversation.last_message?.content ||
                        "Open conversation"}
                    </Text>
                  </View>
                  <ChevronRight color={themeColors.subtle} size={19} />
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { borderTopWidth: 0 },
  row: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: "800" },
  preview: { fontSize: 14 },
  previewUnread: { fontWeight: "700" },
  unread: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { color: "white", fontSize: 11, fontWeight: "800" },
  pressed: { opacity: 0.65 },
});
