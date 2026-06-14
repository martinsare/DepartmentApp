import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function AdminAnalytics() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { courses, sessions, attendance, users, payments, contributions } = useData();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const students = users.filter((u) => u.role === "student");
  const totalSessions = sessions.filter((s) => s.status === "ended" || s.status === "ongoing").length;
  const attendanceRate = totalSessions > 0 ? Math.round((attendance.length / (totalSessions * students.length)) * 100) : 0;
  const totalCollected = payments.filter((p) => p.status === "paid").reduce((acc, p) => acc + p.amount, 0);
  const totalTarget = contributions.reduce((acc, c) => acc + c.target_amount, 0);
  const collectionRate = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  const courseAttendance = courses.map((course) => {
    const courseSessions = sessions.filter((s) => s.course_id === course.id && (s.status === "ended" || s.status === "ongoing"));
    const courseAttended = attendance.filter((a) => courseSessions.some((s) => s.id === a.session_id)).length;
    const max = courseSessions.length * (course.enrolled_count ?? 1);
    const rate = max > 0 ? Math.round((courseAttended / max) * 100) : 0;
    return { course, rate, courseSessions: courseSessions.length, courseAttended };
  });

  const METRICS = [
    { label: "Total Students", value: students.length, icon: "users", color: "#3B82F6" },
    { label: "Total Sessions", value: totalSessions, icon: "calendar", color: colors.primary },
    { label: "Attendance Rate", value: `${attendanceRate}%`, icon: "check-circle", color: "#10B981" },
    { label: "Collection Rate", value: `${collectionRate}%`, icon: "dollar-sign", color: "#F59E0B" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Analytics</Text>

      {/* Key metrics */}
      <View style={styles.metricsGrid}>
        {METRICS.map((m) => (
          <View key={m.label} style={[styles.metricCard, { backgroundColor: m.color + "12", borderColor: m.color + "30" }]}>
            <View style={[styles.metricIcon, { backgroundColor: m.color }]}>
              <Feather name={m.icon as any} size={18} color="#fff" />
            </View>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{m.value}</Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Attendance by course */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Attendance by Course</Text>
      {courseAttendance.map(({ course, rate }) => (
        <View key={course.id} style={[styles.courseRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.courseInfo}>
            <Text style={[styles.courseCode, { color: colors.primary }]}>{course.code}</Text>
            <Text style={[styles.courseTitle, { color: colors.foreground }]} numberOfLines={1}>{course.title}</Text>
          </View>
          <View style={styles.rateSection}>
            <Text style={[styles.rate, { color: rate >= 75 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#EF4444" }]}>{rate}%</Text>
            <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.miniBarFill, { width: `${rate}%` as any, backgroundColor: rate >= 75 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#EF4444" }]} />
            </View>
          </View>
        </View>
      ))}

      {/* Collection progress */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contribution Collection</Text>
      {contributions.map((c) => {
        const paid = payments.filter((p) => p.contribution_id === c.id && p.status === "paid").reduce((acc, p) => acc + p.amount, 0);
        const pct = c.target_amount > 0 ? Math.round((paid / c.target_amount) * 100) : 0;
        return (
          <View key={c.id} style={[styles.collectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.collectionHeader}>
              <Text style={[styles.collectionTitle, { color: colors.foreground }]}>{c.title}</Text>
              <Text style={[styles.collectionPct, { color: colors.primary }]}>{pct}%</Text>
            </View>
            <View style={[styles.collectionBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.collectionBarFill, { backgroundColor: colors.primary, width: `${pct}%` as any }]} />
            </View>
            <View style={styles.collectionAmounts}>
              <Text style={[styles.collectionCollected, { color: colors.foreground }]}>₦{paid.toLocaleString()} collected</Text>
              <Text style={[styles.collectionTarget, { color: colors.mutedForeground }]}>of ₦{c.target_amount.toLocaleString()}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 20 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  metricCard: { width: "47%", borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
  metricIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  metricValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  metricLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  courseRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
  courseInfo: { flex: 1 },
  courseCode: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  courseTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  rateSection: { alignItems: "flex-end", gap: 4, minWidth: 60 },
  rate: { fontSize: 18, fontFamily: "Inter_700Bold" },
  miniBarBg: { width: 60, height: 4, borderRadius: 2, overflow: "hidden" },
  miniBarFill: { height: "100%", borderRadius: 2 },
  collectionCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12, gap: 10 },
  collectionHeader: { flexDirection: "row", justifyContent: "space-between" },
  collectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  collectionPct: { fontSize: 16, fontFamily: "Inter_700Bold" },
  collectionBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  collectionBarFill: { height: "100%", borderRadius: 3 },
  collectionAmounts: { flexDirection: "row", justifyContent: "space-between" },
  collectionCollected: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  collectionTarget: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
