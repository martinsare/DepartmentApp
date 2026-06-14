import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  bg?: string;
}

export function StatsCard({ label, value, icon, color, bg }: Props) {
  const colors = useColors();
  const iconColor = color ?? colors.primary;
  const bgColor = bg ?? colors.card;

  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + "20" }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: 22, fontFamily: "Inter_700Bold" },
  label: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
});
