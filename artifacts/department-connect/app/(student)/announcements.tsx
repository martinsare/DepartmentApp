import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { Announcement } from "@/lib/demoData";

const FILTERS = ["all", "general", "assignment", "test", "emergency"] as const;
type Filter = (typeof FILTERS)[number];

export default function StudentAnnouncements() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { announcements, markAnnouncementRead } = useData();
  const [filter, setFilter] = useState<Filter>("all");
  const topPad = insets.top;

  const filtered =
    filter === "all" ? announcements : announcements.filter((a) => a.type === filter);

  const unreadCount = announcements.filter((a) => !a.read).length;

  const emergencies = filtered.filter((a) => a.type === "emergency");
  const rest = filtered.filter((a) => a.type !== "emergency");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Announcements</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                filter === f
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[styles.filterText, { color: filter === f ? "#fff" : colors.mutedForeground }]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bell-off" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No announcements</Text>
          </View>
        ) : (
          <>
            {emergencies.map((ann) => (
              <AnnouncementCard key={ann.id} announcement={ann} onPress={() => markAnnouncementRead(ann.id)} />
            ))}
            {rest.map((ann) => (
              <AnnouncementCard key={ann.id} announcement={ann} onPress={() => markAnnouncementRead(ann.id)} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  filtersScroll: { marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
