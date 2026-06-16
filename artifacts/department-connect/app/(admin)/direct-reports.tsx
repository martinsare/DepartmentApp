import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { DirectReport } from "@/lib/types";

const ISSUE_TYPE_LABELS: Record<DirectReport["issue_type"], string> = {
  harassment: "Harassment",
  academic_misconduct: "Academic Misconduct",
  grading_dispute: "Grading Dispute",
  safety_concern: "Safety Concern",
  discrimination: "Discrimination",
  other: "Other",
};

const STATUS_CONFIG = {
  pending: { color: "#F59E0B", bg: "#FEF3C7", label: "Pending" },
  reviewed: { color: "#3B82F6", bg: "#DBEAFE", label: "Reviewed" },
  resolved: { color: "#10B981", bg: "#D1FAE5", label: "Resolved" },
};

export default function AdminDirectReports() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { directReports, reviewDirectReport } = useData();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | DirectReport["status"]>("all");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = filter === "all" ? directReports : directReports.filter((r) => r.status === filter);
  const pending = directReports.filter((r) => r.status === "pending").length;

  const handleReview = (report: DirectReport) => {
    Alert.alert("Mark as Reviewed", `Mark this ${ISSUE_TYPE_LABELS[report.issue_type]} report as reviewed?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Mark Reviewed", onPress: () => reviewDirectReport(report.id, user?.id ?? "", user?.full_name ?? "") },
    ]);
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerSub}>Student Escalations</Text>
        <Text style={styles.headerTitle}>Direct Reports</Text>
        {pending > 0 && (
          <View style={styles.pendingBadge}>
            <Feather name="alert-circle" size={14} color="#F59E0B" />
            <Text style={styles.pendingText}>{pending} pending review</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(["all", "pending", "reviewed", "resolved"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, { color: filter === f ? "#fff" : colors.mutedForeground }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shield" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No reports found</Text>
          </View>
        )}

        {filtered.map((report) => {
          const st = STATUS_CONFIG[report.status];
          const isExpanded = expanded === report.id;
          return (
            <TouchableOpacity
              key={report.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setExpanded(isExpanded ? null : report.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={[styles.typeTag, { backgroundColor: `${colors.primary}18` }]}>
                  <Text style={[styles.typeTagText, { color: colors.primary }]}>
                    {ISSUE_TYPE_LABELS[report.issue_type]}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>

              <Text style={[styles.reporter, { color: colors.foreground }]}>
                {report.reporter_name ?? "Anonymous"}
              </Text>
              <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatTime(report.created_at)}</Text>

              {isExpanded && (
                <View style={[styles.expanded, { borderTopColor: colors.border }]}>
                  <Text style={[styles.descLabel, { color: colors.mutedForeground }]}>Description</Text>
                  <Text style={[styles.desc, { color: colors.foreground }]}>{report.description}</Text>
                  {report.status === "pending" && (
                    <TouchableOpacity
                      style={[styles.reviewBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleReview(report)}
                    >
                      <Feather name="check-circle" size={15} color="#fff" />
                      <Text style={styles.reviewBtnText}>Mark as Reviewed</Text>
                    </TouchableOpacity>
                  )}
                  {report.reviewed_at && (
                    <Text style={[styles.reviewedAt, { color: colors.mutedForeground }]}>
                      Reviewed {formatTime(report.reviewed_at)}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  pendingBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, backgroundColor: "rgba(245,158,11,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: "flex-start" },
  pendingText: { color: "#F59E0B", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  scroll: { padding: 16, gap: 12 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 40, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeTagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  reporter: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  date: { fontSize: 12, fontFamily: "Inter_400Regular" },
  expanded: { borderTopWidth: 1, paddingTop: 12, marginTop: 8, gap: 8 },
  descLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  desc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  reviewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 12, marginTop: 8 },
  reviewBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reviewedAt: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
