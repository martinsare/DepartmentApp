import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { User } from "@/lib/types";

export default function LecturerDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { sessions, courses, attendance, users, assignCourseRep, removeCourseRep, enrollments } = useData();
  const [repModal, setRepModal] = useState<{ courseId: string; courseName: string } | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const myCourses = courses.filter((c) => c.lecturer_id === user?.id);
  const mySessions = sessions.filter((s) => s.lecturer_id === user?.id);
  const todayStr = new Date().toISOString().split("T")[0]!;
  const todaySessions = mySessions.filter((s) => s.date === todayStr && s.status !== "cancelled");
  const upcomingSessions = mySessions.filter((s) => s.date > todayStr && s.status !== "cancelled").slice(0, 3);
  const totalStudents = myCourses.reduce((acc, c) => acc + (c.enrolled_count ?? 0), 0);
  const myAttendance = attendance.filter((a) => mySessions.some((s) => s.id === a.session_id));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const getEnrolledStudents = (courseId: string): User[] => {
    const enrolled = enrollments.filter((e) => e.course_id === courseId).map((e) => e.student_id);
    if (enrolled.length > 0) {
      return users.filter((u) => u.role === "student" && u.status === "active" && enrolled.includes(u.id));
    }
    return users.filter((u) => u.role === "student" && u.status === "active");
  };

  const getCourseRep = (courseId: string): User | undefined =>
    users.find((u) => u.is_course_rep && u.course_rep_for === courseId);

  const handleAssignRep = async (studentId: string) => {
    if (!repModal) return;
    setAssigningId(studentId);
    const { error } = await assignCourseRep(studentId, repModal.courseId);
    setAssigningId(null);
    if (error) Alert.alert("Error", error);
    else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRepModal(null);
    }
  };

  const handleRemoveRep = (rep: User) => {
    Alert.alert("Remove Course Rep", `Remove ${rep.full_name} as course rep?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { await removeCourseRep(rep.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
    ]);
  };

  const modalStudents = repModal ? getEnrolledStudents(repModal.courseId) : [];
  const currentRep = repModal ? getCourseRep(repModal.courseId) : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerGreeting}>{greeting},</Text>
            <Text style={styles.headerName} numberOfLines={1}>{user?.full_name}</Text>
            <Text style={styles.headerRole}>Lecturer</Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert("Sign Out", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
            ])}
            style={styles.logoutBtn}
          >
            <Feather name="log-out" size={17} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Courses", value: myCourses.length },
            { label: "Students", value: totalStudents },
            { label: "Sessions", value: mySessions.length },
            { label: "Check-ins", value: myAttendance.length },
          ].map((s) => (
            <View key={s.label} style={styles.statPill}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {todaySessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Classes</Text>
            {todaySessions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sessionCard, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                onPress={() => router.push("/(lecturer)/classes")}
                activeOpacity={0.9}
              >
                <View style={styles.sessionTop}>
                  <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>{s.status === "ongoing" ? "LIVE" : s.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.sessionCode}>{s.course_code}</Text>
                <Text style={styles.sessionTitle}>{s.course_title}</Text>
                <View style={styles.sessionMeta}>
                  <View style={styles.sessionMetaItem}>
                    <Feather name="map-pin" size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.sessionMetaText}>{s.venue}</Text>
                  </View>
                  <View style={styles.sessionMetaItem}>
                    <Feather name="clock" size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.sessionMetaText}>{s.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {upcomingSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming</Text>
            {upcomingSessions.map((s) => (
              <View key={s.id} style={[styles.upcomingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.upcomingAccent, { backgroundColor: colors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.upcomingCode, { color: colors.primary }]}>{s.course_code}</Text>
                  <Text style={[styles.upcomingTitle, { color: colors.foreground }]}>{s.course_title}</Text>
                  <Text style={[styles.upcomingMeta, { color: colors.mutedForeground }]}>{s.date} · {s.time} · {s.venue}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Courses</Text>
          {myCourses.length === 0 ? (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="book" size={32} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No courses assigned yet</Text>
            </View>
          ) : myCourses.map((course) => {
            const rep = getCourseRep(course.id);
            return (
              <View key={course.id} style={[styles.courseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.courseCardTop}>
                  <View style={[styles.codeBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.codeText, { color: colors.primary }]}>{course.code}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.courseTitle, { color: colors.foreground }]} numberOfLines={1}>{course.title}</Text>
                    <Text style={[styles.courseMeta, { color: colors.mutedForeground }]}>{course.enrolled_count} students enrolled</Text>
                  </View>
                </View>
                <View style={[styles.repRow, { borderTopColor: colors.border }]}>
                  {rep ? (
                    <View style={styles.repInfo}>
                      <View style={[styles.repAvatar, { backgroundColor: "#10B981" }]}>
                        <Text style={styles.repAvatarText}>{rep.full_name[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.repName, { color: colors.foreground }]}>{rep.full_name}</Text>
                        <Text style={[styles.repLabel, { color: "#10B981" }]}>Course Rep</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.repActionBtn, { borderColor: "#EF4444" }]}
                        onPress={() => handleRemoveRep(rep)}
                      >
                        <Feather name="user-minus" size={13} color="#EF4444" />
                        <Text style={[styles.repActionText, { color: "#EF4444" }]}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.assignRepBtn, { borderColor: colors.primary }]}
                      onPress={() => setRepModal({ courseId: course.id, courseName: course.title })}
                    >
                      <Feather name="user-plus" size={14} color={colors.primary} />
                      <Text style={[styles.assignRepText, { color: colors.primary }]}>Assign Course Rep</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={!!repModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Assign Course Rep</Text>
            <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>{repModal?.courseName}</Text>
            {currentRep && (
              <View style={[styles.currentRepBanner, { backgroundColor: "#10B98115", borderColor: "#10B98130" }]}>
                <Feather name="star" size={14} color="#10B981" />
                <Text style={[styles.currentRepText, { color: "#10B981" }]}>Current rep: {currentRep.full_name}</Text>
              </View>
            )}
            <ScrollView style={{ maxHeight: 300 }}>
              {modalStudents.map((s) => {
                const isRep = s.is_course_rep && s.course_rep_for === repModal?.courseId;
                const loading = assigningId === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.studentRow, { backgroundColor: isRep ? "#10B98112" : colors.muted, borderColor: isRep ? "#10B98130" : colors.border }]}
                    onPress={() => handleAssignRep(s.id)}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.studentAvatar, { backgroundColor: isRep ? "#10B981" : colors.primary }]}>
                      <Text style={styles.studentAvatarText}>{s.full_name[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.studentName, { color: colors.foreground }]}>{s.full_name}</Text>
                      {s.matric_number && <Text style={[styles.studentMeta, { color: colors.mutedForeground }]}>{s.matric_number}</Text>}
                    </View>
                    {loading ? <ActivityIndicator size="small" color={colors.primary} /> :
                     isRep ? <Feather name="check-circle" size={18} color="#10B981" /> :
                     <Feather name="circle" size={18} color={colors.border} />}
                  </TouchableOpacity>
                );
              })}
              {modalStudents.length === 0 && (
                <Text style={[styles.noStudents, { color: colors.mutedForeground }]}>No active students found</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border, marginTop: 16 }]} onPress={() => setRepModal(null)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  headerGreeting: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "Inter_400Regular" },
  headerName: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  headerRole: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row" },
  statPill: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 10, fontFamily: "Inter_400Regular" },
  scroll: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  sessionCard: { borderRadius: 18, padding: 18, marginBottom: 10, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  sessionTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  sessionCode: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  sessionTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 10 },
  sessionMeta: { flexDirection: "row", gap: 16 },
  sessionMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  sessionMetaText: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontFamily: "Inter_400Regular" },
  upcomingCard: { flexDirection: "row", borderWidth: 1, borderRadius: 14, overflow: "hidden", marginBottom: 8 },
  upcomingAccent: { width: 4 },
  upcomingCode: { fontSize: 11, fontFamily: "Inter_700Bold", paddingTop: 12, paddingHorizontal: 12 },
  upcomingTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", paddingHorizontal: 12 },
  upcomingMeta: { fontSize: 12, fontFamily: "Inter_400Regular", paddingHorizontal: 12, paddingBottom: 12, marginTop: 2 },
  courseCard: { borderWidth: 1, borderRadius: 16, marginBottom: 12, overflow: "hidden" },
  courseCardTop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  codeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  codeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  courseTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  courseMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  repRow: { borderTopWidth: 1, padding: 12 },
  repInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  repAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  repAvatarText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  repName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  repLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  repActionBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  repActionText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  assignRepBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1.5, borderRadius: 10, paddingVertical: 9 },
  assignRepText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { borderWidth: 1, borderRadius: 16, padding: 30, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sheetSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 16 },
  currentRepBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 12 },
  currentRepText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 6 },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  studentAvatarText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  studentName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  studentMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  noStudents: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
