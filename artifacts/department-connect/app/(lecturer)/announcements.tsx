import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { Announcement } from "@/lib/types";

const TYPE_COLOR: Record<string, string> = {
  general: "#7C3AED", assignment: "#3B82F6", test: "#F59E0B", emergency: "#EF4444",
};

const TYPES: { key: Announcement["type"]; label: string; color: string }[] = [
  { key: "general", label: "General", color: "#7C3AED" },
  { key: "assignment", label: "Assignment", color: "#3B82F6" },
  { key: "test", label: "Test/Exam", color: "#F59E0B" },
  { key: "emergency", label: "Urgent", color: "#EF4444" },
];

export default function LecturerAnnouncements() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { announcements, addAnnouncement, markAnnouncementRead, courses } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", body: "", type: "general" as Announcement["type"], course_id: "" });

  const myCourses = courses.filter((c) => c.lecturer_id === user?.id);
  const myAnnouncements = announcements.filter((a) =>
    a.author_id === user?.id ||
    (a.course_id && myCourses.some((c) => c.id === a.course_id)) ||
    !a.course_id
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handlePost = async () => {
    if (!form.title.trim() || !form.body.trim() || !user) return;
    setSaving(true);
    await addAnnouncement({
      id: `ann-${Date.now()}`,
      author_id: user.id,
      author_name: user.full_name,
      role: "lecturer",
      title: form.title.trim(),
      body: form.body.trim(),
      type: form.type,
      department_id: "dept-001",
      course_id: form.course_id || null,
      created_at: new Date().toISOString(),
      read: true,
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ title: "", body: "", type: "general", course_id: "" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>Course Notices</Text>
            <Text style={styles.headerTitle}>Announcements</Text>
          </View>
          <TouchableOpacity style={styles.postBtn} onPress={() => setModalOpen(true)}>
            <Feather name="edit-3" size={16} color="#7C3AED" />
            <Text style={styles.postBtnText}>Post</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {myAnnouncements.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="bell" size={36} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No announcements yet</Text>
          </View>
        ) : myAnnouncements.map((ann) => {
          const tc = TYPE_COLOR[ann.type] ?? "#7C3AED";
          const isExp = expanded === ann.id;
          const isMine = ann.author_id === user?.id;
          const course = ann.course_id ? myCourses.find((c) => c.id === ann.course_id) : null;
          return (
            <TouchableOpacity
              key={ann.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: tc, borderLeftWidth: 4 }]}
              onPress={() => { markAnnouncementRead(ann.id); setExpanded(isExp ? null : ann.id); }}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: tc + "15" }]}>
                  <Text style={[styles.typeText, { color: tc }]}>{ann.type}</Text>
                </View>
                {course && (
                  <View style={[styles.courseBadge, { backgroundColor: colors.primary + "12" }]}>
                    <Feather name="book" size={10} color={colors.primary} />
                    <Text style={[styles.courseTag, { color: colors.primary }]}>{course.code}</Text>
                  </View>
                )}
                {isMine && (
                  <View style={[styles.mineBadge, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.mineText, { color: colors.mutedForeground }]}>You</Text>
                  </View>
                )}
                {!ann.read && <View style={[styles.unread, { backgroundColor: tc }]} />}
                <Feather name={isExp ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{ann.title}</Text>
              <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                {ann.author_name} · {new Date(ann.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
              </Text>
              {isExp && <Text style={[styles.cardBody, { color: colors.foreground }]}>{ann.body}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New Announcement</Text>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Course (optional — leave blank for all)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <TouchableOpacity
                style={[styles.courseChip, form.course_id === "" && styles.courseChipActive]}
                onPress={() => setForm((f) => ({ ...f, course_id: "" }))}
              >
                <Text style={[styles.courseChipText, form.course_id === "" && styles.courseChipTextActive]}>All</Text>
              </TouchableOpacity>
              {myCourses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.courseChip, form.course_id === c.id && styles.courseChipActive]}
                  onPress={() => setForm((f) => ({ ...f, course_id: c.id }))}
                >
                  <Text style={[styles.courseChipText, form.course_id === c.id && styles.courseChipTextActive]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Title</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
              placeholder="Announcement title" placeholderTextColor={colors.mutedForeground}
              value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            />

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Message</Text>
            <TextInput
              style={[styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
              placeholder="Write your message…" placeholderTextColor={colors.mutedForeground}
              multiline numberOfLines={4} textAlignVertical="top"
              value={form.body} onChangeText={(v) => setForm((f) => ({ ...f, body: v }))}
            />

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeChip, { backgroundColor: form.type === t.key ? t.color : colors.muted, borderColor: form.type === t.key ? t.color : colors.border }]}
                  onPress={() => setForm((f) => ({ ...f, type: t.key }))}
                >
                  <Text style={[styles.typeChipText, { color: form.type === t.key ? "#fff" : colors.foreground }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]} onPress={handlePost} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <><Feather name="send" size={15} color="#fff" /><Text style={styles.saveBtnText}>Post</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setModalOpen(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  postBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: "#7C3AED", fontSize: 13, fontFamily: "Inter_700Bold" },
  scroll: { padding: 16 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 40, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, gap: 5 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
  typeBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  typeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  courseBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  courseTag: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  mineBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  mineText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  unread: { width: 7, height: 7, borderRadius: 3.5 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginTop: 6 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 18 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  courseChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: "#E5E7EB", borderWidth: 1, borderColor: "transparent" },
  courseChipActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  courseChipText: { color: "#374151", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  courseChipTextActive: { color: "#fff" },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 14 },
  textarea: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 90, marginBottom: 14 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  typeChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15, marginBottom: 10 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
