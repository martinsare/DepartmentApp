import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { ClassSession } from "@/lib/demoData";

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "#EDE9FE", text: "#5B21B6", label: "Scheduled" },
  ongoing:   { bg: "#D1FAE5", text: "#065F46", label: "Ongoing" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B", label: "Cancelled" },
  ended:     { bg: "#F3F4F6", text: "#374151", label: "Ended" },
};

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h ?? "0");
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

interface Props {
  session: ClassSession | null;
  onClose: () => void;
  userRole?: "student" | "lecturer" | "admin";
}

interface Row {
  icon: any;
  label: string;
  value: string;
}

export function ClassDetailModal({ session, onClose, userRole = "student" }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const cfg = session ? (STATUS_CONFIG[session.status] ?? STATUS_CONFIG["scheduled"]!) : null;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleScanAttendance = () => {
    onClose();
    router.push(userRole === "lecturer" ? "/(lecturer)/attendance" : "/(student)/attendance");
  };

  const rows: Row[] = session
    ? [
        { icon: "calendar", label: "Date",     value: formatDate(session.date) },
        { icon: "clock",    label: "Time",     value: formatTime(session.time) },
        { icon: "map-pin",  label: "Venue",    value: session.venue },
        ...(session.lecturer_name
          ? [{ icon: "user" as any, label: "Lecturer", value: session.lecturer_name }]
          : []),
        ...(session.duration_minutes
          ? [{ icon: "timer" as any, label: "Duration", value: `${session.duration_minutes} min` }]
          : []),
      ]
    : [];

  return (
    <Modal
      visible={!!session}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {session && cfg && (
            <>
              {/* Header */}
              <View style={styles.headRow}>
                <View style={[styles.codePill, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.code, { color: colors.primary }]}>{session.course_code}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                </View>
              </View>

              <Text style={[styles.title, { color: colors.foreground }]}>{session.course_title}</Text>

              {/* Detail rows */}
              <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {rows.map((r, i) => (
                  <View
                    key={r.label}
                    style={[
                      styles.detailRow,
                      i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={styles.detailLeft}>
                      <Feather name={r.icon} size={15} color={colors.primary} />
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{r.value}</Text>
                  </View>
                ))}
              </View>

              {/* Scan button for ongoing sessions */}
              {session.status === "ongoing" && (
                <TouchableOpacity
                  style={[styles.scanBtn, { backgroundColor: colors.primary }]}
                  onPress={handleScanAttendance}
                >
                  <Feather name="maximize" size={18} color="#fff" />
                  <Text style={styles.scanBtnText}>
                    {userRole === "lecturer" ? "Manage Attendance" : "Scan Attendance QR"}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.closeBtn, { borderColor: colors.border }]}
                onPress={handleClose}
              >
                <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  headRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  codePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  code: { fontSize: 13, fontFamily: "Inter_700Bold" },
  statusPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 28, marginBottom: 18 },
  detailCard: { borderRadius: 16, borderWidth: 1, marginBottom: 18, overflow: "hidden" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", maxWidth: "55%", textAlign: "right" },
  scanBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 15, borderRadius: 14, marginBottom: 10,
  },
  scanBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  closeBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  closeBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
