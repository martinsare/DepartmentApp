import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function AdminAnalytics() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { users, courses, sessions, attendance, payments, contributions } = useData();

  const students = users.filter((u) => u.role === "student" && u.status === "active");
  const lecturers = users.filter((u) => u.role === "lecturer" && u.status === "active");
  const pendingUsers = users.filter((u) => u.status === "pending");
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalTarget = contributions.reduce((s, c) => s + c.target_amount, 0);
  const paymentRate = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;
  const endedSessions = sessions.filter((s) => s.status === "ended" || s.status === "completed");
  const avgAttendance = endedSessions.length > 0
    ? Math.round((attendance.length / endedSessions.length) * 10) / 10
    : 0;
  const overallAttRate = endedSessions.length > 0 && students.length > 0
    ? Math.round((attendance.length / (endedSessions.length * students.length)) * 100)
    : 0;

  const courseStats = courses.map((c) => {
    const cSessions = sessions.filter((s) => s.course_id === c.id && (s.status === "ended" || s.status === "completed"));
    const cAtt = attendance.filter((a) => cSessions.some((s) => s.id === a.session_id));
    const attRate = cSessions.length > 0 && students.length > 0
      ? Math.round((cAtt.length / (cSessions.length * students.length)) * 100)
      : 0;
    return { course: c, sessions: cSessions.length, attendance: cAtt.length, attRate };
  }).sort((a, b) => b.attRate - a.attRate);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const KPI_CARDS = [
    { label: "Active Students", value: students.length, sub: `${pendingUsers.length} pending approval`, icon: "users" as const, color: "#7C3AED" },
    { label: "Active Lecturers", value: lecturers.length, sub: `${courses.length} courses assigned`, icon: "briefcase" as const, color: "#10B981" },
    { label: "Total Sessions", value: sessions.length, sub: `${endedSessions.length} completed`, icon: "calendar" as const, color: "#3B82F6" },
    { label: "Avg Attendance", value: `${avgAttendance}`, sub: "students per session", icon: "check-circle" as const, color: "#F59E0B" },
    { label: "Payment Rate", value: `${paymentRate}%`, sub: `₦${totalPaid.toLocaleString()} collected`, icon: "credit-card" as const, color: "#EF4444" },
    { label: "Attendance Rate", value: `${overallAttRate}%`, sub: "across all sessions", icon: "bar-chart-2" as const, color: "#8B5CF6" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerSub}>Department Overview</Text>
        <Text style={styles.headerTitle}>Analytics</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Key Metrics</Text>
        <View style={styles.kpiGrid}>
          {KPI_CARDS.map((k) => (
            <View key={k.label} style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.kpiIcon, { backgroundColor: k.color + "15" }]}>
                <Feather name={k.icon} size={17} color={k.color} />
              </View>
              <Text style={[styles.kpiValue, { color: colors.foreground }]}>{k.value}</Text>
              <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{k.label}</Text>
              <Text style={[styles.kpiSub, { color: colors.mutedForeground }]}>{k.sub}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Attendance by Course</Text>
        {courseStats.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No session data yet</Text>
          </View>
        ) : courseStats.map(({ course, sessions: sc, attendance: att, attRate }) => (
          <View key={course.id} style={[styles.courseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.courseHeader}>
              <View style={[styles.codeBadge, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.codeText, { color: colors.primary }]}>{course.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.courseTitle, { color: colors.foreground }]} numberOfLines={1}>{course.title}</Text>
                <Text style={[styles.courseMeta, { color: colors.mutedForeground }]}>{sc} sessions · {att} check-ins</Text>
              </View>
              <Text style={[styles.attRate, { color: attRate >= 70 ? "#10B981" : attRate >= 50 ? "#F59E0B" : "#EF4444" }]}>{attRate}%</Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
              <View style={[styles.barFill, {
                width: `${attRate}%` as any,
                backgroundColor: attRate >= 70 ? "#10B981" : attRate >= 50 ? "#F59E0B" : "#EF4444",
              }]} />
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>User Distribution</Text>
        <View style={[styles.distCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Students", count: students.length, color: "#7C3AED" },
            { label: "Lecturers", count: lecturers.length, color: "#10B981" },
            { label: "Pending", count: pendingUsers.length, color: "#F59E0B" },
          ].map((r) => {
            const pct = users.length > 0 ? Math.round((r.count / users.length) * 100) : 0;
            return (
              <View key={r.label} style={styles.distRow}>
                <View style={styles.distLabel}>
                  <View style={[styles.distDot, { backgroundColor: r.color }]} />
                  <Text style={[styles.distName, { color: colors.foreground }]}>{r.label}</Text>
                </View>
                <View style={[styles.distBarBg, { backgroundColor: colors.muted }]}>
                  <View style={[styles.distBarFill, { width: `${pct}%` as any, backgroundColor: r.color }]} />
                </View>
                <Text style={[styles.distCount, { color: colors.mutedForeground }]}>{r.count}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 14, marginTop: 8 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  kpiCard: { width: "47%", borderWidth: 1, borderRadius: 16, padding: 14, gap: 4 },
  kpiIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  kpiValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  kpiLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  kpiSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: { borderWidth: 1, borderRadius: 16, padding: 30, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  courseCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8, gap: 10 },
  courseHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  codeBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  codeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  courseTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  courseMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  attRate: { fontSize: 18, fontFamily: "Inter_700Bold" },
  barBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  distCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  distRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  distLabel: { flexDirection: "row", alignItems: "center", gap: 7, width: 80 },
  distDot: { width: 8, height: 8, borderRadius: 4 },
  distName: { fontSize: 12, fontFamily: "Inter_500Medium" },
  distBarBg: { flex: 1, height: 7, borderRadius: 4, overflow: "hidden" },
  distBarFill: { height: "100%", borderRadius: 4 },
  distCount: { fontSize: 13, fontFamily: "Inter_700Bold", width: 28, textAlign: "right" },
});
