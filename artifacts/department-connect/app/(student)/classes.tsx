import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClassCard } from "@/components/ClassCard";
import { LiveStatusBadge } from "@/components/LiveStatusBadge";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function StudentClasses() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, liveStatus } = useData();
  const [tab, setTab] = useState<"today" | "upcoming">("today");
  const topPad = insets.top;

  const todayStr = new Date().toISOString().split("T")[0]!;
  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const upcomingSessions = sessions.filter(
    (s) => s.date > todayStr && s.status !== "cancelled"
  );

  const displaySessions = tab === "today" ? todaySessions : upcomingSessions;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Classes</Text>
        <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
          {(["today", "upcoming"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && { backgroundColor: colors.primary }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? "#fff" : colors.mutedForeground }]}>
                {t === "today" ? "Today" : "Upcoming"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {displaySessions.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="calendar" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No {tab === "today" ? "classes today" : "upcoming classes"}
            </Text>
          </View>
        ) : (
          displaySessions.map((s) => (
            <View key={s.id}>
              {liveStatus[s.id] && s.status === "ongoing" && (
                <View style={{ marginBottom: 8 }}>
                  <LiveStatusBadge status={liveStatus[s.id]!.status} />
                </View>
              )}
              <ClassCard session={s} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 16 },
  tabs: { flexDirection: "row", borderRadius: 12, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
