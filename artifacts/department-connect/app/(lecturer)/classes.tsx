import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { ClassSession } from "@/lib/types";

const STATUS_CONFIG: Record<ClassSession["status"], { label: string; color: string; bg: string }> = {
  scheduled: { label: "Scheduled", color: "#3B82F6", bg: "#3B82F615" },
  ongoing: { label: "Ongoing", color: "#10B981", bg: "#10B98115" },
  ended: { label: "Ended", color: "#6B7280", bg: "#6B728015" },
  completed: { label: "Completed", color: "#6B7280", bg: "#6B728015" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#EF444415" },
};

const QR_WINDOWS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "Unlimited", minutes: 0 },
];

export default function LecturerClasses() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sessions, courses, addSession, updateSessionStatus, updateLiveStatus } = useData();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrSession, setQrSession] = useState<ClassSession | null>(null);
  const [qrWindow, setQrWindow] = useState(15);
  const [form, setForm] = useState({ course_id: "", date: "", time: "", venue: "" });
  const [filter, setFilter] = useState<"all" | ClassSession["status"]>("all");

  const mySessions = sessions.filter((s) => s.lecturer_id === user?.id);
  const myCourses = courses.filter((c) => c.lecturer_id === user?.id || c.co_lecturer_id === user?.id);
  const filtered = filter === "all" ? mySessions : mySessions.filter((s) => s.status === filter);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleCreate = async () => {
    if (!form.course_id || !form.date || !form.time || !form.venue) return;
    setSaving(true);
    const course = myCourses.find((c) => c.id === form.course_id);
    await addSession({
      id: `sess-${Date.now()}`,
      course_id: form.course_id,
      course_code: course?.code,
      course_title: course?.title,
      lecturer_id: user?.id ?? "",
      lecturer_name: user?.full_name,
      date: form.date,
      time: form.time,
      venue: form.venue,
      status: "scheduled",
    });
    setSaving(false);
    setCreateOpen(false);
    setForm({ course_id: "", date: "", time: "", venue: "" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleStatusChange = async (session: ClassSession, status: ClassSession["status"]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSessionStatus(session.id, status);
    if (status === "ongoing") await updateLiveStatus(session.id, "live");
    if (status === "ended") await updateLiveStatus(session.id, "ended");
  };

  const handleShowQR = (s: ClassSession) => {
    setQrSession(s);
    setQrWindow(15);
  };

  const getQRExpiry = () => {
    if (qrWindow === 0) return null;
    return new Date(Date.now() + qrWindow * 60 * 1000).toISOString();
  };

  const isExpired = (s: ClassSession) => {
    if (!s.expires_at) return false;
    return new Date() > new Date(s.expires_at);
  };

  const FILTERS: { key: "all" | ClassSession["status"]; label: string }[] = [
    { key: "all", label: "All" },
    { key: "scheduled", label: "Scheduled" },
    { key: "ongoing", label: "Ongoing" },
    { key: "ended", label: "Ended" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>My Classes</Text>
            <Text style={styles.headerTitle}>Sessions</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setCreateOpen(true)}>
            <Feather name="plus" size={18} color="#7C3AED" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
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
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No sessions yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Tap New to schedule a class</Text>
          </View>
        ) : filtered.map((s) => {
          const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.scheduled;
          const canStart = s.status === "scheduled";
          const canEnd = s.status === "ongoing";
          const canCancel = s.status === "scheduled";
          const expired = isExpired(s);

          return (
            <View key={s.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={[styles.codeBadge, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.codeText, { color: colors.primary }]}>{s.course_code}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{s.course_title}</Text>
                  <View style={styles.cardMeta}>
                    <Feather name="calendar" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>{s.date}</Text>
                    <Feather name="clock" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>{s.time}</Text>
                    <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>{s.venue}</Text>
                  </View>
                  {s.attendance_locked && (
                    <View style={styles.lockedBadge}>
                      <Feather name="lock" size={10} color="#6B7280" />
                      <Text style={styles.lockedText}>Attendance locked</Text>
                    </View>
                  )}
                  {expired && (
                    <View style={[styles.lockedBadge, { backgroundColor: "#FEE2E2" }]}>
                      <Feather name="clock" size={10} color="#EF4444" />
                      <Text style={[styles.lockedText, { color: "#EF4444" }]}>QR expired</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                {canStart && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
                    onPress={() => handleStatusChange(s, "ongoing")}
                  >
                    <Feather name="play" size={13} color="#fff" />
                    <Text style={styles.actionBtnText}>Start</Text>
                  </TouchableOpacity>
                )}
                {canEnd && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleShowQR(s)}
                    >
                      <Feather name="maximize" size={13} color="#fff" />
                      <Text style={styles.actionBtnText}>QR Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#6B7280" }]}
                      onPress={() => handleStatusChange(s, "ended")}
                    >
                      <Feather name="square" size={13} color="#fff" />
                      <Text style={styles.actionBtnText}>End</Text>
                    </TouchableOpacity>
                  </>
                )}
                {canCancel && (
                  <TouchableOpacity
                    style={[styles.actionBtnOutline, { borderColor: "#EF4444" }]}
                    onPress={() => handleStatusChange(s, "cancelled")}
                  >
                    <Feather name="x" size={13} color="#EF4444" />
                    <Text style={[styles.actionBtnOutlineText, { color: "#EF4444" }]}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {qrSession && (
        <Modal visible animationType="fade" transparent>
          <View style={styles.qrOverlay}>
            <View style={[styles.qrSheet, { backgroundColor: colors.background }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <Text style={[styles.qrTitle, { color: colors.foreground }]}>Attendance QR</Text>
              <Text style={[styles.qrSub, { color: colors.mutedForeground }]}>{qrSession.course_code} · {qrSession.date}</Text>

              <Text style={[styles.windowLabel, { color: colors.mutedForeground }]}>QR Expiry Window</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.windowRow}>
                {QR_WINDOWS.map((w) => (
                  <TouchableOpacity
                    key={w.minutes}
                    style={[styles.windowChip, qrWindow === w.minutes
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
                    onPress={() => setQrWindow(w.minutes)}
                  >
                    <Text style={[styles.windowChipText, { color: qrWindow === w.minutes ? "#fff" : colors.mutedForeground }]}>
                      {w.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <QRCodeDisplay
                value={JSON.stringify({
                  session_id: qrSession.id,
                  course_id: qrSession.course_id,
                  date: qrSession.date,
                  expires_at: getQRExpiry(),
                })}
                size={200}
              />

              {qrWindow > 0 && (
                <View style={[styles.expiryNote, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Feather name="clock" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.expiryNoteText, { color: colors.mutedForeground }]}>
                    Expires in {qrWindow} min from scan
                  </Text>
                </View>
              )}

              <TouchableOpacity style={[styles.closeBtn, { borderColor: colors.border }]} onPress={() => setQrSession(null)}>
                <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={createOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New Class Session</Text>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Course</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {myCourses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.courseChip, form.course_id === c.id ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => setForm((f) => ({ ...f, course_id: c.id }))}
                >
                  <Text style={{ color: form.course_id === c.id ? "#fff" : colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{c.code}</Text>
                  {c.co_lecturer_id === user?.id && (
                    <Text style={{ color: form.course_id === c.id ? "rgba(255,255,255,0.7)" : colors.mutedForeground, fontSize: 10, fontFamily: "Inter_400Regular" }}> co-lect</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {[
              { key: "date", label: "Date (YYYY-MM-DD)", placeholder: "2025-09-15" },
              { key: "time", label: "Time (HH:MM)", placeholder: "09:00" },
              { key: "venue", label: "Venue", placeholder: "LT Block A" },
            ].map(({ key, label, placeholder }) => (
              <View key={key} style={{ marginBottom: 12 }}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                  placeholder={placeholder} placeholderTextColor={colors.mutedForeground}
                  value={(form as any)[key]} onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
              onPress={handleCreate} disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Create Session</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setCreateOpen(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#7C3AED", fontSize: 13, fontFamily: "Inter_700Bold" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)" },
  filterChipActive: { backgroundColor: "#fff" },
  filterText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_500Medium" },
  filterTextActive: { color: "#7C3AED" },
  scroll: { padding: 16 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 40, alignItems: "center", gap: 10, marginTop: 8 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 12, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 },
  codeBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, marginTop: 2 },
  codeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" },
  cardMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  lockedBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, backgroundColor: "#F3F4F6", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, alignSelf: "flex-start" },
  lockedText: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#6B7280" },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardActions: { flexDirection: "row", gap: 8, borderTopWidth: 1, padding: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10 },
  actionBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  actionBtnOutline: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  actionBtnOutlineText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  qrOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "flex-end" },
  qrSheet: { width: "100%", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, alignItems: "center" },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  qrTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  qrSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14 },
  windowLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 8 },
  windowRow: { gap: 8, marginBottom: 16 },
  windowChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  windowChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  expiryNote: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginTop: 12 },
  expiryNoteText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  closeBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 40, marginTop: 20 },
  closeBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 20 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  courseChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, marginRight: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 14, fontFamily: "Inter_400Regular" },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8, marginBottom: 10 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
