import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Contribution } from "@/lib/types";
import { useColors } from "@/hooks/useColors";

function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  return `${days}d left`;
}

interface Props {
  contribution: Contribution;
  isPaid?: boolean;
  onPress?: () => void;
}

export function ContributionCard({ contribution, isPaid, onPress }: Props) {
  const colors = useColors();
  const progress = contribution.paid_count && contribution.total_students
    ? contribution.paid_count / contribution.total_students
    : 0;
  const dl = daysLeft(contribution.deadline);
  const isOverdue = dl === "Overdue";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {contribution.title}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: isPaid ? "#D1FAE5" : isOverdue ? "#FEE2E2" : "#FEF3C7" },
          ]}
        >
          <Feather
            name={isPaid ? "check-circle" : "clock"}
            size={11}
            color={isPaid ? "#065F46" : isOverdue ? "#991B1B" : "#92400E"}
          />
          <Text
            style={[
              styles.badgeText,
              { color: isPaid ? "#065F46" : isOverdue ? "#991B1B" : "#92400E" },
            ]}
          >
            {isPaid ? "Paid" : "Outstanding"}
          </Text>
        </View>
      </View>

      <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
        {contribution.description}
      </Text>

      <View style={styles.row}>
        <Text style={[styles.amount, { color: colors.primary }]}>
          ₦{contribution.amount_per_student.toLocaleString()}
        </Text>
        <Text style={[styles.deadline, { color: isOverdue ? "#EF4444" : colors.mutedForeground }]}>
          {dl}
        </Text>
      </View>

      {typeof progress === "number" && (
        <View style={styles.progressSection}>
          <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${Math.min(progress * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
            {contribution.paid_count}/{contribution.total_students} paid
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1, marginRight: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  desc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  deadline: { fontSize: 12, fontFamily: "Inter_500Medium" },
  progressSection: { gap: 4 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
