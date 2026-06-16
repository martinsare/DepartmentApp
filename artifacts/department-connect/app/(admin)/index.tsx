import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

const QUICK_ACTIONS = [
  { label: "Invite User", icon: "user-plus" as const, color: "#7C3AED", route: "/(admin)/accounts" },
  { label: "Add Course", icon: "book-open" as const, color: "#10B981", route: "/(admin)/courses" },
  { label: "Set Dues", icon: "credit-card" as const, color: "#F59E0B", route: "/(admin)/contributions" },
  { label: "Announce", icon: "bell" as const, color: "#EF4444", route: "/(admin)/announcements" },
];

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { users, courses, sessions, contributions, payments, announcements, markAnnouncementRead } = useData();

  const students = users.filter((u) => u.role === "student" && u.status === "active");
  const lecturers = users.filter((u) => u.role === "lecturer" && u.status === "active");
  const pendingUsers = users.filter((u) => u.status === "pending");
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((acc, p) => acc + p.amount, 0);
  const totalTarget = contributions.reduce((acc, c) => acc + c.target_amount, 0);
  const collectionPct = totalTarget > 0 ? Math.min((totalPaid / totalTarget) * 100, 100) : 0;
  const recentAnn = announcements.slice(0, 3);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.timing(progressAnim, {
      toValue: collectionPct, duration: 1200, delay: 500,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);

  const STATS = [
    { label: "Students", value: students.length, icon: "users" as const, color: "#7C3AED" },
    { label: "Lecturers", value: lecturers.length, icon: "briefcase" as const, color: "#10B981" },
    { label: "Courses", value: courses.length, icon: "book-open" as const, color: "#3B82F6" },
    { label: "Sessions", value: sessions.length, icon: "calendar" as const, color: "#F59E0B" },
  ];

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={["#5B21B6", "#7C3AED"]}
        style={[styles.headerGrad, { paddingTop: topPad + 12 }]}
      >
        <Animated.View style={[styles.headerRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.headerLabel}>Admin Dashboard</Text>
            <Text style={styles.headerName}>{user?.full_name}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            {pendingUsers.length > 0 && (
              <TouchableOpacity
                style={styles.pendingPill}
                onPress={() => router.push("/(admin)/accounts")}
              >
                <View style={styles.pendingDot} />
                <Text style={styles.pendingPillText}>{pendingUsers.length} pending</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={async () => { await logout(); router.replace("/login"); }}
              style={styles.logoutBtn}
            >
              <Feather name="log-out" size={17} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statPill}>
              <Text style={styles.statPillValue}>{s.value}</Text>
              <Text style={styles.statPillLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>
      </LinearGradient>

      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Animated.View style={[styles.financeCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim }]}>
          <View style={styles.financeCardHeader}>
            <View>
              <Text style={[styles.financeCardLabel, { color: colors.mutedForeground }]}>Total Collected</Text>
              <Text style={[styles.financeCardValue, { color: colors.foreground }]}>
                ₦{totalPaid.toLocaleString()}
              </Text>
              <Text style={[styles.financeCardSub, { color: colors.mutedForeground }]}>
                of ₦{totalTarget.toLocaleString()} target
              </Text>
            </View>
            <View style={[styles.pctCircle, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
              <Text style={[styles.pctText, { color: colors.primary }]}>{Math.round(collectionPct)}%</Text>
            </View>
          </View>
          <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
            <Animated.View
              style={[styles.barFill, {
                backgroundColor: colors.primary,
                width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
              }]}
            />
          </View>
          <Text style={[styles.financeCaption, { color: colors.mutedForeground }]}>
            {students.length} active students · {contributions.length} contribution{contributions.length !== 1 ? "s" : ""}
          </Text>
        </Animated.View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionCard, { backgroundColor: a.color + "10", borderColor: a.color + "25" }]}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color }]}>
                <Feather name={a.icon} size={19} color="#fff" />
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {recentAnn.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Notices</Text>
              <TouchableOpacity onPress={() => router.push("/(admin)/announcements")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentAnn.map((ann) => (
              <TouchableOpacity
                key={ann.id}
                style={[styles.annCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => markAnnouncementRead(ann.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.annDot, {
                  backgroundColor: ann.type === "emergency" ? "#EF4444"
                    : ann.type === "test" ? "#F59E0B"
                    : ann.type === "assignment" ? "#3B82F6"
                    : colors.primary,
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.annTitle, { color: colors.foreground }]} numberOfLines={1}>{ann.title}</Text>
                  <Text style={[styles.annMeta, { color: colors.mutedForeground }]}>
                    {ann.author_name} · {new Date(ann.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {!ann.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerGrad: { paddingHorizontal: 20, paddingBottom: 28 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  headerLabel: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "Inter_400Regular" },
  headerName: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  pendingPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FCD34D" },
  pendingPillText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 0 },
  statPill: { flex: 1, alignItems: "center", gap: 2 },
  statPillValue: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  statPillLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  financeCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 24 },
  financeCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  financeCardLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  financeCardValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  financeCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  pctCircle: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  pctText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 10 },
  barFill: { height: "100%", borderRadius: 3 },
  financeCaption: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 14 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  actionCard: { width: "47%", borderWidth: 1, borderRadius: 16, padding: 14, gap: 10, alignItems: "flex-start" },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  annCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
  annDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  annTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  annMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
});
