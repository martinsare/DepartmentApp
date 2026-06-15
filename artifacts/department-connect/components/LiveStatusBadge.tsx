import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { LiveStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  LiveStatus["status"],
  { label: string; color: string; pulse: boolean }
> = {
  lecturer_arrived: { label: "Lecturer Present", color: "#10B981", pulse: true },
  class_started: { label: "Class Started", color: "#10B981", pulse: true },
  entry_open: { label: "Entry Open", color: "#10B981", pulse: true },
  entry_closing: { label: "Entry Closing Soon", color: "#F59E0B", pulse: true },
  entry_closed: { label: "Entry Closed", color: "#EF4444", pulse: false },
  class_ended: { label: "Class Ended", color: "#6B7280", pulse: false },
};

interface Props {
  status: LiveStatus["status"];
}

export function LiveStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status];
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!config.pulse) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [config.pulse, pulse]);

  return (
    <View style={[styles.badge, { backgroundColor: config.color + "20" }]}>
      <Animated.View
        style={[styles.dot, { backgroundColor: config.color, opacity: config.pulse ? pulse : 1 }]}
      />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
