import { MapPin, Minus, Plus, Search, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { api } from "@/lib/api";
import { useAppTheme } from "@/providers/theme-provider";

export type ServiceAreaValue = {
  id?: string;
  provider: "geoapify" | "photon" | "profile";
  placeId: string;
  label: string;
  locality: string;
  region: string;
  country: string;
  countryCode: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
  isPrimary: boolean;
};

type Props = {
  areas: ServiceAreaValue[];
  country: string;
  radiusKm: number;
  onAreasChange: (areas: ServiceAreaValue[]) => void;
  onRadiusChange: (radius: number) => void;
};

export function ServiceAreaPicker({ areas, country, radiusKm, onAreasChange, onRadiusChange }: Props) {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ServiceAreaValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedKeys = useMemo(
    () => new Set(areas.map((area) => `${area.provider}:${area.placeId}`)),
    [areas],
  );

  useEffect(() => {
    if (query.trim().length < 3 || areas.length >= 12) {
      setResults([]);
      setError("");
      return;
    }
    let active = true;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await api<{ areas?: ServiceAreaValue[] }>(
          `/api/localities/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (active) {
          setResults((payload.areas || []).filter(
            (area) => !selectedKeys.has(`${area.provider}:${area.placeId}`),
          ));
        }
      } catch (searchError) {
        if (active) setError(searchError instanceof Error ? searchError.message : "Could not search locations.");
      } finally {
        if (active) setLoading(false);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [areas.length, query, selectedKeys]);

  function addArea(area: ServiceAreaValue) {
    onAreasChange([...areas, { ...area, radiusKm, isPrimary: areas.length === 0 }]);
    setQuery("");
    setResults([]);
  }

  function removeArea(index: number) {
    onAreasChange(areas.filter((_, areaIndex) => areaIndex !== index).map(
      (area, areaIndex) => ({ ...area, isPrimary: areaIndex === 0 }),
    ));
  }

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Text style={[styles.label, { color: colors.ink }]}>Seller preference areas</Text>
        <Text style={[styles.count, { color: colors.muted }]}>{areas.length}/12</Text>
      </View>
      <Text style={[styles.help, { color: colors.muted }]}>Choose localities in {country || "your verified country"}.</Text>

      <View style={[styles.searchBox, { borderColor: colors.line, backgroundColor: colors.surface }]}>
        <Search size={18} color={colors.muted} />
        <TextInput
          accessibilityLabel="Search seller preference areas"
          value={query}
          onChangeText={setQuery}
          editable={areas.length < 12}
          placeholder={areas.length >= 12 ? "Maximum 12 areas selected" : "Search locality or postcode"}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          style={[styles.input, { color: colors.ink }]}
        />
        {loading ? <ActivityIndicator color={colors.brand} size="small" /> : null}
      </View>

      {results.length ? (
        <View style={[styles.results, { borderColor: colors.line, backgroundColor: colors.surface }]}>
          {results.map((area) => (
            <Pressable
              key={`${area.provider}:${area.placeId}`}
              accessibilityRole="button"
              onPress={() => addArea(area)}
              style={({ pressed }) => [styles.resultRow, pressed && { backgroundColor: colors.soft }]}
            >
              <MapPin size={17} color={colors.brand} />
              <Text style={[styles.resultText, { color: colors.ink }]}>{area.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <View style={[styles.selected, { borderColor: colors.line }]}>
        {areas.length ? areas.map((area, index) => (
          <View key={`${area.provider}:${area.placeId}`} style={[styles.areaRow, index > 0 && { borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <MapPin size={17} color={colors.brand} />
            <View style={styles.areaCopy}>
              <Text style={[styles.areaLabel, { color: colors.ink }]}>{area.label}</Text>
              <Text style={[styles.areaMeta, { color: colors.muted }]}>{index === 0 ? "Primary area" : `Within ${radiusKm} km`}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${area.label}`} onPress={() => removeArea(index)} style={styles.iconButton}>
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>
        )) : (
          <Text style={[styles.empty, { color: colors.muted }]}>No preferred service areas selected.</Text>
        )}
      </View>

      <View style={styles.radiusRow}>
        <View>
          <Text style={[styles.label, { color: colors.ink }]}>Travel radius</Text>
          <Text style={[styles.help, { color: colors.muted }]}>Applied to every selected area</Text>
        </View>
        <View style={[styles.stepper, { borderColor: colors.line }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Decrease travel radius" onPress={() => onRadiusChange(Math.max(1, radiusKm - 5))} style={styles.iconButton}>
            <Minus size={17} color={colors.ink} />
          </Pressable>
          <Text style={[styles.radiusValue, { color: colors.ink }]}>{radiusKm} km</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Increase travel radius" onPress={() => onRadiusChange(Math.min(100, radiusKm + 5))} style={styles.iconButton}>
            <Plus size={17} color={colors.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  label: { fontSize: 14, fontWeight: "800" },
  count: { fontSize: 12, fontWeight: "700" },
  help: { fontSize: 12, lineHeight: 18 },
  searchBox: { minHeight: 48, borderWidth: 1, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12 },
  input: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 10 },
  results: { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  resultRow: { minHeight: 46, flexDirection: "row", alignItems: "flex-start", gap: 9, paddingHorizontal: 12, paddingVertical: 12 },
  resultText: { flex: 1, fontSize: 14, lineHeight: 20 },
  error: { fontSize: 13, fontWeight: "700", lineHeight: 18 },
  selected: { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  areaRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  areaCopy: { flex: 1, minWidth: 0 },
  areaLabel: { fontSize: 14, lineHeight: 19, fontWeight: "700" },
  areaMeta: { marginTop: 2, fontSize: 12 },
  iconButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  empty: { padding: 16, textAlign: "center", fontSize: 13 },
  radiusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  stepper: { height: 42, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 8 },
  radiusValue: { width: 62, textAlign: "center", fontSize: 13, fontWeight: "800" },
});
