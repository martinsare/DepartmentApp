import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QRScanner } from "@/components/QRScanner";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { DEMO_COURSES } from "@/lib/demoData";

export default function StudentAttendance() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { attendance, sessions } = useData();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null);
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const myAttendance = attendance.filter((a) => a.student_id === user?.id);
  const totalSessions = sessions.filter(
    (s) => s.status === "ended" || s.status === "ongoing"
  ).length;
  const attendedCount = myAttendance.length;
  const pct = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;

  const handleScan = () => {
    setScannerOpen(true);
  };

  const handleScanned = (_data: string) => {
    setScannerOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScanResult("success");
    setTimeout(() => setScanResult(null), 3000);
  };

  const courseAttendance = DEMO_COURSES.map((course) => {
    const courseSessions = sessions.filter((s) => s.course_id === course.id);
    const attended = myAttendance.filter((a) =>
      courseSessions.some((s) => s.id === a.session_id)
    ).length;
    const total = courseSessions.filter(
      (s) => s.status === "ended" || s.status === "ongoing"
    ).length;
    return {
      course,
      attended,
      total,
      pct: total > 0 ? Math.round((attended / total) * 100) : 0,
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Attendance</Text>

        <TouchableOpacity
          style={[styles.scanBtn, { backgroundColor: colors.primary }]}
          onPress={handleScan}
          activeOpacity={0.85}
        >
          <Feather name="maximize" size={22} color="#fff" />
          <Text style={styles.scanBtnText}>Scan QR Code</Text>
        </TouchableOpacity>

        {scanResult === "success" && (
          <View style={[styles.resultBanner, { backgroundColor: "#D1FAE5" }]}>
            <Feather name="check-circle" size={18} color="#065F46" />
            <Text style={[styles.resultText, { color: "#065F46" }]}>
              Attendance recorded successfully!
            </Text>
          </View>
        )}
        {scanResult === "error" && (
          <View style={[styles.resultBanner, { backgroundColor: "#FEE2E2" }]}>
            <Feather name="alert-circle" size={18} color="#991B1B" />
            <Text style={[styles.resultText, { color: "#991B1B" }]}>
              Invalid or expired QR code
            </Text>
          </View>
        )}

        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>Overall Attendance</Text>
          <Text style={styles.summaryPct}>{pct}%</Text>
          <View style={styles.summaryBar}>
            <View style={[styles.summaryFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={styles.summaryCount}>
            {attendedCount} / {totalSessions} sessions attended
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By Course</Text>
        {courseAttendance.map(({ course, attended, total, pct: cPct }) => (
          <View
            key={course.id}
            style={[styles.courseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.courseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.courseCode, { color: colors.primary }]}>{course.code}</Text>
                <Text style={[styles.courseTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {course.title}
                </Text>
              </View>
              <Text
                style={[
                  styles.coursePct,
                  { color: cPct >= 75 ? "#10B981" : "#EF4444" },
                ]}
              >
                {cPct}%
              </Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${cPct}%` as any,
                    backgroundColor: cPct >= 75 ? "#10B981" : "#EF4444",
                  },
                ]}
              />
            </View>
            <Text style={[styles.courseCount, { color: colors.mutedForeground }]}>
              {attended} / {total} sessions
            </Text>
          </View>
        ))}

        {myAttendance.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>History</Text>
            {myAttendance.map((record) => (
              <View
                key={record.id}
                style={[styles.historyRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.checkCircle, { backgroundColor: "#D1FAE5" }]}>
                  <Feather name="check" size={14} color="#065F46" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyTitle, { color: colors.foreground }]}>
                    {record.course_title}
                  </Text>
                  <Text style={[styles.historyMeta, { color: colors.mutedForeground }]}>
                    {record.session_date} · {record.time_recorded}
                  </Text>
                </View>
                <Text style={[styles.historyMatric, { color: colors.mutedForeground }]}>
                  {record.matric_number}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={scannerOpen} animationType="slide">
        <QRScanner onScanned={handleScanned} onClose={() => setScannerOpen(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 20 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  scanBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  summaryPct: { color: "#fff", fontSize: 48, fontFamily: "Inter_700Bold", lineHeight: 56 },
  summaryBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 6,
  },
  summaryFill: { height: "100%", backgroundColor: "#fff", borderRadius: 3 },
  summaryCount: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  courseCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 8 },
  courseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  courseCode: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  courseTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  coursePct: { fontSize: 20, fontFamily: "Inter_700Bold" },
  barBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  courseCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  checkCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  historyTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  historyMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  historyMatric: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
