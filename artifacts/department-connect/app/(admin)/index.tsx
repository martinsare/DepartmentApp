import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { StatsCard } from "@/components/StatsCard";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { users, courses, sessions, attendance, contributions, payments, announcements, markAnnouncementRead } = useData();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const students = users.filter((u) => u.role === "student");
  const lecturers = users.filter((u) => u.role === "lecturer");
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((acc, p) => acc + p.amount, 0);
  const totalTarget = contributions.reduce((acc, c) => acc + c.target_amount, 0);
  const recentAnnouncements = announcements.slice(0, 3);

  const QUICK_ACTIONS = [
    { label: "Add Student", icon: "user-plus", color: colors.primary },
    { label: "Add Lecturer", icon: "briefcase", color: "#10B981" },
    { label: "New Contribution", icon: "dollar-sign", color: "#F59E0B" },
    { label: "Announcement", icon: "bell", color: "#3B82F6" },
  ];

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/login");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.role, { color: colors.mutedForeground }]}>Admin</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{user?.full_name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.muted }]}>
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatsCard label="Students" value={students.length} icon="users" />
        <StatsCard label="Lecturers" value={lecturers.length} icon="briefcase" color="#10B981" />
        <StatsCard label="Courses" value={courses.length} icon="book-open" color="#3B82F6" />
      </View>

      {/* Finance summary */}
      <View style={[styles.financeCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.financeLabel}>Total Collected</Text>
        <Text style={styles.financeValue}>₦{totalPaid.toLocaleString()}</Text>
        <View style={styles.financeBar}>
          <View style={[styles.financeFill, { width: `${totalTarget > 0 ? Math.min((totalPaid / totalTarget) * 100, 100) : 0}%` as any }]} />
        </View>
        <Text style={styles.financeTarget}>Target: ₦{totalTarget.toLocaleString()}</Text>
      </View>

      {/* Quick actions */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.actionBtn, { backgroundColor: action.color + "15", borderColor: action.color + "30" }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
              <Feather name={action.icon as any} size={18} color="#fff" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent announcements */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Announcements</Text>
      {recentAnnouncements.map((ann) => (
        <AnnouncementCard key={ann.id} announcement={ann} onPress={() => markAnnouncementRead(ann.id)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  role: { fontSize: 12, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  financeCard: { borderRadius: 20, padding: 20, marginBottom: 24 },
  financeLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  financeValue: { color: "#fff", fontSize: 32, fontFamily: "Inter_700Bold", marginBottom: 10 },
  financeBar: { height: 6, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  financeFill: { height: "100%", backgroundColor: "#fff", borderRadius: 3 },
  financeTarget: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 14 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  actionBtn: { width: "47%", borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 10 },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
});
