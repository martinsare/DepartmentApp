import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { Semester } from "@/lib/types";

export default function AdminSemesters() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { semesters, createSemester, closeSemester } = useData();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "" });
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const active = semesters.find((s) => s.is_active);
  const archived = semesters.filter((s) => !s.is_active);

  const handleCreate = async () => {
    if (!form.name || !form.start_date || !form.end_date) return;
    setSaving(true);
    await createSemester({
      id: `sem-${Date.now()}`,
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date,
      is_active: !active,
      created_at: new Date().toISOString(),
    });
    setSaving(false);
    setCreateOpen(false);
    setForm({ name: "", start_date: "", end_date: "" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClose = () => {
    if (!active) return;
    Alert.alert(
      "Close Semester",
      `Close "${active.name}"? This will:\n• Archive all course data\n• Clear all course rep assignments\n• Lock attendance records\n• Notify all lecturers`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Semester",
          style: "destructive",
          onPress: async () => {
            await closeSemester(active.id, user?.id ?? "", user?.full_name ?? "");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerSub}>Academic Calendar</Text>
        <Text style={styles.headerTitle}>Semesters</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {active ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTIVE SEMESTER</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#10B981" }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.semName, { color: colors.foreground }]}>{active.name}</Text>
                  <Text style={[styles.semDates, { color: colors.mutedForeground }]}>
                    {active.start_date} → {active.end_date}
                  </Text>
                </View>
                <View style={[styles.activeBadge, { backgroundColor: "#10B98115" }]}>
                  <View style={[styles.dot, { backgroundColor: "#10B981" }]} />
                  <Text style={[styles.activeBadgeText, { color: "#10B981" }]}>Active</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Feather name="archive" size={15} color="#EF4444" />
                <Text style={styles.closeBtnText}>Close Semester</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="calendar" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active semester</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => setCreateOpen(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.createBtnText}>New Semester</Text>
        </TouchableOpacity>

        {archived.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ARCHIVED</Text>
            {archived.map((s) => (
              <View key={s.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.semName, { color: colors.foreground }]}>{s.name}</Text>
                <Text style={[styles.semDates, { color: colors.mutedForeground }]}>
                  {s.start_date} → {s.end_date}
                </Text>
                {s.archived_at && (
                  <Text style={[styles.archivedAt, { color: colors.mutedForeground }]}>
                    Closed {new Date(s.archived_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={createOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCreateOpen(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Semester</Text>
            <TouchableOpacity onPress={() => setCreateOpen(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          {[
            { label: "Semester Name", key: "name" as const, placeholder: "e.g. 2024/2025 First Semester" },
            { label: "Start Date", key: "start_date" as const, placeholder: "YYYY-MM-DD" },
            { label: "End Date", key: "end_date" as const, placeholder: "YYYY-MM-DD" },
          ].map((f) => (
            <View key={f.key} style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                value={form[f.key]}
                onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                placeholder={f.placeholder}
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          ))}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={handleCreate}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{saving ? "Creating…" : "Create Semester"}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  scroll: { padding: 16, gap: 12 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, marginTop: 8, paddingHorizontal: 4 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  semName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  semDates: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  archivedAt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  activeBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  closeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 10, marginTop: 4 },
  closeBtnText: { color: "#EF4444", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyCard: { borderWidth: 1, borderRadius: 16, padding: 32, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  createBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
  createBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modal: { flex: 1, padding: 24 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
