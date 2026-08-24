import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  LifeBuoy,
  MessageCircleMore,
  Plus,
  Send,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { api, jsonBody } from "@/lib/api";
import { OptionCards } from "@/components/form-options";
import { isProviderRole, useAuth } from "@/providers/auth-provider";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Header,
  LoadingState,
  Pill,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { useAppTheme } from "@/providers/theme-provider";

export default function SupportScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => api<any>("/api/support/tickets"),
  });
  const [creating, setCreating] = useState(false);
  const [replying, setReplying] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const defaultRequester = user?.hasBusinessProfile
    ? "business"
    : isProviderRole(user?.role)
      ? "provider"
      : "user";
  const [form, setForm] = useState({
    requesterType: defaultRequester,
    title: "",
    description: "",
    category: "other",
    priority: "normal",
    relatedJobId: "",
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const create = useMutation({
    mutationFn: () =>
      api("/api/support/tickets", {
        method: "POST",
        ...jsonBody({
          ...form,
          sourcePath: "anyjob-mobile/support",
        }),
      }),
    onSuccess: () => {
      setCreating(false);
      setForm({
        requesterType: defaultRequester,
        title: "",
        description: "",
        category: "other",
        priority: "normal",
        relatedJobId: "",
      });
      void client.invalidateQueries({ queryKey: ["support-tickets"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
      Alert.alert(
        "Support ticket created",
        "Your request is now in the AnyJob support queue. Email updates are enabled for replies.",
      );
    },
    onError: (error: Error) =>
      Alert.alert("Could not create ticket", error.message),
  });
  const sendReply = useMutation({
    mutationFn: () =>
      api("/api/support/tickets", {
        method: "PATCH",
        ...jsonBody({ ticketId: replying, message: reply }),
      }),
    onSuccess: () => {
      setReplying(null);
      setReply("");
      void client.invalidateQueries({ queryKey: ["support-tickets"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
      Alert.alert("Reply sent", "Support has been notified.");
    },
    onError: (error: Error) =>
      Alert.alert("Could not send reply", error.message),
  });
  const rows = query.data?.tickets || [];

  return (
    <Screen>
      <Header
        title="Help & support"
        subtitle="Get help and follow your support requests."
        action={
          <Button
            title="New"
            icon={<Plus color="white" size={17} />}
            onPress={() => setCreating(true)}
          />
        }
      />
      <View style={[styles.hero, { backgroundColor: colors.infoSoft }]}>
        <View style={[styles.heroIcon, { backgroundColor: colors.surface }]}>
          <LifeBuoy color={colors.info} size={23} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroTitle, { color: colors.ink }]}>
            We’re here to help
          </Text>
          <Text style={[styles.heroBody, { color: colors.muted }]}>
            Tell us what happened and keep every reply in one place.
          </Text>
        </View>
      </View>
      {creating ? (
        <Card>
          <Text style={[styles.formTitle, { color: colors.ink }]}>
            New support request
          </Text>
          <Text style={[styles.optionLabel, { color: colors.ink }]}>
            Ticket from
          </Text>
          <OptionCards
            columns={2}
            options={[
              { value: "user", label: "User" },
              ...(isProviderRole(user?.role)
                ? [{ value: "provider", label: "Provider" }]
                : []),
              ...(user?.hasBusinessProfile
                ? [{ value: "business", label: "Business" }]
                : []),
            ]}
            value={form.requesterType}
            onChange={set("requesterType")}
          />
          <Text style={[styles.optionLabel, { color: colors.ink }]}>
            Category
          </Text>
          <OptionCards
            columns={2}
            options={[
              "account",
              "booking",
              "payment",
              "kyc",
              "business",
              "provider",
              "technical",
              "safety",
              "other",
            ].map((value) => ({
              value,
              label: value
                .replace(/_/g, " ")
                .replace(/^./, (letter) => letter.toUpperCase()),
            }))}
            value={form.category}
            onChange={set("category")}
          />
          <Text style={[styles.optionLabel, { color: colors.ink }]}>
            Priority
          </Text>
          <OptionCards
            columns={2}
            options={["low", "normal", "high", "urgent"].map((value) => ({
              value,
              label: value.replace(/^./, (letter) => letter.toUpperCase()),
            }))}
            value={form.priority}
            onChange={set("priority")}
          />
          <Field
            label="Subject"
            value={form.title}
            onChangeText={set("title")}
            maxLength={160}
          />
          <Field
            label="Related job ID"
            placeholder="Optional"
            value={form.relatedJobId}
            onChangeText={set("relatedJobId")}
          />
          <Field
            label="Details"
            multiline
            value={form.description}
            onChangeText={set("description")}
            maxLength={5000}
          />
          <Button
            title="Send to support"
            icon={<Send color="white" size={16} />}
            loading={create.isPending}
            disabled={!form.title.trim() || !form.description.trim()}
            onPress={() => create.mutate()}
          />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setCreating(false)}
          />
        </Card>
      ) : null}
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No support tickets"
          body="Your support history appears here."
        />
      ) : (
        <>
          <SectionHeader title="Your requests" />
          <View style={styles.tickets}>
            {rows.map((ticket: any) => {
              const isOpen = expanded === ticket.id;
              return (
                <View
                  key={ticket.id}
                  style={[
                    styles.ticket,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.line,
                    },
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setExpanded(isOpen ? null : ticket.id)}
                    style={styles.ticketHead}
                  >
                    <View
                      style={[
                        styles.ticketIcon,
                        { backgroundColor: colors.soft },
                      ]}
                    >
                      <MessageCircleMore color={colors.ink} size={19} />
                    </View>
                    <View style={styles.ticketCopy}>
                      <Text style={[styles.title, { color: colors.ink }]}>
                        {ticket.title}
                      </Text>
                      <Text style={[styles.meta, { color: colors.muted }]}>
                        {ticket.category} · {ticket.priority} priority
                      </Text>
                    </View>
                    <Pill
                      text={ticket.status}
                      tone={ticket.status === "resolved" ? "success" : "info"}
                    />
                    <ChevronDown
                      color={colors.subtle}
                      size={18}
                      style={{
                        transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                      }}
                    />
                  </Pressable>
                  {isOpen ? (
                    <View
                      style={[
                        styles.ticketBody,
                        { borderTopColor: colors.line },
                      ]}
                    >
                      <Text style={[styles.body, { color: colors.muted }]}>
                        {ticket.description}
                      </Text>
                      {ticket.messages?.map((message: any) => (
                        <View
                          key={message.id}
                          style={[
                            styles.message,
                            { backgroundColor: colors.soft },
                          ]}
                        >
                          <Text
                            style={[styles.messageRole, { color: colors.ink }]}
                          >
                            {message.senderRole || message.sender_role}
                          </Text>
                          <Text style={[styles.body, { color: colors.muted }]}>
                            {message.body}
                          </Text>
                        </View>
                      ))}
                      {replying === ticket.id ? (
                        <>
                          <Field
                            label="Reply"
                            multiline
                            value={reply}
                            onChangeText={setReply}
                          />
                          <Button
                            title="Send reply"
                            loading={sendReply.isPending}
                            disabled={!reply.trim()}
                            onPress={() => sendReply.mutate()}
                          />
                          <Button
                            title="Cancel"
                            variant="ghost"
                            onPress={() => {
                              setReplying(null);
                              setReply("");
                            }}
                          />
                        </>
                      ) : (
                        <Button
                          title="Reply to support"
                          variant="secondary"
                          onPress={() => setReplying(ticket.id)}
                        />
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  heroIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 14.5, fontWeight: "900" },
  heroBody: { fontSize: 11.5, lineHeight: 17 },
  formTitle: { fontSize: 16, fontWeight: "900" },
  optionLabel: { fontSize: 12.5, fontWeight: "900" },
  tickets: { gap: 9 },
  ticket: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  ticketHead: {
    minHeight: 72,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  ticketIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketCopy: { flex: 1, gap: 3 },
  title: { fontWeight: "900", fontSize: 13 },
  meta: { fontSize: 10.5, textTransform: "capitalize" },
  ticketBody: { borderTopWidth: 1, padding: 12, gap: 9 },
  body: { fontSize: 11.5, lineHeight: 18 },
  message: { padding: 10, borderRadius: 11, gap: 3 },
  messageRole: {
    fontSize: 10.5,
    fontWeight: "900",
    textTransform: "capitalize",
  },
});
