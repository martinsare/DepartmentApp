import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Announcement } from "@/lib/demoData";
import { useColors } from "@/hooks/useColors";

const TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  general: { bg: "#EDE9FE", text: "#5B21B6", icon: "info" },
  assignment: { bg: "#DBEAFE", text: "#1D4ED8", icon: "file-text" },
  test: { bg: "#FEF3C7", text: "#92400E", icon: "edit-2" },
  emergency: { bg: "#FEE2E2", text: "#991B1B", icon: "alert-triangle" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  announcement: Announcement;
  onPress?: () => void;
}

export function AnnouncementCard({ announcement, onPress }: Props) {
  const colors = useColors();
  const typeStyle = TYPE_COLORS[announcement.type] ?? TYPE_COLORS["general"]!;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: announcement.read ? colors.border : colors.primary,
          borderLeftWidth: announcement.read ? 1 : 3,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
          <Feather name={typeStyle.icon as any} size={11} color={typeStyle.text} />
          <Text style={[styles.typeText, { color: typeStyle.text }]}>
            {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
          </Text>
        </View>
        <View style={styles.meta}>
          {!announcement.read && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(announcement.created_at)}
          </Text>
        </View>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{announcement.title}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={2}>
        {announcement.body}
      </Text>
      <Text style={[styles.author, { color: colors.mutedForeground }]}>
        — {announcement.author_name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  typeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  time: { fontSize: 11, fontFamily: "Inter_400Regular" },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  body: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginBottom: 8 },
  author: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic" },
});
