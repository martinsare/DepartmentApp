import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function StudentDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sessions, announcements, contributions, payments, liveStatus, courses, users, markAnnouncementRead, issues, addIssue, addAnnouncement } = useData();
  const [expanded, setExpanded] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0]!;
  const todaySessions = sessions.filter((s) => s.date === todayStr && s.status !== "cancelled");
  const ongoingSession = todaySessions.find((s) => s.status === "ongoing");
  const nextSession = todaySessions.find((s) => s.status === "scheduled");
  const recentAnn = announcements.slice(0, 3);
  const unpaid = contributions.filter(
    (c) => !payments.some((p) => p.contribution_id === c.id && p.student_id === user?.id && (p.status === "paid" || p.status === "verified"))
  );

  const isRep = user?.is_course_rep === true;
  const repCourse = isRep && user?.course_rep_for ? courses.find((c) => c.id === user.course_rep_for) : null;
  const repLecturer = repCourse ? users.find((u) => u.id === repCourse.lecturer_id) : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.full_name?.split(" ")[0] ?? "Student";

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulsAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    if (ongoingSession) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulsAnim, { toValue: 1.5, duration: 700, useNativeDriver: true }),
          Animated.timing(pulsAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [ongoingSession]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Animated.View style={[styles.headerRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting},</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{firstName}</Text>
              {isRep && (
                <View style={styles.repBadge}>
                  <Feather name="star" size={10} color="#F59E0B" />
                  <Text style={styles.repBadgeText}>Course Rep</Text>
                </View>
              )}
            </View>
            {user?.matric_number && <Text style={styles.matric}>{user.matric_number}</Text>}
          </View>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</Text>
          </View>
        </Animated.View>

        {ongoingSession ? (
          <Animated.View style={[styles.liveCard, { opacity: fadeAnim }]}>
            <View style={styles.liveChip}>
              <Animated.View style={[styles.liveDotPulse, { transform: [{ scale: pulsAnim }] }]} />
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
            <Text style={styles.liveCode}>{ongoingSession.course_code}</Text>
            <Text style={styles.liveTitle}>{ongoingSession.course_title}</Text>
            <View style={styles.liveMeta}>
              <Feather name="map-pin" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles.liveMetaText}>{ongoingSession.venue}</Text>
              <Feather name="clock" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles.liveMetaText}>{ongoingSession.time}</Text>
            </View>
            <TouchableOpacity style={styles.scanBtn} onPress={() => router.push("/(student)/attendance")}>
              <Feather name="maximize" size={14} color="#7C3AED" />
              <Text style={styles.scanBtnText}>Scan Attendance</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.nextCard, { opacity: fadeAnim, backgroundColor: "rgba(255,255,255,0.12)" }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>
                {nextSession ? "Next class today" : "No classes today"}
              </Text>
              {nextSession ? (
                <Text style={styles.nextInfo}>{nextSession.course_code} · {nextSession.time} · {nextSession.venue}</Text>
              ) : (
                <Text style={styles.nextInfo}>Check schedule for upcoming sessions</Text>
              )}
            </View>
            <TouchableOpacity style={styles.scheduleBtn} onPress={() => router.push("/(student)/classes")}>
              <Text style={styles.scheduleBtnText}>Schedule</Text>
              <Feather name="chevron-right" size={14} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </LinearGradient>

      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        {unpaid.length > 0 && (
          <TouchableOpacity
            style={[styles.alertBanner, { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }]}
            onPress={() => router.push("/(student)/contributions")}
            activeOpacity={0.85}
          >
            <Feather name="alert-circle" size={16} color="#92400E" />
            <Text style={[styles.alertText, { color: "#92400E" }]}>
              {unpaid.length} outstanding payment{unpaid.length !== 1 ? "s" : ""} due
            </Text>
            <Feather name="chevron-right" size={16} color="#92400E" />
          </TouchableOpacity>
        )}

        {isRep && repCourse && (
          <View style={[styles.repCard, { backgroundColor: "#7C3AED10", borderColor: "#7C3AED25" }]}>
            <View style={styles.repCardHeader}>
              <Feather name="star" size={14} color="#7C3AED" />
              <Text style={[styles.repCardTitle, { color: colors.primary }]}>Rep Dashboard — {repCourse.code}</Text>
            </View>
            <View style={styles.repActions}>
              <TouchableOpacity
                style={[styles.repAction, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(student)/announcements")}
              >
                <Feather name="bell" size={14} color="#fff" />
                <Text style={styles.repActionText}>Post Notice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.repAction, { backgroundColor: "#10B981" }]}
                onPress={() => router.push("/(student)/profile")}
              >
                <Feather name="users" size={14} color="#fff" />
                <Text style={styles.repActionText}>Classmates</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.repAction, { backgroundColor: "#F59E0B" }]}
                onPress={() => router.push("/(student)/profile")}
              >
                <Feather name="alert-triangle" size={14} color="#fff" />
                <Text style={styles.repActionText}>Raise Issue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Notices</Text>
          <TouchableOpacity onPress={() => router.push("/(student)/announcements")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentAnn.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No announcements yet</Text>
          </View>
        ) : recentAnn.map((ann) => {
          const tc = ann.type === "emergency" || ann.type === "urgent" ? "#EF4444"
            : ann.type === "assignment" ? "#3B82F6"
            : ann.type === "test" ? "#F59E0B"
            : colors.primary;
          const isExp = expanded === ann.id;
          return (
            <TouchableOpacity
              key={ann.id}
              style={[styles.annCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: tc, borderLeftWidth: 3 }]}
              onPress={() => { markAnnouncementRead(ann.id); setExpanded(isExp ? null : ann.id); }}
              activeOpacity={0.85}
            >
              <View style={styles.annHeader}>
                <View style={[styles.annTypeBadge, { backgroundColor: tc + "15" }]}>
                  <Text style={[styles.annType, { color: tc }]}>{ann.type}</Text>
                </View>
                {!ann.read && <View style={[styles.unreadDot, { backgroundColor: tc }]} />}
                <Feather name={isExp ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
              </View>
              <Text style={[styles.annTitle, { color: colors.foreground }]}>{ann.title}</Text>
              <Text style={[styles.annMeta, { color: colors.mutedForeground }]}>
                {ann.author_name} · {new Date(ann.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
              </Text>
              {isExp && <Text style={[styles.annBody, { color: colors.foreground }]}>{ann.body}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { color: "rgba(255,255,255,0.65)", fontSize: 13, fontFamily: "Inter_400Regular" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  name: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  repBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(245,158,11,0.25)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  repBadgeText: { color: "#F59E0B", fontSize: 10, fontFamily: "Inter_700Bold" },
  matric: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  avatarWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  liveCard: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 18, padding: 16 },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10, position: "relative" },
  liveDotPulse: { position: "absolute", left: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.4)" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold", marginLeft: 4 },
  liveCode: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  liveTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 8 },
  liveMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  liveMetaText: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_400Regular", marginRight: 8 },
  scanBtn: { backgroundColor: "#fff", borderRadius: 12, paddingVertical: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  scanBtnText: { color: "#7C3AED", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  nextCard: { borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  nextLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 3 },
  nextInfo: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scheduleBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  scheduleBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_500Medium" },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  alertText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  repCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 20 },
  repCardHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 12 },
  repCardTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  repActions: { flexDirection: "row", gap: 8 },
  repAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: 10 },
  repActionText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyCard: { borderWidth: 1, borderRadius: 14, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  annCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, gap: 5 },
  annHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  annTypeBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  annType: { fontSize: 10, fontFamily: "Inter_700Bold" },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5 },
  annTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  annMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  annBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginTop: 6 },
});
