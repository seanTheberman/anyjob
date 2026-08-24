import { Tabs } from "expo-router";
import {
  Briefcase,
  Home,
  LogIn,
  MessageCircle,
  Search,
  UserRound,
} from "lucide-react-native";
import { useAuth } from "@/providers/auth-provider";
import { useAppTheme } from "@/providers/theme-provider";

export default function AppLayout() {
  const { loading, user } = useAuth();
  const { colors } = useAppTheme();
  const provider =
    user?.role === "seller" ||
    user?.role === "provider" ||
    user?.role === "contractor";
  if (loading) return null;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "800" },
        tabBarItemStyle: { paddingTop: 3 },
        tabBarStyle: {
          height: 70,
          paddingTop: 5,
          paddingBottom: 8,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          backgroundColor: colors.tabBar,
          elevation: 0,
          boxShadow: "none",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: !user ? "Providers" : provider ? "Find work" : "Browse",
          tabBarIcon: ({ color }) => <Search color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          title: !user ? "Jobs" : provider ? "My jobs" : "Tasks",
          tabBarIcon: ({ color }) => <Briefcase color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: user ? "Profile" : "Sign in",
          tabBarIcon: ({ color }) =>
            user ? <UserRound color={color} size={22} /> : <LogIn color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
