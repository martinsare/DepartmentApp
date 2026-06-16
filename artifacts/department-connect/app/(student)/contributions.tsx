import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function StudentContributions() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { contributions, payments, addPayment } = useData();
  const [paying, setPaying] = useState<string | null>(null);
  const [txInput, setTxInput] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const myPayments = payments.filter((p) => p.student_id === user?.id);
  const totalOwed = contributions.reduce((s, c) => {
    const paid = myPayments.some((p) => p.contribution_id === c.id && (p.status === "paid" || p.status === "verified"));
    return paid ? s : s + c.amount_per_student;
  }, 0);
  const totalPaid = myPayments.filter((p) => p.status === "paid" || p.status === "verified").reduce((s, p) => s + p.amount, 0);

  const handlePay = (contribId: string, amount: number) => {
    Alert.prompt
      ? Alert.prompt(
          "Enter Transaction ID",
          "Paste your payment reference from your bank app",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Submit", onPress: (tx) => submitPayment(contribId, amount, tx ?? "") },
          ]
        )
      : Alert.alert("Pay Contribution", "Enter your bank transfer transaction ID in the field below and tap Submit.", [
          { text: "Cancel", style: "cancel" },
          { text: "Submit", onPress: () => setPaying(contribId) },
        ]);
  };

  const submitPayment = async (contribId: string, amount: number, txId: string) => {
    if (!txId.trim() || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addPayment({
      id: `pay-${Date.now()}`,
      contribution_id: contribId,
      student_id: user.id,
      transaction_id: txId.trim(),
      amount,
      status: "pending",
      created_at: new Date().toISOString(),
    });
    setPaying(null);
    setTxInput("");
    Alert.alert("Submitted", "Your payment has been submitted and is awaiting verification.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerSub}>Department Dues</Text>
        <Text style={styles.headerTitle}>Contributions</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₦{totalPaid.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Paid</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₦{totalOwed.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Outstanding</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{contributions.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {contributions.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="credit-card" size={36} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No contributions yet</Text>
          </View>
        ) : contributions.map((contrib) => {
          const myPayment = myPayments.find((p) => p.contribution_id === contrib.id);
          const isPaid = myPayment?.status === "paid" || myPayment?.status === "verified";
          const isPending = myPayment?.status === "pending";
          const isPayingThis = paying === contrib.id;

          return (
            <View key={contrib.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={[styles.cardIcon, {
                  backgroundColor: isPaid ? "#10B98115" : isPending ? "#F59E0B15" : colors.primary + "15",
                }]}>
                  <Feather
                    name={isPaid ? "check-circle" : isPending ? "clock" : "credit-card"}
                    size={18}
                    color={isPaid ? "#10B981" : isPending ? "#F59E0B" : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{contrib.title}</Text>
                  <Text style={[styles.cardAmount, { color: colors.primary }]}>₦{contrib.amount_per_student.toLocaleString()}</Text>
                  <Text style={[styles.cardDeadline, { color: colors.mutedForeground }]}>Due: {contrib.deadline}</Text>
                </View>
                <View style={[styles.statusPill, {
                  backgroundColor: isPaid ? "#10B98115" : isPending ? "#F59E0B15" : "#EF444415",
                }]}>
                  <Text style={[styles.statusText, {
                    color: isPaid ? "#10B981" : isPending ? "#F59E0B" : "#EF4444",
                  }]}>
                    {isPaid ? "Paid" : isPending ? "Pending" : "Unpaid"}
                  </Text>
                </View>
              </View>

              {contrib.description ? (
                <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{contrib.description}</Text>
              ) : null}

              {!isPaid && !isPending && (
                <View style={[styles.paySection, { borderTopColor: colors.border }]}>
                  {isPayingThis ? (
                    <View style={styles.txRow}>
                      <TextInput
                        style={[styles.txInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                        placeholder="Transaction reference / ID"
                        placeholderTextColor={colors.mutedForeground}
                        value={txInput}
                        onChangeText={setTxInput}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={[styles.txSubmitBtn, { backgroundColor: colors.primary }]}
                        onPress={() => submitPayment(contrib.id, contrib.amount_per_student, txInput)}
                      >
                        <Text style={styles.txSubmitText}>Submit</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.payBtn, { backgroundColor: colors.primary }]}
                      onPress={() => { setPaying(contrib.id); setTxInput(""); }}
                      activeOpacity={0.85}
                    >
                      <Feather name="send" size={14} color="#fff" />
                      <Text style={styles.payBtnText}>Mark as Paid</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {isPending && myPayment && (
                <View style={[styles.pendingInfo, { borderTopColor: colors.border, backgroundColor: "#FEF3C7" }]}>
                  <Feather name="clock" size={13} color="#92400E" />
                  <Text style={[styles.pendingText, { color: "#92400E" }]}>
                    Awaiting verification · Ref: {myPayment.transaction_id}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2, marginBottom: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 16 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  summaryLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  summaryDivider: { width: 1, height: 36 },
  scroll: { padding: 16 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 40, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 12, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardAmount: { fontSize: 17, fontFamily: "Inter_700Bold", marginTop: 2 },
  cardDeadline: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", paddingHorizontal: 14, paddingBottom: 10 },
  paySection: { borderTopWidth: 1, padding: 12 },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 12 },
  payBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  txRow: { flexDirection: "row", gap: 8 },
  txInput: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13, fontFamily: "Inter_400Regular" },
  txSubmitBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  txSubmitText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  pendingInfo: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, padding: 12 },
  pendingText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
});
