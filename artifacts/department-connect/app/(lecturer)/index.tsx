import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClassCard } from "@/components/ClassCard";
import { StatsCard } from "@/components/StatsCard";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function LecturerDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { sessions, attendance, courses, announcements } = useData();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const myCourses = courses.filter((c) => c.lecturer_id === user?.id);
  const mySessions = sessions.filter((s) => s.lecturer_id === user?.id);
  const todayStr = new Date().toISOString().split("T")[0]!;
  const todaySessions = mySessions.filter((s) => s.date === todayStr);
  const upcomingSessions = mySessions.filter((s) => s.date > todayStr && s.status !== "cancelled").slice(0, 3);
  const totalStudents = myCourses.reduce((acc, c) => acc + (c.enrolled_count ?? 0), 0);
  const myAttendance = attendance.filter((a) => mySessions.some((s) => s.id === a.session_id));

  const firstName = user?.full_name?.split(" ").slice(-1)[0] ?? "Lecturer";

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
          <Text style={[styles.role, { color: colors.mutedForeground }]}>Lecturer</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{user?.full_name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.muted }]}>
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatsCard label="Courses" value={myCourses.length} icon="book-open" />
        <StatsCard label="Students" value={totalStudents} icon="users" />
        <StatsCard label="Attendance" value={myAttendance.length} icon="check-circle" color="#10B981" />
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
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Courses</Text>
        {myCourses.map((course) => (
          <View key={course.id} style={[styles.courseRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.courseIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="book" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.courseCode, { color: colors.primary }]}>{course.code}</Text>
              <Text style={[styles.courseTitle, { color: colors.foreground }]} numberOfLines={1}>{course.title}</Text>
              <Text style={[styles.courseStudents, { color: colors.mutedForeground }]}>{course.enrolled_count} students</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  role: { fontSize: 12, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 14 },
  courseRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  courseIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  courseCode: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  courseTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  courseStudents: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
