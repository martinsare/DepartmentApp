import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QRScanner } from "@/components/QRScanner";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function StudentAttendance() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { attendance, sessions, courses, addAttendance } = useData();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null);

  const myAttendance = attendance.filter((a) => a.student_id === user?.id);
  const validSessions = sessions.filter((s) => s.status === "ended" || s.status === "completed" || s.status === "ongoing");
  const attended = myAttendance.length;
  const total = validSessions.length;
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleScanned = (data: string) => {
    setScannerOpen(false);
    try {
      const parsed = JSON.parse(data) as { session_id?: string };
      const session = sessions.find((s) => s.id === parsed.session_id);
      if (!session || !user) throw new Error("invalid");
      const alreadyMarked = myAttendance.some((a) => a.session_id === session.id);
      if (alreadyMarked) throw new Error("already");
      const now = new Date();
      addAttendance({
        id: `att-${Date.now()}`,
        session_id: session.id,
        student_id: user.id,
        student_name: user.full_name,
        matric_number: user.matric_number ?? "",
        time_recorded: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
        course_title: session.course_title,
        session_date: session.date,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanResult("success");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanResult("error");
    }
    setTimeout(() => setScanResult(null), 3500);
  };

  const courseStats = courses.map((course) => {
    const courseSessions = validSessions.filter((s) => s.course_id === course.id);
    const att = myAttendance.filter((a) => courseSessions.some((s) => s.id === a.session_id)).length;
    const t = courseSessions.length;
    const rate = t > 0 ? Math.round((att / t) * 100) : 0;
    return { course, att, total: t, rate };
  }).filter((c) => c.total > 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerSub}>My Attendance</Text>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={styles.summaryWrap}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryPct}>{pct}%</Text>
            <Text style={styles.summaryLabel}>Overall Rate</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${pct}%` as any }]} />
            </View>
            <Text style={styles.summaryCount}>{attended} of {total} sessions</Text>
          </View>
          <TouchableOpacity style={styles.scannerBtn} onPress={() => setScannerOpen(true)}>
            <Feather name="maximize" size={28} color="#7C3AED" />
            <Text style={styles.scannerBtnText}>Scan QR</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {scanResult === "success" && (
        <View style={[styles.resultBanner, { backgroundColor: "#D1FAE5" }]}>
          <Feather name="check-circle" size={16} color="#065F46" />
          <Text style={[styles.resultText, { color: "#065F46" }]}>Attendance recorded!</Text>
        </View>
      )}
      {scanResult === "error" && (
        <View style={[styles.resultBanner, { backgroundColor: "#FEE2E2" }]}>
          <Feather name="alert-circle" size={16} color="#991B1B" />
          <Text style={[styles.resultText, { color: "#991B1B" }]}>Invalid or expired QR code</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {courseStats.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By Course</Text>
            {courseStats.map(({ course, att, total: t, rate }) => (
              <View key={course.id} style={[styles.courseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.courseHeader}>
                  <View style={[styles.codeBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.codeText, { color: colors.primary }]}>{course.code}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.courseTitle, { color: colors.foreground }]} numberOfLines={1}>{course.title}</Text>
                    <Text style={[styles.courseMeta, { color: colors.mutedForeground }]}>{att}/{t} sessions</Text>
                  </View>
                  <Text style={[styles.courseRate, { color: rate >= 75 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#EF4444" }]}>{rate}%</Text>
                </View>
                <View style={[styles.courseBar, { backgroundColor: colors.muted }]}>
                  <View style={[styles.courseBarFill, {
                    width: `${rate}%` as any,
                    backgroundColor: rate >= 75 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#EF4444",
                  }]} />
                </View>
              </View>
            ))}
          </>
        )}

        {myAttendance.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Check-in History</Text>
            {myAttendance.map((record) => (
              <View key={record.id} style={[styles.historyRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.checkBadge, { backgroundColor: "#D1FAE5" }]}>
                  <Feather name="check" size={14} color="#065F46" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyTitle, { color: colors.foreground }]}>{record.course_title ?? "Class Session"}</Text>
                  <Text style={[styles.historyMeta, { color: colors.mutedForeground }]}>
                    {record.session_date ?? "—"} · {record.time_recorded}
                  </Text>
                </View>
                <Text style={[styles.historyMatric, { color: colors.mutedForeground }]}>{record.matric_number}</Text>
              </View>
            ))}
          </>
        )}

        {myAttendance.length === 0 && courseStats.length === 0 && (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="check-circle" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No attendance recorded yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Scan a QR code when class is live</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={scannerOpen} animationType="slide">
        <QRScanner onScanned={handleScanned} onClose={() => setScannerOpen(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2, marginBottom: 16 },
  summaryWrap: { flexDirection: "row", alignItems: "center", gap: 16 },
  summaryLeft: { flex: 1 },
  summaryPct: { color: "#fff", fontSize: 44, fontFamily: "Inter_700Bold" },
  summaryLabel: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -4, marginBottom: 10 },
  barBg: { height: 5, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  barFill: { height: "100%", backgroundColor: "#fff", borderRadius: 3 },
  summaryCount: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "Inter_400Regular" },
  scannerBtn: { width: 80, height: 80, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", gap: 5 },
  scannerBtnText: { color: "#7C3AED", fontSize: 11, fontFamily: "Inter_700Bold" },
  resultBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, marginHorizontal: 16, marginTop: 12, borderRadius: 12 },
  resultText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  courseCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, gap: 10 },
  courseHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  codeBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  codeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  courseTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  courseMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  courseRate: { fontSize: 20, fontFamily: "Inter_700Bold" },
  courseBar: { height: 5, borderRadius: 3, overflow: "hidden" },
  courseBarFill: { height: "100%", borderRadius: 3 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  checkBadge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  historyTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  historyMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  historyMatric: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: { borderWidth: 1, borderRadius: 20, padding: 40, alignItems: "center", gap: 8, marginTop: 8 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});
