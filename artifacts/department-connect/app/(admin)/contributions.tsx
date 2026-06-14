import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { Contribution } from "@/lib/demoData";

export default function AdminContributions() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { contributions, payments, users, addContribution } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amount_per_student: "", deadline: "" });
  const [viewingContrib, setViewingContrib] = useState<typeof contributions[0] | null>(null);

  const students = users.filter((u) => u.role === "student");

  const handleCreate = async () => {
    if (!form.title.trim() || !form.amount_per_student || !form.deadline) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    const perStudent = parseFloat(form.amount_per_student) || 0;
    const c: Contribution = {
      id: `contrib-${Date.now()}`,
      title: form.title,
      description: form.description || `Contribution: ${form.title}`,
      target_amount: perStudent * students.length,
      amount_per_student: perStudent,
      deadline: form.deadline,
      department_id: user?.department_id ?? "",
      created_by: user?.id ?? "",
      created_at: new Date().toISOString(),
      paid_count: 0,
      total_students: students.length,
    };
    addContribution(c);
    setSaving(false);
    setModalOpen(false);
    setForm({ title: "", description: "", amount_per_student: "", deadline: "" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemind = (contribTitle: string, outstanding: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Send Reminder",
      `Send payment reminder to ${outstanding} student${outstanding !== 1 ? "s" : ""} who haven't paid for "${contribTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Reminder Sent", `Reminder sent to ${outstanding} student${outstanding !== 1 ? "s" : ""}.`);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Contributions</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setModalOpen(true); }}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]} showsVerticalScrollIndicator={false}>
        {contributions.map((contrib) => {
          const contribPayments = payments.filter((p) => p.contribution_id === contrib.id && p.status === "paid");
          const collected = contribPayments.reduce((acc, p) => acc + p.amount, 0);
          const paidStudents = new Set(contribPayments.map((p) => p.student_id)).size;
          const outstanding = students.length - paidStudents;
          const progress = students.length > 0 ? paidStudents / students.length : 0;

          return (
            <TouchableOpacity
              key={contrib.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewingContrib(contrib); }}
              activeOpacity={0.9}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.contribTitle, { color: colors.foreground }]}>{contrib.title}</Text>
                <TouchableOpacity
                  style={[styles.remindBtn, { backgroundColor: colors.secondary }]}
                  onPress={() => handleRemind(contrib.title, outstanding)}
                >
                  <Feather name="send" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{contrib.description}</Text>

              <View style={styles.amountRow}>
                <View>
                  <Text style={[styles.collected, { color: colors.primary }]}>₦{collected.toLocaleString()}</Text>
                  <Text style={[styles.targetLabel, { color: colors.mutedForeground }]}>of ₦{contrib.target_amount.toLocaleString()} target</Text>
                </View>
                <View style={styles.deadline}>
                  <Feather name="clock" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.deadlineText, { color: colors.mutedForeground }]}>{contrib.deadline}</Text>
                </View>
              </View>

              <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.min(progress * 100, 100)}%` as any }]} />
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statChip, { backgroundColor: "#D1FAE5" }]}>
                  <Feather name="check-circle" size={12} color="#065F46" />
                  <Text style={[styles.statText, { color: "#065F46" }]}>{paidStudents} paid</Text>
                </View>
                <View style={[styles.statChip, { backgroundColor: "#FEE2E2" }]}>
                  <Feather name="alert-circle" size={12} color="#991B1B" />
                  <Text style={[styles.statText, { color: "#991B1B" }]}>{outstanding} outstanding</Text>
                </View>
                <View style={[styles.statChip, { backgroundColor: colors.secondary }]}>
                  <Feather name="users" size={12} color={colors.primary} />
                  <Text style={[styles.statText, { color: colors.primary }]}>{students.length} total</Text>
                </View>
              </View>

              <Text style={[styles.studentListTitle, { color: colors.foreground }]}>Payment Status</Text>
              {students.slice(0, 5).map((student) => {
                const paid = contribPayments.some((p) => p.student_id === student.id);
                return (
                  <View key={student.id} style={styles.studentRow}>
                    <View style={[styles.studentAvatar, { backgroundColor: paid ? "#D1FAE5" : "#FEE2E2" }]}>
                      <Feather name={paid ? "check" : "x"} size={12} color={paid ? "#065F46" : "#991B1B"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.studentName, { color: colors.foreground }]}>{student.full_name}</Text>
                      {student.matric_number && (
                        <Text style={[styles.studentMatric, { color: colors.mutedForeground }]}>{student.matric_number}</Text>
                      )}
                    </View>
                    <Text style={[styles.studentStatus, { color: paid ? "#10B981" : "#EF4444" }]}>
                      {paid ? `₦${contrib.amount_per_student.toLocaleString()}` : "Outstanding"}
                    </Text>
                  </View>
                );
              })}
              {students.length > 5 && (
                <Text style={[styles.moreText, { color: colors.mutedForeground }]}>
                  Tap card to see all {students.length} students →
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {contributions.length === 0 && (
          <View style={styles.empty}>
            <Feather name="dollar-sign" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No contributions yet</Text>
            <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setModalOpen(true)}>
              <Text style={styles.emptyBtnText}>Create First Contribution</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Contribution Detail Modal - all students */}
      <Modal visible={!!viewingContrib} transparent animationType="slide" onRequestClose={() => setViewingContrib(null)}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setViewingContrib(null)} />
          {viewingContrib && (() => {
            const cPayments = payments.filter((p) => p.contribution_id === viewingContrib.id && p.status === "paid");
            const collected = cPayments.reduce((acc, p) => acc + p.amount, 0);
            const paidIds = new Set(cPayments.map((p) => p.student_id));
            const paidCount = paidIds.size;
            const progress = students.length > 0 ? paidCount / students.length : 0;
            return (
              <View style={[{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: insets.bottom + 24, maxHeight: "90%" }, { backgroundColor: colors.background }]}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
                <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 4 }} numberOfLines={2}>{viewingContrib.title}</Text>
                <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 14 }}>{viewingContrib.description}</Text>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
                  <View>
                    <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.primary }}>₦{collected.toLocaleString()}</Text>
                    <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>of ₦{viewingContrib.target_amount.toLocaleString()} target</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Feather name="clock" size={13} color={colors.mutedForeground} />
                    <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Due {viewingContrib.deadline}</Text>
                  </View>
                </View>

                <View style={[{ height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 14 }, { backgroundColor: colors.border }]}>
                  <View style={{ height: "100%", borderRadius: 3, backgroundColor: colors.primary, width: `${Math.min(progress * 100, 100)}%` as any }} />
                </View>

                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#D1FAE5", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                    <Feather name="check-circle" size={12} color="#065F46" />
                    <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: "#065F46" }}>{paidCount} paid</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEE2E2", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                    <Feather name="alert-circle" size={12} color="#991B1B" />
                    <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: "#991B1B" }}>{students.length - paidCount} outstanding</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 10 }}>
                  All Students ({students.length})
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
                  {students.map((student) => {
                    const paid = paidIds.has(student.id);
                    return (
                      <View key={student.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                        <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: paid ? "#D1FAE5" : "#FEE2E2" }}>
                          <Feather name={paid ? "check" : "x"} size={13} color={paid ? "#065F46" : "#991B1B"} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground }}>{student.full_name}</Text>
                          {student.matric_number && (
                            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{student.matric_number}</Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: paid ? "#10B981" : "#EF4444" }}>
                          {paid ? `₦${viewingContrib.amount_per_student.toLocaleString()}` : "Outstanding"}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={{ marginTop: 16, borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: colors.primary }}
                  onPress={() => setViewingContrib(null)}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" }}>Close</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* Create Contribution Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Contribution</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Departmental Dues 2025"
                placeholderTextColor={colors.mutedForeground}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="What is this contribution for?"
                placeholderTextColor={colors.mutedForeground}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Amount per Student (₦) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. 5000"
                placeholderTextColor={colors.mutedForeground}
                value={form.amount_per_student}
                onChangeText={(v) => setForm((f) => ({ ...f, amount_per_student: v }))}
                keyboardType="numeric"
              />
              {form.amount_per_student && students.length > 0 && (
                <Text style={[styles.calcHint, { color: colors.primary }]}>
                  Total target: ₦{(parseFloat(form.amount_per_student) * students.length).toLocaleString()} ({students.length} students)
                </Text>
              )}
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Deadline (YYYY-MM-DD) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. 2025-12-31"
                placeholderTextColor={colors.mutedForeground}
                value={form.deadline}
                onChangeText={(v) => setForm((f) => ({ ...f, deadline: v }))}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: !form.title.trim() || !form.amount_per_student || !form.deadline ? 0.5 : 1 }]}
              onPress={handleCreate}
              disabled={saving || !form.title.trim() || !form.amount_per_student || !form.deadline}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Create Contribution</Text>}
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
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  contribTitle: { fontSize: 16, fontFamily: "Inter_700Bold", flex: 1, marginRight: 8 },
  remindBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  desc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  collected: { fontSize: 24, fontFamily: "Inter_700Bold" },
  targetLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  deadline: { flexDirection: "row", alignItems: "center", gap: 4 },
  deadlineText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  studentListTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 },
  studentAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  studentName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  studentMatric: { fontSize: 11, fontFamily: "Inter_400Regular" },
  studentStatus: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  moreText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", paddingTop: 4 },
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
  textArea: { minHeight: 80, paddingTop: 12 },
  calcHint: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 4 },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
