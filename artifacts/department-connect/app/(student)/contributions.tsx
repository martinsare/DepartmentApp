import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContributionCard } from "@/components/ContributionCard";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { Contribution, Payment } from "@/lib/demoData";

export default function StudentContributions() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { contributions, payments, addPayment } = useData();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const topPad = insets.top;

  const isPaid = (contribId: string) =>
    payments.some(
      (p) => p.contribution_id === contribId && p.student_id === user?.id && p.status === "paid"
    );

  const getPayment = (contribId: string) =>
    payments.find((p) => p.contribution_id === contribId && p.student_id === user?.id);

  const selectedContrib = contributions.find((c) => c.id === payingId);

  const handlePay = async () => {
    if (!selectedContrib || !user) return;
    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 1800));
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      contribution_id: selectedContrib.id,
      student_id: user.id,
      transaction_id: `TXN-${Date.now()}`,
      amount: selectedContrib.amount_per_student,
      status: "paid",
      created_at: new Date().toISOString(),
    };
    addPayment(payment);
    setProcessing(false);
    setPayingId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Contributions</Text>

        {contributions.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="credit-card" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No contributions</Text>
          </View>
        ) : (
          contributions.map((c) => {
            const paid = isPaid(c.id);
            return (
              <View key={c.id}>
                <ContributionCard
                  contribution={c}
                  isPaid={paid}
                  onPress={() => !paid && setPayingId(c.id)}
                />
                {paid && (
                  <View style={[styles.receiptRow, { backgroundColor: "#D1FAE5", borderColor: "#A7F3D0" }]}>
                    <Feather name="check-circle" size={14} color="#065F46" />
                    <Text style={[styles.receiptText, { color: "#065F46" }]}>
                      Paid · {getPayment(c.id)?.transaction_id}
                    </Text>
                    <Feather name="download" size={14} color="#065F46" style={{ marginLeft: "auto" }} />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={!!payingId} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            {selectedContrib && (
              <>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {selectedContrib.title}
                </Text>
                <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
                  {selectedContrib.description}
                </Text>
                <View style={[styles.amountRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Amount</Text>
                  <Text style={[styles.amountValue, { color: colors.primary }]}>
                    ₦{selectedContrib.amount_per_student.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.amountRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Deadline</Text>
                  <Text style={[styles.amountValue, { color: colors.foreground }]}>
                    {selectedContrib.deadline}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.payBtn, { backgroundColor: colors.primary, opacity: processing ? 0.7 : 1 }]}
                  onPress={handlePay}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Feather name="credit-card" size={18} color="#fff" />
                      <Text style={styles.payBtnText}>Pay with Paystack</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => setPayingId(null)}
                  disabled={processing}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 20 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: -4,
    marginBottom: 14,
  },
  receiptText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  modalDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 20 },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  amountLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  amountValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 10,
  },
  payBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
