import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

const QUICK_ACTIONS = [
  { label: "Add Student", icon: "user-plus", color: "#7C3AED", route: "/(admin)/accounts" },
  { label: "Add Lecturer", icon: "briefcase", color: "#10B981", route: "/(admin)/accounts" },
  { label: "Contribution", icon: "dollar-sign", color: "#F59E0B", route: "/(admin)/contributions" },
  { label: "Announcement", icon: "bell", color: "#EF4444", route: "/(admin)/announcements" },
];

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { users, courses, sessions, contributions, payments, announcements, markAnnouncementRead } = useData();

  const students = users.filter((u) => u.role === "student");
  const lecturers = users.filter((u) => u.role === "lecturer");
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((acc, p) => acc + p.amount, 0);
  const totalTarget = contributions.reduce((acc, c) => acc + c.target_amount, 0);
  const collectionPct = totalTarget > 0 ? Math.min((totalPaid / totalTarget) * 100, 100) : 0;
  const recentAnnouncements = announcements.slice(0, 3);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.timing(progressAnim, {
      toValue: collectionPct,
      duration: 1200,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  const STATS = [
    { label: "Students", value: students.length, icon: "users", color: "#7C3AED" },
    { label: "Lecturers", value: lecturers.length, icon: "briefcase", color: "#10B981" },
    { label: "Courses", value: courses.length, icon: "book-open", color: "#3B82F6" },
    { label: "Sessions", value: sessions.length, icon: "calendar", color: "#F59E0B" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          <Text style={[styles.role, { color: colors.mutedForeground }]}>Admin Dashboard</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{user?.full_name}</Text>
        </View>
        <TouchableOpacity
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
            router.replace("/login");
          }}
          style={[styles.logoutBtn, { backgroundColor: colors.muted }]}
        >
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </Animated.View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {STATS.map((s) => (
          <Animated.View
            key={s.label}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <View style={[styles.statIcon, { backgroundColor: s.color + "18" }]}>
              <Feather name={s.icon as any} size={18} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Finance card — campus image as background */}
      <Animated.View style={[styles.financeCard, { opacity: fadeAnim }]}>
        {/* Background image */}
        <Image
          source={require("@/assets/images/campus-hero.jpg")}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
        {/* Dark purple overlay */}
        <View style={styles.financeOverlay} />

        {/* Admin badge top-right */}
        <View style={styles.heroBadge}>
          <Feather name="shield" size={11} color="#fff" />
          <Text style={styles.heroBadgeText}>Admin Panel</Text>
        </View>

        {/* Content */}
        <View style={styles.financeHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.financeLabel}>Total Contributions Collected</Text>
            <Text style={styles.financeValue}>₦{totalPaid.toLocaleString()}</Text>
            <Text style={styles.financeTarget}>of ₦{totalTarget.toLocaleString()} target</Text>
          </View>
          <View style={styles.financePctBadge}>
            <Text style={styles.financePctText}>{Math.round(collectionPct)}%</Text>
          </View>
        </View>
        <View style={styles.financeBarBg}>
          <Animated.View
            style={[styles.financeBarFill, {
              width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
            }]}
          />
        </View>
        <Text style={styles.financeCaption}>
          {students.length} students · {contributions.length} active contributions
        </Text>
      </Animated.View>

      {/* Quick actions */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.actionBtn, { backgroundColor: action.color + "12", borderColor: action.color + "28" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(action.route as any);
            }}
            activeOpacity={0.85}
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  role: { fontSize: 12, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, minWidth: "45%", borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "flex-start", gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },

  // Finance card with image background
  financeCard: {
    borderRadius: 22,
    overflow: "hidden",
    padding: 20,
    marginBottom: 24,
    minHeight: 170,
    justifyContent: "flex-end",
  },
  financeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(50, 10, 100, 0.78)",
  },
  heroBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  financeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  financeLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4, letterSpacing: 0.3 },
  financeValue: { color: "#fff", fontSize: 30, fontFamily: "Inter_700Bold" },
  financeTarget: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  financePctBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  financePctText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  financeBarBg: { height: 5, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  financeBarFill: { height: "100%", backgroundColor: "#fff", borderRadius: 3 },
  financeCaption: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "Inter_400Regular" },

  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 14 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  actionBtn: { width: "47%", borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 10 },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
});
