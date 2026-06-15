import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClassCard } from "@/components/ClassCard";
import { ClassDetailModal } from "@/components/ClassDetailModal";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { ClassSession } from "@/lib/types";

const STATUSES: ClassSession["status"][] = ["scheduled", "ongoing", "ended", "cancelled"];

export default function LecturerClasses() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sessions, courses, addSession, updateSessionStatus } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ course_id: "", date: "", time: "", venue: "" });
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const topPad = insets.top;

  const mySessions = sessions.filter((s) => s.lecturer_id === user?.id);
  const myCourses = courses.filter((c) => c.lecturer_id === user?.id);

  const handleCreate = async () => {
    if (!form.course_id || !form.date || !form.time || !form.venue) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    const course = myCourses.find((c) => c.id === form.course_id);
    const session: ClassSession = {
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
    };
    addSession(session);
    setSaving(false);
    setModalOpen(false);
    setForm({ course_id: "", date: "", time: "", venue: "" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Classes</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalOpen(true)}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {mySessions.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="calendar" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No classes yet</Text>
          </View>
        ) : (
          mySessions.map((s) => (
            <View key={s.id}>
              <ClassCard session={s} onPress={() => setSelectedClass(s)} />
              {s.status !== "ended" && s.status !== "cancelled" && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: -6, marginBottom: 12 }}>
                  {STATUSES.filter((st) => st !== s.status).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.statusChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                      onPress={() => { updateSessionStatus(s.id, st); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                      <Text style={[styles.statusChipText, { color: colors.primary }]}>
                        → {st.charAt(0).toUpperCase() + st.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <ClassDetailModal session={selectedClass} onClose={() => setSelectedClass(null)} userRole="lecturer" />

      {/* Create modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New Class Session</Text>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Course</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {myCourses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.courseChip,
                    form.course_id === c.id
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={() => setForm((f) => ({ ...f, course_id: c.id }))}
                >
                  <Text style={{ color: form.course_id === c.id ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                    {c.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {[
              { key: "date", label: "Date (YYYY-MM-DD)", placeholder: "2025-06-15" },
              { key: "time", label: "Time (HH:MM)", placeholder: "09:00" },
              { key: "venue", label: "Venue", placeholder: "LT Block A" },
            ].map(({ key, label, placeholder }) => (
              <View key={key}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                  placeholder={placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={(form as any)[key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Create Session</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => setModalOpen(false)}
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  statusChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 20 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  courseChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 14 },
  saveBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 4, marginBottom: 10 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
