import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/providers/theme-provider";

export type FormOption = {
  value: string;
  label: string;
  description?: string;
};

export function OptionCards({
  options,
  value,
  selectedValues,
  onChange,
  columns = 1,
}: {
  options: readonly FormOption[];
  value: string;
  selectedValues?: string[];
  onChange: (value: string) => void;
  columns?: 1 | 2;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.options}>
      {options.map((option) => {
        const selected = selectedValues
          ? selectedValues.includes(option.value)
          : option.value === value;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              columns === 2 && styles.half,
              {
                backgroundColor: selected ? colors.infoSoft : colors.surface,
                borderColor: selected ? colors.brand : colors.line,
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.optionCopy}>
              <Text style={[styles.label, { color: colors.ink }]}>
                {option.label}
              </Text>
              {option.description ? (
                <Text style={[styles.description, { color: colors.muted }]}>
                  {option.description}
                </Text>
              ) : null}
            </View>
            <View
              style={[
                styles.check,
                {
                  borderColor: selected ? colors.brand : colors.line,
                  backgroundColor: selected ? colors.brand : colors.surface,
                },
              ]}
            >
              {selected ? (
                <Check color="white" size={13} strokeWidth={3} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ChipPicker({
  options,
  values,
  onToggle,
}: {
  options: readonly FormOption[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = values.includes(option.value);
        return (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? colors.brand : colors.soft,
                borderColor: selected ? colors.brand : colors.line,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: selected ? "white" : colors.ink },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  option: {
    width: "100%",
    minHeight: 62,
    borderWidth: 1.5,
    borderRadius: 13,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  half: { width: "48.5%" },
  optionCopy: { flex: 1, minWidth: 0, gap: 3 },
  label: { fontSize: 13.5, lineHeight: 18, fontWeight: "900" },
  description: { fontSize: 11, lineHeight: 16 },
  check: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 37,
    borderWidth: 1,
    borderRadius: 19,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 11.5, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
