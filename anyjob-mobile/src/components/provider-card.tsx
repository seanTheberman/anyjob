import { Image, type ImageSource } from "expo-image";
import { BriefcaseBusiness, Heart, MapPin, Star } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui";
import { serviceCover } from "@/lib/service-assets";
import { useAppTheme } from "@/providers/theme-provider";
import { radius, shadow } from "@/theme/tokens";

export type ProviderCardData = {
  id: string;
  name?: string;
  category?: string;
  city?: string;
  location?: string;
  heroImage?: string | null;
  image?: string | null;
  rating?: number;
  reviewCount?: number;
  completedJobs?: number;
  rate?: number;
  level?: string;
  availableForShifts?: boolean;
  worksInViewerArea?: boolean;
  categorySlug?: string;
  searchText?: string;
};

export function ProviderCard({
  provider,
  onPress,
  wide = false,
  grid = false,
  compact = false,
}: {
  provider: ProviderCardData;
  onPress: () => void;
  wide?: boolean;
  grid?: boolean;
  compact?: boolean;
}) {
  const { colors } = useAppTheme();
  const name = provider.name || "AnyJob provider";
  const source: ImageSource =
    provider.heroImage || provider.image
      ? { uri: provider.heroImage || provider.image || "" }
      : serviceCover(provider.category);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${provider.category || "service provider"}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        wide && styles.wide,
        grid && styles.grid,
        compact && styles.compact,
        { backgroundColor: colors.surface, borderColor: colors.line },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.media,
          grid && styles.gridMedia,
          compact && styles.compactMedia,
        ]}
      >
        <Image
          source={source}
          alt=""
          contentFit="cover"
          transition={220}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.mediaShade} />
        <View style={[styles.heart, compact && styles.compactHeart]}>
          <Heart color="white" size={compact ? 15 : 19} />
        </View>
        {provider.level && !compact ? (
          <View style={[styles.level, { backgroundColor: colors.brand }]}>
            <Text style={styles.levelText}>{provider.level}</Text>
          </View>
        ) : null}
        {provider.availableForShifts ? (
          <View style={[styles.shiftBadge, compact && styles.compactShiftBadge]}>
            <BriefcaseBusiness color="white" size={compact ? 10 : 12} />
            {!compact ? <Text style={styles.shiftBadgeText}>Work shifts</Text> : null}
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.body,
          grid && styles.gridBody,
          compact && styles.compactBody,
        ]}
      >
        <View style={styles.person}>
          <Avatar
            name={name}
            uri={provider.image}
            size={compact ? 22 : grid ? 28 : 34}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.name,
              compact && styles.compactName,
              { color: colors.ink },
            ]}
          >
            {name}
          </Text>
        </View>
        <Text
          numberOfLines={compact ? 1 : 2}
          style={[
            styles.title,
            grid && styles.gridTitle,
            compact && styles.compactTitle,
            { color: colors.ink },
          ]}
        >
          {provider.category || "Local professional services"}
        </Text>
        <View style={[styles.meta, compact && styles.compactMeta]}>
          {provider.rating && provider.reviewCount ? (
            <View style={styles.rating}>
              <Star color="#f4b400" fill="#f4b400" size={14} />
              <Text style={[styles.metaText, { color: colors.ink }]}>
                {Number(provider.rating).toFixed(1)} ({provider.reviewCount})
              </Text>
            </View>
          ) : (
            <Text style={[styles.metaText, { color: colors.muted }]}>
              New on AnyJob
            </Text>
          )}
          {!compact ? (
            <View style={styles.location}>
              <MapPin color={colors.muted} size={13} />
              <Text
                numberOfLines={1}
                style={[styles.metaText, { color: colors.muted }]}
              >
                {provider.city || provider.location || "Nearby"}
              </Text>
            </View>
          ) : null}
        </View>
        <View
          style={[
            styles.footer,
            compact && styles.compactFooter,
            { borderTopColor: colors.line },
          ]}
        >
          {!compact ? (
            <Text style={[styles.completed, { color: colors.muted }]}>
              {Number(provider.completedJobs || 0)} done
            </Text>
          ) : null}
          <Text numberOfLines={1} style={[styles.price, { color: colors.ink }]}>
            {provider.rate ? `€${provider.rate}/hr` : "Profile"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 232,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow,
  },
  wide: { width: "100%" },
  grid: { width: "47.5%" },
  compact: { width: 108 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  media: { height: 148, position: "relative", backgroundColor: "#ddd" },
  gridMedia: { height: 124 },
  compactMedia: { height: 76 },
  mediaShade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,.08)",
  },
  heart: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,.3)",
  },
  compactHeart: {
    width: 24,
    height: 24,
    borderRadius: 12,
    right: 6,
    top: 6,
  },
  level: {
    position: "absolute",
    left: 10,
    top: 10,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  levelText: { color: "white", fontSize: 11, fontWeight: "900" },
  shiftBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    minHeight: 25,
    borderRadius: 6,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(5,150,105,.96)",
  },
  compactShiftBadge: {
    left: 6,
    bottom: 6,
    width: 22,
    minHeight: 22,
    paddingHorizontal: 0,
    justifyContent: "center",
  },
  shiftBadgeText: { color: "white", fontSize: 9.5, fontWeight: "900" },
  body: { padding: 12, gap: 8 },
  gridBody: { padding: 10 },
  compactBody: { padding: 7, gap: 5 },
  person: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontSize: 14, fontWeight: "900" },
  compactName: { fontSize: 10 },
  title: { minHeight: 42, fontSize: 16, lineHeight: 21, fontWeight: "800" },
  gridTitle: { fontSize: 14, lineHeight: 18, minHeight: 36 },
  compactTitle: { fontSize: 10.5, lineHeight: 14, minHeight: 14 },
  meta: { gap: 5 },
  compactMeta: { gap: 2 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12, fontWeight: "700" },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  compactFooter: { paddingTop: 6 },
  completed: { fontSize: 10 },
  price: { flexShrink: 1, fontSize: 11, fontWeight: "900" },
});
