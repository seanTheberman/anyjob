import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Bell, ChevronDown, MapPin, UserRound } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";

export function AppHeader({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();
  const account = useQuery({
    queryKey: ["account"],
    queryFn: () => api<any>("/api/mobile/account"),
    enabled: Boolean(user),
    staleTime: 300_000,
  });
  const row =
    account.data?.buyer || account.data?.seller || account.data?.profile || {};
  const area = row.city
    ? `${row.city}${row.postal_code ? ` · ${String(row.postal_code).slice(0, 3)} area` : ""}`
    : "Set your area";
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Current area ${area}`}
        onPress={() =>
          router.push(
            !user
              ? "/(auth)/sign-in"
              : user.role === "seller" ||
              user?.role === "provider" ||
              user?.role === "contractor"
              ? "/provider/profile"
              : "/profile",
          )
        }
        style={styles.location}
      >
        <View style={[styles.pin, { backgroundColor: colors.brand + "18" }]}>
          <MapPin color={colors.brand} size={18} />
        </View>
        <View style={styles.locationCopy}>
          {!compact ? (
            <Text style={[styles.kicker, { color: colors.muted }]}>
              CURRENT AREA
            </Text>
          ) : null}
          <View style={styles.locationLine}>
            <Text
              numberOfLines={1}
              style={[styles.area, { color: colors.ink }]}
            >
              {area}
            </Text>
            <ChevronDown color={colors.muted} size={15} />
          </View>
        </View>
      </Pressable>
      <Text style={[styles.logo, { color: colors.brand }]}>AnyJob</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push(user ? "/notifications" : "/(auth)/sign-in")}
          style={({ pressed }) => [
            styles.headerAction,
            { backgroundColor: colors.soft },
            pressed && styles.pressed,
          ]}
        >
          <Bell color={colors.ink} size={17} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => router.push(user ? "/(app)/account" : "/(auth)/sign-in")}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {user ? (
            <Avatar name={user.displayName || "A"} size={32} />
          ) : (
            <View
              style={[
                styles.accountEntry,
                { backgroundColor: colors.soft, borderColor: colors.line },
              ]}
            >
              <UserRound color={colors.ink} size={17} />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  location: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  locationCopy: { flex: 1, minWidth: 0, justifyContent: "center", gap: 1 },
  kicker: { fontSize: 8, lineHeight: 9, fontWeight: "900" },
  locationLine: {
    minHeight: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  area: { maxWidth: 145, fontSize: 12.5, lineHeight: 16, fontWeight: "900" },
  logo: { display: "none", fontSize: 23, fontWeight: "900" },
  actions: { height: 34, flexDirection: "row", alignItems: "center", gap: 7 },
  headerAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  accountEntry: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
