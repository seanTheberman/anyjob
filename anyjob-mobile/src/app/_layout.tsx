import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppQueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider, useAppTheme } from "@/providers/theme-provider";

LogBox.ignoreLogs(["Unknown event handler property"]);

function NavigationRoot() {
  const { colors, isDark } = useAppTheme();
  return <><StatusBar style={isDark ? "light" : "dark"} /><Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: colors.canvas } }} /></>;
}

export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><ThemeProvider><AppQueryProvider><AuthProvider>
    <NavigationRoot />
  </AuthProvider></AppQueryProvider></ThemeProvider></SafeAreaProvider></GestureHandlerRootView>;
}
