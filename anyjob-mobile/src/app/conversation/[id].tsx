import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Send, ShieldAlert } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorState, Header, IconButton, LoadingState } from "@/components/ui";
import { api, jsonBody } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const scroll = useRef<ScrollViewInstance>(null);
  const query = useQuery({
    queryKey: ["messages", id],
    queryFn: () => api<any>(`/api/chat?action=messages&conversation_id=${id}`),
    refetchInterval: 5000,
  });
  const send = useMutation({
    mutationFn: () =>
      api("/api/chat", {
        method: "POST",
        ...jsonBody({ conversation_id: id, content: message }),
      }),
    onSuccess: () => {
      setMessage("");
      void client.invalidateQueries({ queryKey: ["messages", id] });
      void client.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    const timer = setTimeout(
      () => scroll.current?.scrollToEnd({ animated: true }),
      80,
    );
    return () => clearTimeout(timer);
  }, [query.data?.messages?.length]);

  if (query.isLoading)
    return <SafeAreaView style={styles.safe}><LoadingState /></SafeAreaView>;
  if (query.isError)
    return <SafeAreaView style={styles.safe}><ErrorState message={(query.error as Error).message} /></SafeAreaView>;

  const conversation = query.data?.conversation;
  const otherUserId = conversation?.client_id === user?.id
    ? conversation?.provider_id
    : conversation?.client_id;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Header
            title="Conversation"
            subtitle="Messages are private to this paid booking."
            action={otherUserId ? (
              <IconButton
                label="Report or block user"
                onPress={() =>
                  router.push(
                    `/safety/report?targetUserId=${encodeURIComponent(otherUserId)}&conversationId=${encodeURIComponent(id)}&sourcePath=${encodeURIComponent(`/conversation/${id}`)}` as never,
                  )
                }
              >
                <ShieldAlert color={colors.ink} size={21} />
              </IconButton>
            ) : null}
          />
        </View>
        <ScrollView
          ref={scroll}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.messages}
        >
          {(query.data?.messages || []).map((item: any) => {
            const mine = item.sender_id === user?.id;
            return (
              <View key={item.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.message, mine && styles.mineText]}>{item.content}</Text>
                <Text style={[styles.time, mine && styles.mineTime]}>
                  {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </Text>
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.composer}>
          <TextInput
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message"
            placeholderTextColor="#98a2b3"
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!message.trim() || send.isPending}
            onPress={() => send.mutate()}
            style={styles.send}
          >
            <Send color="white" size={21} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: 18 },
  messages: { padding: 18, gap: 9, flexGrow: 1, justifyContent: "flex-end" },
  bubble: { maxWidth: "82%", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 8, gap: 4 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.brand },
  theirs: { alignSelf: "flex-start", backgroundColor: "white", borderWidth: 1, borderColor: colors.line },
  message: { color: colors.ink, lineHeight: 20 },
  mineText: { color: "white" },
  time: { color: colors.muted, fontSize: 10 },
  mineTime: { color: "#ffd8da" },
  composer: { flexDirection: "row", gap: 9, padding: 12, backgroundColor: "white", borderTopWidth: 1, borderTopColor: colors.line, alignItems: "flex-end" },
  input: { flex: 1, minHeight: 46, maxHeight: 120, borderWidth: 1, borderColor: "#d0d5dd", borderRadius: 8, paddingHorizontal: 13, paddingVertical: 11, color: colors.ink },
  send: { width: 46, height: 46, borderRadius: 8, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
});
