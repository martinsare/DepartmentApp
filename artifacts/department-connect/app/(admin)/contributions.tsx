import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function AdminFinance() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { contributions, payments, users, addContribution } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedContrib, setSelectedContrib] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", target_amount: "", amount_per_student: "", deadline: "" });

  const students = users.filter((u) => u.role === "student" && u.status === "active");
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalTarget = contributions.reduce((s, c) => s + c.target_amount, 0);
  const pct = totalTarget > 0 ? Math.min((totalPaid / totalTarget) * 100, 100) : 0;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleCreate = async () => {
    if (!form.title || !form.target_amount || !form.amount_per_student || !form.deadline) return;
    setSaving(true);
    await addContribution({
      id: `contrib-${Date.now()}`,
      title: form.title,
      description: form.description,
      target_amount: parseFloat(form.target_amount),
      amount_per_student: parseFloat(form.amount_per_student),
      deadline: form.deadline,
      department_id: "dept-001",
      created_by: "",
      created_at: new Date().toISOString(),
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ title: "", description: "", target_amount: "", amount_per_student: "", deadline: "" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>Contributions & Dues</Text>
            <Text style={styles.headerTitle}>Finance</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
            <Feather name="plus" size={18} color="#7C3AED" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Collected</Text>
              <Text style={styles.summaryValue}>₦{totalPaid.toLocaleString()}</Text>
              <Text style={styles.summarySub}>of ₦{totalTarget.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>{Math.round(pct)}%</Text>
            </View>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={styles.summaryCaption}>{contributions.length} contributions · {students.length} students</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {contributions.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="credit-card" size={36} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No contributions yet</Text>
          </View>
        ) : contributions.map((contrib) => {
          const contribPayments = payments.filter((p) => p.contribution_id === contrib.id);
          const paid = contribPayments.filter((p) => p.status === "paid").length;
          const paidAmount = contribPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
          const cPct = students.length > 0 ? Math.round((paid / students.length) * 100) : 0;
          const isExpanded = selectedContrib === contrib.id;

          return (
            <TouchableOpacity
              key={contrib.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setSelectedContrib(isExpanded ? null : contrib.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={[styles.cardIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="credit-card" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{contrib.title}</Text>
                  <Text style={[styles.cardDeadline, { color: colors.mutedForeground }]}>
                    Due: {contrib.deadline} · ₦{contrib.amount_per_student.toLocaleString()}/student
                  </Text>
                </View>
                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
              </View>

              {isExpanded && (
                <View style={[styles.cardBody, { borderTopColor: colors.border }]}>
                  {contrib.description ? (
                    <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{contrib.description}</Text>
                  ) : null}
                  <View style={styles.statRow}>
                    {[
                      { label: "Paid", value: paid, color: "#10B981" },
                      { label: "Unpaid", value: students.length - paid, color: "#EF4444" },
                      { label: "Collected", value: `₦${paidAmount.toLocaleString()}`, color: colors.primary },
                    ].map((s) => (
                      <View key={s.label} style={[styles.statBox, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[styles.smallBarBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.smallBarFill, { width: `${cPct}%` as any, backgroundColor: "#10B981" }]} />
                  </View>
                  <Text style={[styles.pctCaption, { color: colors.mutedForeground }]}>{cPct}% of students paid</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New Contribution</Text>
            {[
              { key: "title", label: "Title", placeholder: "Level 300 Development Levy" },
              { key: "description", label: "Description (optional)", placeholder: "Department renovation fund" },
              { key: "target_amount", label: "Target Amount (₦)", placeholder: "50000", keyboardType: "numeric" },
              { key: "amount_per_student", label: "Amount Per Student (₦)", placeholder: "2500", keyboardType: "numeric" },
              { key: "deadline", label: "Deadline (YYYY-MM-DD)", placeholder: "2025-12-31" },
            ].map(({ key, label, placeholder, keyboardType }) => (
              <View key={key} style={{ marginBottom: 12 }}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                  placeholder={placeholder} placeholderTextColor={colors.mutedForeground}
                  keyboardType={(keyboardType as any) ?? "default"}
                  value={(form as any)[key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                />
              </View>
            ))}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
              onPress={handleCreate} disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Create Contribution</Text>}
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
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#7C3AED", fontSize: 13, fontFamily: "Inter_700Bold" },
  summaryCard: { borderRadius: 16, padding: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  summaryLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular" },
  summaryValue: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold" },
  summarySub: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  summaryBadgeText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  barBg: { height: 5, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  barFill: { height: "100%", backgroundColor: "#fff", borderRadius: 3 },
  summaryCaption: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontFamily: "Inter_400Regular" },
  scroll: { padding: 16 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 40, alignItems: "center", gap: 10, marginTop: 8 },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 10, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardDeadline: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardBody: { borderTopWidth: 1, padding: 14, gap: 12 },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statRow: { flexDirection: "row", gap: 8 },
  statBox: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", gap: 2 },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  smallBarBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  smallBarFill: { height: "100%", borderRadius: 3 },
  pctCaption: { fontSize: 11, fontFamily: "Inter_400Regular" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 16 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8, marginBottom: 10 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
