import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { Course } from "@/lib/types";

export default function AdminCourses() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { courses, users, addCourse, updateCourse } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", code: "", lecturer_id: "" });

  const lecturers = users.filter((u) => u.role === "lecturer" && u.status === "active");
  const q = search.toLowerCase();
  const filtered = courses.filter((c) => !q || c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.lecturer_name ?? "").toLowerCase().includes(q));

  const openCreate = () => {
    setEditCourse(null);
    setForm({ title: "", code: "", lecturer_id: "" });
    setModalOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditCourse(c);
    setForm({ title: c.title, code: c.code, lecturer_id: c.lecturer_id });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.code || !form.lecturer_id) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    if (editCourse) {
      await updateCourse(editCourse.id, { title: form.title, code: form.code, lecturer_id: form.lecturer_id });
    } else {
      await addCourse({
        id: `course-${Date.now()}`,
        title: form.title, code: form.code.toUpperCase(),
        lecturer_id: form.lecturer_id,
        department_id: "dept-001",
        enrolled_count: 0,
      });
    }
    setSaving(false);
    setModalOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>Department Courses</Text>
            <Text style={styles.headerTitle}>Courses</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.85}>
            <Feather name="plus" size={18} color="#7C3AED" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.searchWrap, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Feather name="search" size={15} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={[styles.searchInput, { color: "#fff" }]}
            placeholder="Search courses…"
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={search} onChangeText={setSearch}
          />
          {!!search && <TouchableOpacity onPress={() => setSearch("")}><Feather name="x" size={14} color="rgba(255,255,255,0.7)" /></TouchableOpacity>}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="book-open" size={36} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No courses yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Tap Add to create your first course</Text>
          </View>
        ) : filtered.map((course) => {
          const lecturer = users.find((u) => u.id === course.lecturer_id);
          return (
            <TouchableOpacity
              key={course.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openEdit(course)} activeOpacity={0.85}
            >
              <View style={[styles.courseCodeBadge, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.courseCodeText, { color: colors.primary }]}>{course.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.courseTitle, { color: colors.foreground }]} numberOfLines={1}>{course.title}</Text>
                {lecturer && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <Feather name="user" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.courseMeta, { color: colors.mutedForeground }]}>{lecturer.full_name}</Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <Feather name="users" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.courseMeta, { color: colors.mutedForeground }]}>{course.enrolled_count} enrolled</Text>
                </View>
              </View>
              <Feather name="edit-2" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              {editCourse ? "Edit Course" : "New Course"}
            </Text>

            {[{ key: "code", label: "Course Code", placeholder: "CSC301" },
              { key: "title", label: "Course Title", placeholder: "Introduction to Computer Science" }]
              .map(({ key, label, placeholder }) => (
                <View key={key} style={{ marginBottom: 14 }}>
                  <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                    placeholder={placeholder} placeholderTextColor={colors.mutedForeground}
                    value={(form as any)[key]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  />
                </View>
              ))}

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Assign Lecturer</Text>
            <ScrollView style={{ maxHeight: 160, marginBottom: 20 }}>
              {lecturers.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.lecturerRow, {
                    backgroundColor: form.lecturer_id === l.id ? colors.primary + "15" : colors.muted,
                    borderColor: form.lecturer_id === l.id ? colors.primary : colors.border,
                  }]}
                  onPress={() => setForm((f) => ({ ...f, lecturer_id: l.id }))}
                >
                  <View style={[styles.lecturerAvatar, { backgroundColor: form.lecturer_id === l.id ? colors.primary : colors.border }]}>
                    <Text style={{ color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" }}>{l.full_name[0]}</Text>
                  </View>
                  <Text style={[styles.lecturerName, { color: form.lecturer_id === l.id ? colors.primary : colors.foreground }]}>{l.full_name}</Text>
                  {form.lecturer_id === l.id && <Feather name="check-circle" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
              onPress={handleSave} disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editCourse ? "Save Changes" : "Create Course"}</Text>}
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
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#7C3AED", fontSize: 13, fontFamily: "Inter_700Bold" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  scroll: { padding: 16 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 40, alignItems: "center", gap: 8, marginTop: 8 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  card: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  courseCodeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  courseCodeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  courseTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  courseMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 20 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  lecturerRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 11, marginBottom: 6 },
  lecturerAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  lecturerName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginBottom: 10 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
