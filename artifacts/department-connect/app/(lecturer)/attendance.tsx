import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function LecturerAttendance() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sessions, attendance, courses, users } = useData();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const mySessions = sessions.filter((s) => s.lecturer_id === user?.id);
  const endedSessions = mySessions.filter((s) => s.status === "ended" || s.status === "completed" || s.status === "ongoing");
  const students = users.filter((u) => u.role === "student" && u.status === "active");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const sessionStats = endedSessions.map((s) => {
    const records = attendance.filter((a) => a.session_id === s.id);
    const rate = students.length > 0 ? Math.round((records.length / students.length) * 100) : 0;
    return { session: s, records, rate };
  });

  const selectedRecords = selectedSession
    ? attendance.filter((a) => a.session_id === selectedSession)
    : [];
  const selectedSess = selectedSession ? endedSessions.find((s) => s.id === selectedSession) : null;

  const overallRate = endedSessions.length > 0 && students.length > 0
    ? Math.round((attendance.filter((a) => endedSessions.some((s) => s.id === a.session_id)).length / (endedSessions.length * students.length)) * 100)
    : 0;

  if (selectedSession && selectedSess) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedSession(null)}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedSess.course_code} · {selectedSess.date}</Text>
          <Text style={styles.headerSub}>{selectedRecords.length} students checked in</Text>
        </LinearGradient>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}>
          {selectedRecords.length === 0 ? (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="user-x" size={36} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No check-ins recorded</Text>
            </View>
          ) : selectedRecords.map((r, i) => (
            <View key={r.id} style={[styles.recordRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.recordIndex, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.recordIndexText, { color: colors.primary }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.recordName, { color: colors.foreground }]}>{r.student_name ?? r.matric_number}</Text>
                {r.student_name && <Text style={[styles.recordMeta, { color: colors.mutedForeground }]}>{r.matric_number}</Text>}
              </View>
              <View style={styles.timeTag}>
                <Feather name="clock" size={11} color="#10B981" />
                <Text style={[styles.timeText, { color: "#10B981" }]}>{r.time_recorded}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerSub}>Attendance Records</Text>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{endedSessions.length}</Text>
            <Text style={styles.summaryLabel}>Sessions</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{overallRate}%</Text>
            <Text style={styles.summaryLabel}>Avg Rate</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{students.length}</Text>
            <Text style={styles.summaryLabel}>Students</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {sessionStats.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="bar-chart-2" size={36} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No completed sessions yet</Text>
          </View>
        ) : sessionStats.map(({ session, records, rate }) => (
          <TouchableOpacity
            key={session.id}
            style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setSelectedSession(session.id)}
            activeOpacity={0.85}
          >
            <View style={styles.sessionCardTop}>
              <View style={[styles.codeBadge, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.codeText, { color: colors.primary }]}>{session.course_code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sessionTitle, { color: colors.foreground }]} numberOfLines={1}>{session.course_title}</Text>
                <Text style={[styles.sessionMeta, { color: colors.mutedForeground }]}>{session.date} · {session.time}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={[styles.rateText, { color: rate >= 70 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#EF4444" }]}>{rate}%</Text>
                <Text style={[styles.countText, { color: colors.mutedForeground }]}>{records.length}/{students.length}</Text>
              </View>
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
              <View style={[styles.barFill, {
                width: `${rate}%` as any,
                backgroundColor: rate >= 70 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#EF4444",
              }]} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: { marginBottom: 8 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  summaryRow: { flexDirection: "row", marginTop: 16, gap: 0 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  summaryLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  scroll: { padding: 16 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 40, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  sessionCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, gap: 10 },
  sessionCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  codeBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  codeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  sessionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sessionMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  rateText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  countText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  barBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  recordRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  recordIndex: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  recordIndexText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  recordName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  recordMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  timeTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
