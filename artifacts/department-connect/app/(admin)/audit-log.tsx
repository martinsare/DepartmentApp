import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { AuditEntry } from "@/lib/types";

const ACTION_ICONS: Record<string, any> = {
  account_approved: "user-check",
  account_rejected: "user-x",
  account_suspended: "slash",
  course_created: "book-open",
  course_edited: "edit-2",
  lecturer_assigned: "user-plus",
  course_rep_assigned: "star",
  course_rep_removed: "star",
  semester_closed: "archive",
  semester_created: "calendar",
  student_unenrolled: "user-minus",
  payment_recorded: "credit-card",
  direct_report_submitted: "alert-triangle",
  issue_escalated: "alert-circle",
  attendance_session_opened: "play-circle",
  attendance_session_closed: "stop-circle",
  profile_flagged: "flag",
};

const ACTION_COLORS: Record<string, string> = {
  account_approved: "#10B981",
  account_rejected: "#EF4444",
  account_suspended: "#F59E0B",
  course_created: "#3B82F6",
  semester_closed: "#EF4444",
  direct_report_submitted: "#F59E0B",
  issue_escalated: "#F59E0B",
};

export default function AdminAuditLog() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { auditLog } = useData();
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const ACTION_FILTERS = [
    { label: "All", value: null },
    { label: "Accounts", value: "account" },
    { label: "Courses", value: "course" },
    { label: "Reps", value: "course_rep" },
    { label: "Semester", value: "semester" },
    { label: "Reports", value: "report" },
  ];

  const filtered = auditLog.filter((e) => {
    const matchSearch = !search || e.action.includes(search.toLowerCase()) ||
      (e.actor_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.target_id ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filterAction || e.action.includes(filterAction) ||
      (filterAction === "report" && (e.action.includes("report") || e.action.includes("escalat")));
    return matchSearch && matchFilter;
  });

  const formatAction = (action: string) =>
    action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerSub}>Security & Compliance</Text>
        <Text style={styles.headerTitle}>Audit Log</Text>
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Feather name="search" size={15} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search actions, actors…"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {ACTION_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterChip,
              filterAction === f.value
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }
            ]}
            onPress={() => setFilterAction(f.value)}
          >
            <Text style={[styles.filterChipText, { color: filterAction === f.value ? "#fff" : colors.mutedForeground }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{filtered.length} entries</Text>

        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="file-text" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No audit entries found</Text>
          </View>
        )}

        {filtered.map((entry) => {
          const icon = ACTION_ICONS[entry.action] ?? "activity";
          const accentColor = ACTION_COLORS[entry.action] ?? colors.primary;
          return (
            <View key={entry.id} style={[styles.entry, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.entryIcon, { backgroundColor: `${accentColor}18` }]}>
                <Feather name={icon} size={16} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.entryAction, { color: colors.foreground }]}>{formatAction(entry.action)}</Text>
                {entry.actor_name && (
                  <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>
                    by {entry.actor_name}
                  </Text>
                )}
                {entry.target_id && (
                  <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>
                    target: {entry.target_id}
                  </Text>
                )}
                <Text style={[styles.entryTime, { color: colors.mutedForeground }]}>{formatTime(entry.created_at)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2, marginBottom: 12 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, fontFamily: "Inter_400Regular" },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: "row", alignItems: "center" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  scroll: { padding: 16, gap: 8 },
  count: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  entry: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  entryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  entryAction: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  entryMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  entryTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
});
