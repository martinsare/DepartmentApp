import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function AdminContributions() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { contributions, payments, users } = useData();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const students = users.filter((u) => u.role === "student");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Contributions</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {contributions.map((contrib) => {
          const contribPayments = payments.filter((p) => p.contribution_id === contrib.id && p.status === "paid");
          const collected = contribPayments.reduce((acc, p) => acc + p.amount, 0);
          const paidStudents = new Set(contribPayments.map((p) => p.student_id)).size;
          const outstanding = students.length - paidStudents;
          const progress = students.length > 0 ? paidStudents / students.length : 0;

          return (
            <View key={contrib.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.contribTitle, { color: colors.foreground }]}>{contrib.title}</Text>
                <TouchableOpacity style={[styles.remindBtn, { backgroundColor: colors.secondary }]}>
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

              {/* Per-student list */}
              <Text style={[styles.studentListTitle, { color: colors.foreground }]}>Payment Status</Text>
              {students.slice(0, 4).map((student) => {
                const paid = contribPayments.some((p) => p.student_id === student.id);
                return (
                  <View key={student.id} style={styles.studentRow}>
                    <View style={[styles.studentAvatar, { backgroundColor: paid ? "#D1FAE5" : "#FEE2E2" }]}>
                      <Feather name={paid ? "check" : "x"} size={12} color={paid ? "#065F46" : "#991B1B"} />
                    </View>
                    <Text style={[styles.studentName, { color: colors.foreground }]}>{student.full_name}</Text>
                    <Text style={[styles.studentStatus, { color: paid ? "#10B981" : "#EF4444" }]}>
                      {paid ? "Paid" : "Outstanding"}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
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
  remindBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
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
  studentListTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  studentAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  studentName: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  studentStatus: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
