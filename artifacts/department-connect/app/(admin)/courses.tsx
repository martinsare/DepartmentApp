import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { Course, DEMO_USERS } from "@/lib/demoData";

export default function AdminCourses() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { courses, sessions, addCourse, updateCourse } = useData();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", code: "", lecturer_id: "", enrolled_count: "" });
  const [editForm, setEditForm] = useState({ title: "", code: "", enrolled_count: "" });

  const lecturers = DEMO_USERS.filter((u) => u.role === "lecturer");

  const openEdit = (course: Course) => {
    setEditTarget(course);
    setEditForm({ title: course.title, code: course.code, enrolled_count: String(course.enrolled_count ?? "") });
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.code.trim() || !form.lecturer_id) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    const lecturer = lecturers.find((l) => l.id === form.lecturer_id);
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title: form.title,
      code: form.code.toUpperCase(),
      lecturer_id: form.lecturer_id,
      lecturer_name: lecturer?.full_name,
      department_id: "dept-001",
      enrolled_count: parseInt(form.enrolled_count) || 0,
    };
    addCourse(newCourse);
    setSaving(false);
    setCreateOpen(false);
    setForm({ title: "", code: "", lecturer_id: "", enrolled_count: "" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveEdit = async () => {
    if (!editTarget || !editForm.title.trim() || !editForm.code.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    updateCourse(editTarget.id, {
      title: editForm.title,
      code: editForm.code.toUpperCase(),
      enrolled_count: parseInt(editForm.enrolled_count) || editTarget.enrolled_count,
    });
    setSaving(false);
    setEditTarget(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Courses</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCreateOpen(true); }}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]} showsVerticalScrollIndicator={false}>
        {courses.map((course) => {
          const courseSessions = sessions.filter((s) => s.course_id === course.id);
          const activeSessions = courseSessions.filter((s) => s.status === "scheduled" || s.status === "ongoing").length;
          const endedSessions = courseSessions.filter((s) => s.status === "ended").length;
          return (
            <View key={course.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.codeWrap, { backgroundColor: colors.primary }]}>
                  <Text style={styles.codeText}>{course.code}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: colors.muted }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openEdit(course); }}
                >
                  <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.courseTitle, { color: colors.foreground }]}>{course.title}</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Feather name="user" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{course.lecturer_name}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Feather name="users" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{course.enrolled_count} enrolled</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{courseSessions.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: "#10B981" }]}>{activeSessions}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Upcoming</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.mutedForeground }]}>{endedSessions}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{course.enrolled_count}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Students</Text>
                </View>
              </View>
            </View>
          );
        })}

        {courses.length === 0 && (
          <View style={styles.empty}>
            <Feather name="book-open" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No courses yet</Text>
            <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setCreateOpen(true)}>
              <Text style={styles.emptyBtnText}>Add First Course</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Course Modal */}
      <Modal visible={createOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCreateOpen(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Course</Text>
            <TouchableOpacity onPress={() => setCreateOpen(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Course Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Introduction to Computer Science"
                placeholderTextColor={colors.mutedForeground}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Course Code *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. CS101"
                placeholderTextColor={colors.mutedForeground}
                value={form.code}
                onChangeText={(v) => setForm((f) => ({ ...f, code: v }))}
                autoCapitalize="characters"
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Assign Lecturer *</Text>
              {lecturers.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.lecturerOption, { backgroundColor: form.lecturer_id === l.id ? colors.primary + "14" : colors.card, borderColor: form.lecturer_id === l.id ? colors.primary : colors.border }]}
                  onPress={() => setForm((f) => ({ ...f, lecturer_id: l.id }))}
                >
                  <View style={[styles.lecturerAvatar, { backgroundColor: form.lecturer_id === l.id ? colors.primary : colors.muted }]}>
                    <Feather name="user" size={15} color={form.lecturer_id === l.id ? "#fff" : colors.mutedForeground} />
                  </View>
                  <Text style={[styles.lecturerName, { color: colors.foreground }]}>{l.full_name}</Text>
                  {form.lecturer_id === l.id && <Feather name="check-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Enrolled Students</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. 45"
                placeholderTextColor={colors.mutedForeground}
                value={form.enrolled_count}
                onChangeText={(v) => setForm((f) => ({ ...f, enrolled_count: v }))}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: !form.title.trim() || !form.code.trim() || !form.lecturer_id ? 0.5 : 1 }]}
              onPress={handleCreate}
              disabled={saving || !form.title.trim() || !form.code.trim() || !form.lecturer_id}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Course</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Course Modal */}
      <Modal visible={!!editTarget} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditTarget(null)}>
        <View style={[styles.modal, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit Course</Text>
            <TouchableOpacity onPress={() => setEditTarget(null)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Course Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={editForm.title}
                onChangeText={(v) => setEditForm((f) => ({ ...f, title: v }))}
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Course Code</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={editForm.code}
                onChangeText={(v) => setEditForm((f) => ({ ...f, code: v }))}
                autoCapitalize="characters"
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Enrolled Students</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={editForm.enrolled_count}
                onChangeText={(v) => setEditForm((f) => ({ ...f, enrolled_count: v }))}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: !editForm.title.trim() || !editForm.code.trim() ? 0.5 : 1 }]}
              onPress={handleSaveEdit}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
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
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  codeWrap: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  codeText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  editBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  courseTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 10 },
  infoRow: { gap: 6, marginBottom: 12 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginBottom: 12 },
  statsRow: { flexDirection: "row" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  modal: { flex: 1, paddingHorizontal: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  lecturerOption: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  lecturerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  lecturerName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
