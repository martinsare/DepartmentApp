import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ClassSession } from "@/lib/types";
import { useColors } from "@/hooks/useColors";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "#EDE9FE", text: "#5B21B6", label: "Scheduled" },
  ongoing: { bg: "#D1FAE5", text: "#065F46", label: "Ongoing" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B", label: "Cancelled" },
  ended: { bg: "#F3F4F6", text: "#374151", label: "Ended" },
};

interface Props {
  session: ClassSession;
  onPress?: () => void;
}

export function ClassCard({ session, onPress }: Props) {
  const colors = useColors();
  const statusStyle = STATUS_COLORS[session.status] ?? STATUS_COLORS["scheduled"]!;

  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h ?? "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.courseInfo}>
          <Text style={[styles.code, { color: colors.primary }]}>{session.course_code}</Text>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {session.course_title}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.badgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Feather name="clock" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
            {formatTime(session.time)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
            {session.venue}
          </Text>
        </View>
        {session.lecturer_name && (
          <View style={styles.detailRow}>
            <Feather name="user" size={13} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
              {session.lecturer_name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  courseInfo: { flex: 1, marginRight: 8 },
  code: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  title: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  details: { gap: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
