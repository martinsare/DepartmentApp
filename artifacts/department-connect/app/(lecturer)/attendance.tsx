import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiveStatusBadge } from "@/components/LiveStatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { LiveStatus } from "@/lib/types";

const LIVE_STEPS: { status: LiveStatus["status"]; label: string; icon: string }[] = [
  { status: "lecturer_arrived", label: "Arrived", icon: "log-in" },
  { status: "class_started", label: "Started", icon: "play" },
  { status: "entry_open", label: "Open Entry", icon: "unlock" },
  { status: "entry_closing", label: "Closing Soon", icon: "clock" },
  { status: "entry_closed", label: "Close Entry", icon: "lock" },
  { status: "class_ended", label: "End Class", icon: "check-circle" },
];

export default function LecturerAttendance() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sessions, attendance, liveStatus, updateLiveStatus } = useData();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const topPad = insets.top;

  const mySessions = sessions.filter(
    (s) =>
      s.lecturer_id === user?.id &&
      (s.status === "ongoing" || s.status === "scheduled")
  );

  const selected = sessions.find((s) => s.id === selectedSession);
  const sessionAttendance = attendance.filter((a) => a.session_id === selectedSession);
  const currentStatus = selectedSession ? liveStatus[selectedSession] : null;

  const qrValue = selectedSession
    ? JSON.stringify({ session_id: selectedSession, token: selectedSession.slice(0, 8).toUpperCase() })
    : "invalid";

  const isEntryOpen =
    currentStatus?.status === "entry_open" || currentStatus?.status === "entry_closing";

  const handleStatusUpdate = (status: LiveStatus["status"]) => {
    if (!selectedSession) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateLiveStatus(selectedSession, status);
    if (status === "entry_open" || status === "entry_closing") {
      setShowQR(true);
    }
    if (status === "entry_closed" || status === "class_ended") {
      setShowQR(false);
    }
  };

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

        {/* Session picker */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Session</Text>
        {mySessions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="calendar" size={28} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No active sessions
            </Text>
          </View>
        ) : (
          mySessions.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.sessionBtn,
                {
                  backgroundColor:
                    selectedSession === s.id ? colors.primary : colors.card,
                  borderColor:
                    selectedSession === s.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setSelectedSession(s.id);
                setShowQR(false);
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.sessionCode,
                  {
                    color:
                      selectedSession === s.id
                        ? "rgba(255,255,255,0.75)"
                        : colors.primary,
                  },
                ]}
              >
                {s.course_code}
              </Text>
              <Text
                style={[
                  styles.sessionTitle,
                  { color: selectedSession === s.id ? "#fff" : colors.foreground },
                ]}
              >
                {s.course_title}
              </Text>
              <Text
                style={[
                  styles.sessionMeta,
                  {
                    color:
                      selectedSession === s.id
                        ? "rgba(255,255,255,0.7)"
                        : colors.mutedForeground,
                  },
                ]}
              >
                {s.time} · {s.venue}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {selected && (
          <>
            {/* Live status display */}
            {currentStatus && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Live Status
                </Text>
                <LiveStatusBadge status={currentStatus.status} />
              </View>
            )}

            {/* Step controls */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Update Status
            </Text>
            <View style={styles.stepsWrap}>
              {LIVE_STEPS.map((step, i) => {
                const isActive = currentStatus?.status === step.status;
                return (
                  <TouchableOpacity
                    key={step.status}
                    style={[
                      styles.stepBtn,
                      {
                        backgroundColor: isActive ? colors.primary : colors.card,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleStatusUpdate(step.status)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.stepNum,
                        {
                          backgroundColor: isActive
                            ? "rgba(255,255,255,0.2)"
                            : colors.secondary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNumText,
                          { color: isActive ? "#fff" : colors.primary },
                        ]}
                      >
                        {i + 1}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        { color: isActive ? "#fff" : colors.foreground },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* QR Code section */}
            <View style={[styles.qrSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.qrHeader}>
                <View>
                  <Text style={[styles.qrTitle, { color: colors.foreground }]}>
                    Attendance QR Code
                  </Text>
                  <Text style={[styles.qrSub, { color: colors.mutedForeground }]}>
                    {isEntryOpen ? "Entry is open — QR active" : "Open entry to activate QR"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.qrToggle,
                    { backgroundColor: isEntryOpen ? colors.primary : colors.muted },
                  ]}
                  onPress={() => {
                    if (isEntryOpen) {
                      setShowQR(!showQR);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Feather
                    name={showQR ? "eye-off" : "eye"}
                    size={16}
                    color={isEntryOpen ? "#fff" : colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>

              {showQR && isEntryOpen && (
                <View style={styles.qrWrap}>
                  <View style={[styles.qrFrame, { borderColor: colors.primary, backgroundColor: "#fff" }]}>
                    <QRCodeDisplay value={qrValue} size={180} />
                  </View>
                  <View style={[styles.tokenRow, { backgroundColor: colors.secondary }]}>
                    <Feather name="key" size={13} color={colors.primary} />
                    <Text style={[styles.tokenText, { color: colors.primary }]}>
                      Token: {selected.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <View style={[styles.expiryBadge, { backgroundColor: "#D1FAE5" }]}>
                      <Text style={styles.expiryText}>15 min</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Attendance roster */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Present ({sessionAttendance.length})
            </Text>
            {sessionAttendance.length === 0 ? (
              <Text style={[styles.noAttendance, { color: colors.mutedForeground }]}>
                No students have scanned yet
              </Text>
            ) : (
              sessionAttendance.map((a) => (
                <View
                  key={a.id}
                  style={[styles.attendRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.attendAvatar, { backgroundColor: colors.secondary }]}>
                    <Feather name="user" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.attendName, { color: colors.foreground }]}>
                      {a.student_name}
                    </Text>
                    <Text style={[styles.attendMatric, { color: colors.mutedForeground }]}>
                      {a.matric_number}
                    </Text>
                  </View>
                  <Text style={[styles.attendTime, { color: colors.mutedForeground }]}>
                    {a.time_recorded}
                  </Text>
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
  emptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  sessionBtn: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  sessionCode: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  sessionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  sessionMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  stepsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  stepBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  stepLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  qrSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  qrHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  qrTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  qrSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  qrToggle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  qrWrap: { alignItems: "center", gap: 12 },
  qrFrame: { padding: 16, borderRadius: 14, borderWidth: 2 },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tokenText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  expiryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  expiryText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#065F46" },
  noAttendance: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 20,
  },
  attendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  attendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  attendName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  attendMatric: { fontSize: 12, fontFamily: "Inter_400Regular" },
  attendTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
