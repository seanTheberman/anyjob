import { Image } from "expo-image";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Inbox, Star } from "lucide-react-native";
import { useRouter } from "expo-router";
import { shadow, type AppColors } from "@/theme/tokens";
import { useAppTheme } from "@/providers/theme-provider";

function useStyles() {
  const { colors } = useAppTheme();
  return { colors, styles: useMemo(() => createStyles(colors), [colors]) };
}

export function Screen({
  children,
  scroll = true,
  style,
  edgeToEdge = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  edgeToEdge?: boolean;
}) {
  const { colors, styles } = useStyles();
  const content = (
    <View style={[styles.screenInner, edgeToEdge && styles.edgeToEdge, style]}>
      {children}
    </View>
  );
  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safe, { backgroundColor: colors.canvas }]}
    >
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  action,
  back = true,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  back?: boolean;
}) {
  const router = useRouter();
  const { colors, styles } = useStyles();
  const showBack = back && router.canGoBack();
  return (
    <View style={styles.header}>
      {showBack ? (
        <IconButton label="Go back" onPress={() => router.back()}>
          <ChevronLeft color={colors.ink} size={23} />
        </IconButton>
      ) : null}
      <View style={styles.headerCopy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { styles } = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}
export function ListGroup({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { styles } = useStyles();
  return <View style={[styles.listGroup, style]}>{children}</View>;
}
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  const { styles } = useStyles();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}
export function IconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const { styles } = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  const { colors, styles } = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "white" : colors.ink}
        />
      ) : (
        icon
      )}
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  error,
  multiline,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const { styles } = useStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={styles.placeholder.color}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.textarea,
          error && styles.inputError,
        ]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
export function Pill({
  text,
  tone = "neutral",
}: {
  text: string;
  tone?: "neutral" | "brand" | "success" | "warning" | "info";
}) {
  const { styles } = useStyles();
  return (
    <View style={[styles.pill, styles[`pill_${tone}`]]}>
      <Text style={[styles.pillText, styles[`pillText_${tone}`]]}>{text}</Text>
    </View>
  );
}
export function RowLink({
  title,
  subtitle,
  onPress,
  icon,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const { colors, styles } = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {icon ? <View style={styles.rowIcon}>{icon}</View> : null}
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? (
          <Text numberOfLines={2} style={styles.rowSubtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      <ChevronRight color={colors.subtle} size={19} />
    </Pressable>
  );
}
export function Avatar({
  uri,
  name,
  size = 44,
}: {
  uri?: string | null;
  name: string;
  size?: number;
}) {
  const { colors, styles } = useStyles();
  if (uri)
    return (
      <Image
        source={{ uri }}
        alt={`${name} profile`}
        contentFit="cover"
        transition={180}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.soft,
        }}
      />
    );
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={styles.avatarText}>
        {name.trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
export function Rating({
  value,
  count,
}: {
  value?: number | null;
  count?: number;
}) {
  const { styles } = useStyles();
  if (!value || !count) return null;
  return (
    <View style={styles.rating}>
      <Star size={15} color="#f4b400" fill="#f4b400" />
      <Text style={styles.ratingText}>
        {value.toFixed(1)} ({count})
      </Text>
    </View>
  );
}
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const { colors, styles } = useStyles();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const { colors, styles } = useStyles();
  return (
    <View style={styles.empty}>
      <Inbox color={colors.subtle} size={34} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action}
    </View>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  const { styles } = useStyles();
  return (
    <Card>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.emptyBody}>{message}</Text>
      {retry ? (
        <Button title="Try again" variant="secondary" onPress={retry} />
      ) : null}
    </Card>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1 },
    scroll: { flexGrow: 1, paddingBottom: 34 },
    screenInner: {
      width: "100%",
      maxWidth: 720,
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingTop: 6,
      gap: 16,
    },
    edgeToEdge: { paddingHorizontal: 0 },
    header: {
      minHeight: 62,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    headerCopy: { flex: 1, gap: 2 },
    title: {
      color: colors.ink,
      fontSize: 24,
      lineHeight: 29,
      fontWeight: "900",
    },
    subtitle: { color: colors.muted, fontSize: 13, lineHeight: 18 },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.line,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      ...shadow,
    },
    listGroup: {
      backgroundColor: colors.surface,
      borderColor: colors.line,
      borderWidth: 1,
      borderRadius: 16,
      padding: 6,
      gap: 3,
      overflow: "hidden",
    },
    sectionHeader: {
      minHeight: 29,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 2,
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900",
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.soft,
      alignItems: "center",
      justifyContent: "center",
    },
    button: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      borderWidth: 1,
    },
    button_primary: {
      backgroundColor: colors.brand,
      borderColor: colors.brand,
    },
    button_secondary: {
      backgroundColor: colors.surface,
      borderColor: colors.line,
    },
    button_danger: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    button_ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
    buttonText: { fontSize: 14, fontWeight: "900" },
    buttonText_primary: { color: "white" },
    buttonText_secondary: { color: colors.ink },
    buttonText_danger: { color: "white" },
    buttonText_ghost: { color: colors.brand },
    pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
    disabled: { opacity: 0.42 },
    field: { gap: 7 },
    label: { fontSize: 14, color: colors.ink, fontWeight: "800" },
    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      backgroundColor: colors.soft,
      paddingHorizontal: 14,
      fontSize: 15,
      color: colors.ink,
    },
    textarea: { minHeight: 110, paddingTop: 12, textAlignVertical: "top" },
    inputError: { borderColor: colors.danger },
    error: { color: colors.danger, fontSize: 13 },
    placeholder: { color: colors.subtle },
    pill: {
      alignSelf: "flex-start",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 99,
      backgroundColor: colors.soft,
    },
    pill_neutral: {},
    pill_brand: { backgroundColor: colors.brand + "18" },
    pill_success: { backgroundColor: colors.successSoft },
    pill_warning: { backgroundColor: colors.warningSoft },
    pill_info: { backgroundColor: colors.infoSoft },
    pillText: {
      fontSize: 12,
      fontWeight: "900",
      textTransform: "capitalize",
      color: colors.muted,
    },
    pillText_neutral: {},
    pillText_brand: { color: colors.brandDark },
    pillText_success: { color: colors.success },
    pillText_warning: { color: colors.warning },
    pillText_info: { color: colors.info },
    row: {
      minHeight: 68,
      paddingHorizontal: 9,
      paddingVertical: 10,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rowPressed: { backgroundColor: colors.softStrong },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.soft,
      alignItems: "center",
      justifyContent: "center",
    },
    rowCopy: { flex: 1, gap: 3 },
    rowTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900",
    },
    rowSubtitle: { color: colors.muted, fontSize: 11.5, lineHeight: 16 },
    avatar: {
      backgroundColor: colors.ink,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: colors.canvas, fontSize: 18, fontWeight: "900" },
    rating: { flexDirection: "row", alignItems: "center", gap: 5 },
    ratingText: { fontWeight: "800", color: colors.ink, fontSize: 13 },
    center: {
      minHeight: 220,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    muted: { color: colors.muted },
    empty: {
      minHeight: 260,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.ink,
      textAlign: "center",
    },
    emptyBody: {
      maxWidth: 390,
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
    errorTitle: { color: colors.danger, fontSize: 18, fontWeight: "900" },
  });
}
