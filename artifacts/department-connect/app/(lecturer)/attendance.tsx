import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiveStatusBadge } from "@/components/LiveStatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { LiveStatus } from "@/lib/demoData";

const LIVE_STEPS: { status: LiveStatus["status"]; label: string }[] = [
  { status: "lecturer_arrived", label: "Arrived" },
  { status: "class_started", label: "Class Started" },
  { status: "entry_open", label: "Open Entry" },
  { status: "entry_closing", label: "Closing Soon" },
  { status: "entry_closed", label: "Close Entry" },
  { status: "class_ended", label: "End Class" },
];

export default function LecturerAttendance() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sessions, attendance, liveStatus, updateLiveStatus } = useData();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const mySessions = sessions.filter(
    (s) => s.lecturer_id === user?.id && (s.status === "ongoing" || s.status === "scheduled")
  );

  const selected = sessions.find((s) => s.id === selectedSession);
  const sessionAttendance = attendance.filter((a) => a.session_id === selectedSession);
  const currentStatus = selectedSession ? liveStatus[selectedSession] : null;

  const handleStatusUpdate = (status: LiveStatus["status"]) => {
    if (!selectedSession) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateLiveStatus(selectedSession, status);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Attendance</Text>

        {/* Session selector */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Sessions</Text>
        {mySessions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="calendar" size={28} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active sessions</Text>
          </View>
        ) : (
          mySessions.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.sessionBtn,
                {
                  backgroundColor: selectedSession === s.id ? colors.primary : colors.card,
                  borderColor: selectedSession === s.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { setSelectedSession(s.id); setShowQR(false); }}
            >
              <Text style={[styles.sessionCode, { color: selectedSession === s.id ? "rgba(255,255,255,0.75)" : colors.primary }]}>
                {s.course_code}
              </Text>
              <Text style={[styles.sessionTitle, { color: selectedSession === s.id ? "#fff" : colors.foreground }]}>
                {s.course_title}
              </Text>
              <Text style={[styles.sessionMeta, { color: selectedSession === s.id ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
                {s.time} · {s.venue}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {selected && (
          <>
            {/* Current live status */}
            {currentStatus && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Live Status</Text>
                <LiveStatusBadge status={currentStatus.status} />
              </View>
            )}

            {/* Status controls */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Update Status</Text>
            <View style={styles.statusGrid}>
              {LIVE_STEPS.map((step) => (
                <TouchableOpacity
                  key={step.status}
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: currentStatus?.status === step.status ? colors.primary : colors.card,
                      borderColor: currentStatus?.status === step.status ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleStatusUpdate(step.status)}
                >
                  <Text style={[styles.statusBtnText, { color: currentStatus?.status === step.status ? "#fff" : colors.foreground }]}>
                    {step.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* QR Code display */}
            <View style={styles.qrSection}>
              <TouchableOpacity
                style={[styles.qrBtn, { backgroundColor: colors.primary }]}
                onPress={() => { setShowQR(!showQR); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Feather name="grid" size={20} color="#fff" />
                <Text style={styles.qrBtnText}>{showQR ? "Hide QR Code" : "Show QR Code"}</Text>
              </TouchableOpacity>

              {showQR && (
                <View style={[styles.qrCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.qrFrame, { borderColor: colors.primary }]}>
                    <Feather name="grid" size={80} color={colors.primary} />
                  </View>
                  <Text style={[styles.qrToken, { color: colors.mutedForeground }]}>
                    Token: {selected.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text style={[styles.qrExpiry, { color: colors.mutedForeground }]}>Expires in 15 min</Text>
                </View>
              )}
            </View>

            {/* Attendance list */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Present ({sessionAttendance.length})
            </Text>
            {sessionAttendance.length === 0 ? (
              <Text style={[styles.noAttendance, { color: colors.mutedForeground }]}>No students scanned yet</Text>
            ) : (
              sessionAttendance.map((a) => (
                <View key={a.id} style={[styles.attendRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.attendAvatar, { backgroundColor: colors.secondary }]}>
                    <Feather name="user" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.attendName, { color: colors.foreground }]}>{a.student_name}</Text>
                    <Text style={[styles.attendMatric, { color: colors.mutedForeground }]}>{a.matric_number}</Text>
                  </View>
                  <Text style={[styles.attendTime, { color: colors.mutedForeground }]}>{a.time_recorded}</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  emptyCard: { borderWidth: 1, borderRadius: 14, padding: 24, alignItems: "center", gap: 10, marginBottom: 24 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  sessionBtn: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  sessionCode: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  sessionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  sessionMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  statusBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  statusBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  qrSection: { marginBottom: 24 },
  qrBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 14, marginBottom: 14 },
  qrBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  qrCard: { borderWidth: 1, borderRadius: 16, padding: 24, alignItems: "center", gap: 10 },
  qrFrame: { borderWidth: 3, borderRadius: 12, padding: 20 },
  qrToken: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  qrExpiry: { fontSize: 11, fontFamily: "Inter_400Regular" },
  noAttendance: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
  attendRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  attendAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  attendName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  attendMatric: { fontSize: 12, fontFamily: "Inter_400Regular" },
  attendTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
