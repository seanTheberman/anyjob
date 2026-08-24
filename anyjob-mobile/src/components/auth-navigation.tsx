import { Href, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/theme/tokens";

export function AuthBackButton({
  fallback = "/(auth)/sign-in",
  label = "Back to sign in",
}: {
  fallback?: Href;
  label?: string;
}) {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={goBack}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <ChevronLeft color={colors.ink} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    left: 0,
    top: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
