import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 180 }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Feather name="grid" size={size * 0.45} color="#7C3AED" />
      <Text style={styles.label} numberOfLines={1}>
        {value.slice(0, 12).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    gap: 8,
  },
  label: {
    fontSize: 10,
    color: "#7C3AED",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
});
