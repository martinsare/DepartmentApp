import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { ClassSession } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "#3B82F615", text: "#3B82F6" },
  ongoing: { bg: "#10B98115", text: "#10B981" },
  ended: { bg: "#6B728015", text: "#6B7280" },
  completed: { bg: "#6B728015", text: "#6B7280" },
  cancelled: { bg: "#EF444415", text: "#EF4444" },
};

function detectConflicts(sessions: ClassSession[]): Set<string> {
  const conflicts = new Set<string>();
  const bySemDate: Record<string, ClassSession[]> = {};
  for (const s of sessions) {
    if (s.status === "cancelled" || s.status === "ended" || s.status === "completed") continue;
    const key = s.date;
    if (!bySemDate[key]) bySemDate[key] = [];
    bySemDate[key].push(s);
  }
  for (const group of Object.values(bySemDate)) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i]!;
        const b = group[j]!;
        if (a.time === b.time) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
  }
  return conflicts;
}

export default function StudentClasses() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sessions, enrollments } = useData();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]!;

  const enrolledCourseIds = enrollments
    .filter((e) => e.student_id === user?.id)
    .map((e) => e.course_id);

  const mySessions = enrolledCourseIds.length > 0
    ? sessions.filter((s) => enrolledCourseIds.includes(s.course_id))
    : sessions;

  const upcomingSessions = mySessions
    .filter((s) => s.date >= todayStr && s.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const pastSessions = mySessions
    .filter((s) => s.date < todayStr || s.status === "ended" || s.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date));

  const filtered = selectedDay
    ? mySessions.filter((s) => {
        const d = new Date(s.date);
        return DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1] === selectedDay;
      })
    : upcomingSessions;

  const conflicts = detectConflicts(mySessions);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const SessionCard = ({ s, showDate = true }: { s: ClassSession; showDate?: boolean }) => {
    const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS.scheduled;
    const isToday = s.date === todayStr;
    const hasConflict = conflicts.has(s.id);
    const isLive = s.status === "ongoing";
    const isExpired = s.expires_at ? new Date() > new Date(s.expires_at) : false;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: hasConflict ? "#F59E0B" : colors.border }]}>
        {isToday && <View style={[styles.todayBanner, { backgroundColor: colors.primary }]}><Text style={styles.todayText}>TODAY</Text></View>}
        {isLive && <View style={[styles.liveBanner, { backgroundColor: "#10B981" }]}><Feather name="radio" size={10} color="#fff" /><Text style={styles.liveText}>LIVE</Text></View>}
        <View style={styles.cardRow}>
          <View style={[styles.codeBadge, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.codeText, { color: colors.primary }]}>{s.course_code}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{s.course_title}</Text>
            <View style={styles.metaRow}>
              {showDate && (
                <>
                  <Feather name="calendar" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{s.date}</Text>
                </>
              )}
              <Feather name="clock" size={11} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{s.time}</Text>
              <Feather name="map-pin" size={11} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{s.venue}</Text>
            </View>
            {hasConflict && (
              <View style={styles.conflictRow}>
                <Feather name="alert-triangle" size={11} color="#F59E0B" />
                <Text style={styles.conflictText}>Schedule conflict</Text>
              </View>
            )}
            {isExpired && isLive && (
              <View style={styles.expiredRow}>
                <Feather name="clock" size={11} color="#EF4444" />
                <Text style={styles.expiredText}>QR expired — contact lecturer</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{s.status}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <OfflineBanner visible={isOffline} />
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerSub}>My Timetable</Text>
        <Text style={styles.headerTitle}>Classes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayBtn, selectedDay === day && styles.dayBtnActive]}
              onPress={() => setSelectedDay(selectedDay === day ? null : day)}
            >
              <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="calendar" size={36} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              {selectedDay ? `No classes on ${selectedDay}` : "No upcoming classes"}
            </Text>
          </View>
        ) : (
          <>
            {!selectedDay && upcomingSessions.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming</Text>
                {upcomingSessions.slice(0, 10).map((s) => (
                  <SessionCard key={s.id} s={s} />
                ))}
              </>
            )}
            {selectedDay && filtered.map((s) => (
              <SessionCard key={s.id} s={s} showDate={false} />
            ))}
          </>
        )}

        {!selectedDay && pastSessions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Past Sessions</Text>
            {pastSessions.slice(0, 5).map((s) => (
              <View key={s.id} style={[styles.pastCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.pastCode, { color: colors.mutedForeground }]}>{s.course_code}</Text>
                <Text style={[styles.pastMeta, { color: colors.mutedForeground }]}>{s.date} · {s.venue}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[s.status]?.bg ?? "#6B728015" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[s.status]?.text ?? "#6B7280" }]}>{s.status}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2, marginBottom: 14 },
  dayRow: { gap: 8 },
  dayBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)" },
  dayBtnActive: { backgroundColor: "#fff" },
  dayText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_500Medium" },
  dayTextActive: { color: "#7C3AED" },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 40, alignItems: "center", gap: 10, marginTop: 8 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 10, overflow: "hidden" },
  todayBanner: { paddingHorizontal: 14, paddingVertical: 5 },
  todayText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  liveBanner: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 5 },
  liveText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  codeBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  codeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" },
  metaText: { fontSize: 11, fontFamily: "Inter_400Regular", marginRight: 4 },
  conflictRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  conflictText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#F59E0B" },
  expiredRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  expiredText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#EF4444" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  pastCard: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  pastCode: { fontSize: 12, fontFamily: "Inter_700Bold", flex: 1 },
  pastMeta: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 2 },
});
