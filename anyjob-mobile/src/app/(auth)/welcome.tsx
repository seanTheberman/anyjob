import { Link } from "expo-router";
import { BriefcaseBusiness, Search, ShieldCheck } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Button, Screen } from "@/components/ui";
import { colors } from "@/theme/tokens";

const benefits = [
  ["Find trusted help", "Compare providers, quotes, and genuine reviews.", Search],
  ["Find flexible work", "Service jobs, business shifts, and clear earnings.", BriefcaseBusiness],
  ["Build marketplace trust", "One verified profile across every AnyJob role.", ShieldCheck],
] as const;

export default function WelcomeScreen() {
  return <Screen style={styles.screen}><View style={styles.brand}><Text style={styles.logo}>AnyJob</Text><Text style={styles.headline}>Get more done, your way.</Text><Text style={styles.lead}>Hire local help, find work, or manage a flexible workforce from one account.</Text></View><View style={styles.benefits}>{benefits.map(([title, body, Icon]) => <View key={title} style={styles.benefit}><View style={styles.icon}><Icon color={colors.brand} size={22} /></View><View style={styles.copy}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitBody}>{body}</Text></View></View>)}</View><View style={styles.actions}><Link href="/(auth)/sign-in" asChild><Button title="Sign in" /></Link><Link href="/(auth)/register" asChild><Button title="Create account" variant="secondary" /></Link></View></Screen>;
}

const styles = StyleSheet.create({
  screen: { justifyContent: "space-between", minHeight: 690, paddingBottom: 20 },
  brand: { paddingTop: 54, gap: 10 },
  logo: { color: colors.brand, fontSize: 30, fontWeight: "900" },
  headline: { color: colors.ink, fontSize: 38, lineHeight: 44, fontWeight: "800", maxWidth: 520 },
  lead: { color: colors.muted, fontSize: 17, lineHeight: 25, maxWidth: 520 },
  benefits: { gap: 20, paddingVertical: 20 },
  benefit: { flexDirection: "row", alignItems: "flex-start", gap: 13 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#fff0f1" },
  copy: { flex: 1, gap: 3 },
  benefitTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  benefitBody: { color: colors.muted, lineHeight: 20 },
  actions: { gap: 10 },
});
