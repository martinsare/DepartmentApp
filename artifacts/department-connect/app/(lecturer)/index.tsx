import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClassCard } from "@/components/ClassCard";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function LecturerDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { sessions, attendance, courses } = useData();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const myCourses = courses.filter((c) => c.lecturer_id === user?.id);
  const mySessions = sessions.filter((s) => s.lecturer_id === user?.id);
  const todayStr = new Date().toISOString().split("T")[0]!;
  const todaySessions = mySessions.filter((s) => s.date === todayStr);
  const upcomingSessions = mySessions
    .filter((s) => s.date > todayStr && s.status !== "cancelled")
    .slice(0, 3);
  const totalStudents = myCourses.reduce((acc, c) => acc + (c.enrolled_count ?? 0), 0);
  const myAttendance = attendance.filter((a) =>
    mySessions.some((s) => s.id === a.session_id)
  );
  const firstName = user?.full_name?.split(" ").slice(-1)[0] ?? "Lecturer";

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }),
    ]).start();
  }, []);

  const STATS = [
    { label: "Courses", value: myCourses.length, icon: "book-open", color: "#7C3AED" },
    { label: "Students", value: totalStudents, icon: "users", color: "#10B981" },
    { label: "Attendance", value: myAttendance.length, icon: "check-circle", color: "#3B82F6" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          <Text style={[styles.role, { color: colors.mutedForeground }]}>Lecturer</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{user?.full_name}</Text>
        </View>
        <TouchableOpacity
          onPress={async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await logout(); router.replace("/login"); }}
          style={[styles.logoutBtn, { backgroundColor: colors.muted }]}
        >
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </Animated.View>

      {/* Lecturer teaching image */}
      <Animated.View style={[{ opacity: fadeAnim }, styles.heroWrap]}>
        <Image
          source={require("@/assets/images/lecturer-teaching.png")}
          style={styles.heroImg}
          contentFit="cover"
        />
        <View style={[styles.heroOverlay, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroOverlayText}>
            Welcome, {firstName} 👋
          </Text>
          <Text style={styles.heroOverlaySub}>
            {myCourses.length} course{myCourses.length !== 1 ? "s" : ""} · {totalStudents} students
          </Text>
        </View>
      </Animated.View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {STATS.map((s) => (
          <Animated.View
            key={s.label}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim }]}
          >
            <View style={[styles.statIcon, { backgroundColor: s.color + "18" }]}>
              <Feather name={s.icon as any} size={16} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Today */}
      {todaySessions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Classes</Text>
          {todaySessions.map((s) => <ClassCard key={s.id} session={s} />)}
        </View>
      )}

      {/* Upcoming */}
      {upcomingSessions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming</Text>
          {upcomingSessions.map((s) => <ClassCard key={s.id} session={s} />)}
        </View>
      )}

      {/* My Courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Courses</Text>
        </View>
        {myCourses.map((course) => (
          <View
            key={course.id}
            style={[styles.courseRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.courseIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="book" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.courseCode, { color: colors.primary }]}>{course.code}</Text>
              <Text style={[styles.courseTitle, { color: colors.foreground }]} numberOfLines={1}>
                {course.title}
              </Text>
              <Text style={[styles.courseStudents, { color: colors.mutedForeground }]}>
                {course.enrolled_count} students enrolled
              </Text>
            </View>
            <View style={[styles.courseBadge, { backgroundColor: colors.secondary }]}>
              <Feather name="chevron-right" size={16} color={colors.primary} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  role: { fontSize: 12, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  heroWrap: { marginBottom: 20, borderRadius: 18, overflow: "hidden", position: "relative" },
  heroImg: { width: "100%", height: 140 },
  heroOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingVertical: 12,
    opacity: 0.9,
  },
  heroOverlayText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  heroOverlaySub: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, alignItems: "flex-start", gap: 5 },
  statIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 14 },
  courseRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  courseIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  courseCode: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  courseTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  courseStudents: { fontSize: 12, fontFamily: "Inter_400Regular" },
  courseBadge: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
