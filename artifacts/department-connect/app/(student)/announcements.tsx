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

const TYPE_COLORS: Record<string, string> = {
  general: "#7C3AED", assignment: "#3B82F6", test: "#F59E0B", emergency: "#EF4444", urgent: "#EF4444", event: "#10B981",
};

const TYPES: { key: Announcement["type"]; label: string; color: string }[] = [
  { key: "general", label: "General", color: "#7C3AED" },
  { key: "assignment", label: "Assignment", color: "#3B82F6" },
  { key: "test", label: "Test/Exam", color: "#F59E0B" },
  { key: "emergency", label: "Urgent", color: "#EF4444" },
];

export default function StudentAnnouncements() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { announcements, markAnnouncementRead, addAnnouncement, courses } = useData();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Announcement["type"]>("all");
  const [postOpen, setPostOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "general" as Announcement["type"] });

  const isRep = user?.is_course_rep === true;
  const repCourseId = user?.course_rep_for;
  const repCourse = repCourseId ? courses.find((c) => c.id === repCourseId) : null;

  const filtered = announcements.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    return true;
  });

  const unread = announcements.filter((a) => !a.read).length;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handlePost = async () => {
    if (!form.title.trim() || !form.body.trim() || !user || !isRep || !repCourseId) return;
    setSaving(true);
    await addAnnouncement({
      id: `ann-${Date.now()}`,
      author_id: user.id,
      author_name: user.full_name,
      role: "student",
      title: form.title.trim(),
      body: form.body.trim(),
      type: form.type,
      department_id: "dept-001",
      course_id: repCourseId,
      created_at: new Date().toISOString(),
      read: true,
    });
    setSaving(false);
    setPostOpen(false);
    setForm({ title: "", body: "", type: "general" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const FILTER_TABS: { key: "all" | Announcement["type"]; label: string }[] = [
    { key: "all", label: "All" },
    { key: "general", label: "General" },
    { key: "assignment", label: "Assignment" },
    { key: "test", label: "Test" },
    { key: "emergency", label: "Urgent" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>Department & Course Notices</Text>
            <Text style={styles.headerTitle}>Announcements</Text>
          </View>
          {isRep && (
            <TouchableOpacity style={styles.postBtn} onPress={() => setPostOpen(true)}>
              <Feather name="edit-3" size={15} color="#7C3AED" />
              <Text style={styles.postBtnText}>Post</Text>
            </TouchableOpacity>
          )}
        </View>
        {unread > 0 && (
          <View style={styles.unreadBadge}>
            <View style={styles.unreadDot} />
            <Text style={styles.unreadText}>{unread} unread</Text>
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 12 }}>
          {FILTER_TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.filterChip, filter === t.key && styles.filterChipActive]}
              onPress={() => setFilter(t.key)}
            >
              <Text style={[styles.filterText, filter === t.key && styles.filterTextActive]}>{t.label}</Text>
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
            <Feather name="bell" size={36} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No announcements</Text>
          </View>
        ) : filtered.map((ann) => {
          const tc = TYPE_COLORS[ann.type] ?? "#7C3AED";
          const isExp = expanded === ann.id;
          return (
            <TouchableOpacity
              key={ann.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: tc, borderLeftWidth: 3 }]}
              onPress={() => { markAnnouncementRead(ann.id); setExpanded(isExp ? null : ann.id); }}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: tc + "15" }]}>
                  <Text style={[styles.typeText, { color: tc }]}>{ann.type}</Text>
                </View>
                {ann.role === "admin" && (
                  <View style={[styles.authorBadge, { backgroundColor: colors.primary + "12" }]}>
                    <Feather name="shield" size={10} color={colors.primary} />
                    <Text style={[styles.authorTag, { color: colors.primary }]}>Admin</Text>
                  </View>
                )}
                {ann.role === "lecturer" && (
                  <View style={[styles.authorBadge, { backgroundColor: "#10B98112" }]}>
                    <Feather name="briefcase" size={10} color="#10B981" />
                    <Text style={[styles.authorTag, { color: "#10B981" }]}>Lecturer</Text>
                  </View>
                )}
                {ann.role === "student" && (
                  <View style={[styles.authorBadge, { backgroundColor: "#F59E0B12" }]}>
                    <Feather name="star" size={10} color="#F59E0B" />
                    <Text style={[styles.authorTag, { color: "#F59E0B" }]}>Rep</Text>
                  </View>
                )}
                {!ann.read && <View style={[styles.unreadDot2, { backgroundColor: tc }]} />}
                <Feather name={isExp ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{ann.title}</Text>
              <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                {ann.author_name} · {new Date(ann.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </Text>
              {isExp && <Text style={[styles.cardBody, { color: colors.foreground }]}>{ann.body}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isRep && (
        <Modal visible={postOpen} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={[styles.sheet, { backgroundColor: colors.background }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Post Notice</Text>
              {repCourse && (
                <View style={[styles.courseTag2, { backgroundColor: colors.primary + "12" }]}>
                  <Feather name="book" size={12} color={colors.primary} />
                  <Text style={[styles.courseTagText, { color: colors.primary }]}>Posting to {repCourse.code} — {repCourse.title}</Text>
                </View>
              )}
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Title</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                placeholder="Notice title" placeholderTextColor={colors.mutedForeground}
                value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              />
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Message</Text>
              <TextInput
                style={[styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                placeholder="Write your notice here…" placeholderTextColor={colors.mutedForeground}
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
                {saving ? <ActivityIndicator color="#fff" /> : <><Feather name="send" size={15} color="#fff" /><Text style={styles.saveBtnText}>Post Notice</Text></>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setPostOpen(false)}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  postBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  postBtnText: { color: "#7C3AED", fontSize: 12, fontFamily: "Inter_700Bold" },
  unreadBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 10 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FCD34D" },
  unreadText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)" },
  filterChipActive: { backgroundColor: "#fff" },
  filterText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_500Medium" },
  filterTextActive: { color: "#7C3AED" },
  scroll: { padding: 16 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 40, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, gap: 5 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  typeBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  typeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  authorBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  authorTag: { fontSize: 10, fontFamily: "Inter_700Bold" },
  unreadDot2: { width: 7, height: 7, borderRadius: 3.5 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginTop: 6 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 14 },
  courseTag2: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 12, padding: 10, marginBottom: 16 },
  courseTagText: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
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
