import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Briefcase,
  CheckCheck,
  ClipboardCheck,
  CreditCard,
  Hammer,
  HeartHandshake,
  LifeBuoy,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api, jsonBody } from "@/lib/api";
import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { useAppTheme } from "@/providers/theme-provider";
import type { AppColors } from "@/theme/tokens";

function normalizeType(item: any) {
  return String(item?.type || item?.data?.type || item?.data?.action || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function notificationMeta(type: string, colors: AppColors) {
  if (type.includes("message") || type.includes("unread")) {
    return {
      Icon: MessageCircle,
      label: "Message",
      color: colors.info,
      soft: colors.infoSoft,
    };
  }
  if (type.includes("review")) {
    return {
      Icon: Star,
      label: "Review",
      color: colors.warning,
      soft: colors.warningSoft,
    };
  }
  if (type.includes("support") || type.includes("ticket")) {
    return {
      Icon: LifeBuoy,
      label: "Support",
      color: colors.danger,
      soft: colors.warningSoft,
    };
  }
  if (type.includes("quote") || type.includes("bid")) {
    return {
      Icon: Hammer,
      label: "Quote",
      color: colors.brand,
      soft: colors.softStrong,
    };
  }
  if (type.includes("shift")) {
    return {
      Icon: Briefcase,
      label: "Shift",
      color: colors.info,
      soft: colors.infoSoft,
    };
  }
  if (type.includes("payment") || type.includes("billing") || type.includes("plan")) {
    return {
      Icon: CreditCard,
      label: "Payment",
      color: colors.success,
      soft: colors.successSoft,
    };
  }
  if (type.includes("kyc") || type.includes("verification")) {
    return {
      Icon: ShieldCheck,
      label: "Verification",
      color: colors.success,
      soft: colors.successSoft,
    };
  }
  if (type.includes("promo") || type.includes("broadcast")) {
    return {
      Icon: Megaphone,
      label: "Campaign",
      color: colors.brand,
      soft: colors.softStrong,
    };
  }
  if (type.includes("welcome") || type.includes("thank")) {
    return {
      Icon: HeartHandshake,
      label: type.includes("thank") ? "Thanks" : "Welcome",
      color: colors.success,
      soft: colors.successSoft,
    };
  }
  if (type.includes("job")) {
    return {
      Icon: ClipboardCheck,
      label: "Job",
      color: colors.info,
      soft: colors.infoSoft,
    };
  }
  return {
    Icon: Bell,
    label: "Update",
    color: colors.info,
    soft: colors.infoSoft,
  };
}

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<any>("/api/notifications"),
  });
  const mark = useMutation({
    mutationFn: (id?: string) =>
      api("/api/notifications", {
        method: "PATCH",
        ...jsonBody(id ? { id } : { markAll: true }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const rows = query.data?.notifications || [];
  const unread = rows.filter((row: any) => !row.isRead).length;

  return (
    <Screen>
      <Header
        title="Notifications"
        subtitle={
          unread
            ? `${unread} unread update${unread === 1 ? "" : "s"}`
            : "You are all caught up"
        }
        action={
          unread ? (
            <Button
              title="Read all"
              variant="ghost"
              icon={<CheckCheck color={colors.ink} size={17} />}
              onPress={() => mark.mutate(undefined)}
            />
          ) : null
        }
      />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="You’re all caught up"
          body="New work and account updates will appear here."
        />
      ) : (
        <>
          <SectionHeader title="Recent updates" />
          <View style={styles.list}>
            {rows.map((item: any) => {
              const meta = notificationMeta(normalizeType(item), colors);
              const MetaIcon = meta.Icon;
              return (
                <Pressable
                  accessibilityRole="button"
                  disabled={item.isRead || mark.isPending}
                  onPress={() => mark.mutate(item.id)}
                  key={item.id}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: item.isRead
                        ? colors.surface
                        : meta.soft,
                      borderColor: item.isRead ? colors.line : meta.color,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor: item.isRead
                          ? colors.soft
                          : colors.surface,
                      },
                    ]}
                  >
                    <MetaIcon
                      color={item.isRead ? colors.muted : meta.color}
                      size={19}
                    />
                  </View>
                  <View style={styles.copy}>
                    <View style={styles.titleLine}>
                      <Text style={[styles.title, { color: colors.ink }]}>
                        {item.title}
                      </Text>
                      {!item.isRead ? (
                        <View
                          style={[styles.dot, { backgroundColor: colors.brand }]}
                        />
                      ) : null}
                    </View>
                    <Text style={[styles.body, { color: colors.muted }]}>
                      {item.message}
                    </Text>
                    <View style={styles.metaLine}>
                      <View
                        style={[
                          styles.category,
                          { backgroundColor: item.isRead ? colors.soft : colors.surface },
                        ]}
                      >
                        <Text style={[styles.categoryText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                      <Text style={[styles.time, { color: colors.subtle }]}>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : ""}
                      </Text>
                    </View>
                  </View>
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
  list: { gap: 9 },
  row: {
    minHeight: 92,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    borderRadius: 15,
    borderWidth: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 4 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontWeight: "900", fontSize: 13.5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  body: { fontSize: 11.5, lineHeight: 17 },
  metaLine: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  category: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText: { fontSize: 9.5, fontWeight: "900", textTransform: "uppercase" },
  time: { fontSize: 10 },
  pressed: { opacity: 0.68 },
});
