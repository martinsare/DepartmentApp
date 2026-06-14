import { Feather } from "@expo/vector-icons";
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
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { ClassCard } from "@/components/ClassCard";
import { LiveStatusBadge } from "@/components/LiveStatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function StudentDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sessions, announcements, contributions, payments, liveStatus, markAnnouncementRead } = useData();

  const todayStr = new Date().toISOString().split("T")[0]!;
  const todaySessions = sessions.filter(
    (s) => s.date === todayStr && s.status !== "cancelled" && s.status !== "ended"
  );
  const ongoingSession = todaySessions.find((s) => s.status === "ongoing");
  const nextSession = todaySessions.find((s) => s.status === "scheduled");
  const recentAnnouncements = announcements.slice(0, 3);
  const unpaidContributions = contributions.filter(
    (c) => !payments.some((p) => p.contribution_id === c.id && p.student_id === user?.id && p.status === "paid")
  );

  const firstName = user?.full_name?.split(" ")[0] ?? "Student";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const topPad = insets.top;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    if (ongoingSession) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.7, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [ongoingSession]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting},</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{firstName}</Text>
          {user?.matric_number && (
            <Text style={[styles.matric, { color: colors.mutedForeground }]}>{user.matric_number}</Text>
          )}
        </View>
        <View style={[styles.avatarWrap, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </Text>
        </View>
      </Animated.View>

      {/* Ongoing class card with animated live dot */}
      {ongoingSession && (
        <Animated.View
          style={[styles.ongoingCard, { backgroundColor: colors.primary, opacity: fadeAnim }]}
        >
          <View style={styles.ongoingHeader}>
            <View style={styles.liveChip}>
              <Animated.View style={[styles.liveDotOuter, { transform: [{ scale: pulseAnim }] }]} />
              <View style={styles.liveDotInner} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            {liveStatus[ongoingSession.id] && (
              <LiveStatusBadge status={liveStatus[ongoingSession.id]!.status} />
            )}
          </View>
          <Text style={styles.ongoingCode}>{ongoingSession.course_code}</Text>
          <Text style={styles.ongoingTitle}>{ongoingSession.course_title}</Text>
          <View style={styles.ongoingDetails}>
            <View style={styles.ongoingDetail}>
              <Feather name="map-pin" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.ongoingDetailText}>{ongoingSession.venue}</Text>
            </View>
            <View style={styles.ongoingDetail}>
              <Feather name="clock" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.ongoingDetailText}>{ongoingSession.time}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.scanAttendanceBtn}
            onPress={() => router.push("/(student)/attendance")}
            activeOpacity={0.85}
          >
            <Feather name="maximize" size={14} color={colors.primary} />
            <Text style={[styles.scanAttendanceBtnText, { color: colors.primary }]}>
              Scan Attendance
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Students studying image (when no live class) */}
      {!ongoingSession && (
        <Animated.View style={[{ opacity: fadeAnim }, styles.heroWrap]}>
          <Image
            source={require("@/assets/images/students-studying.jpg")}
            style={styles.heroImg}
            contentFit="cover"
          />
          {nextSession && (
            <View style={[styles.nextClassBadge, { backgroundColor: colors.primary }]}>
              <Feather name="clock" size={11} color="#fff" />
              <Text style={styles.nextClassText}>
                Next: {nextSession.course_code} · {nextSession.time}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Unpaid contributions alert */}
      {unpaidContributions.length > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}
          onPress={() => router.push("/(student)/contributions")}
          activeOpacity={0.85}
        >
          <Feather name="alert-circle" size={16} color="#92400E" />
          <Text style={styles.alertText}>
            {unpaidContributions.length} outstanding payment{unpaidContributions.length > 1 ? "s" : ""} — tap to pay
          </Text>
          <Feather name="chevron-right" size={16} color="#92400E" />
        </TouchableOpacity>
      )}

      {/* Today's classes */}
      {todaySessions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Classes</Text>
          {todaySessions.map((s) => <ClassCard key={s.id} session={s} />)}
        </View>
      )}

      {/* Recent announcements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Announcements</Text>
          <TouchableOpacity onPress={() => router.push("/(student)/announcements")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        {recentAnnouncements.map((ann) => (
          <AnnouncementCard key={ann.id} announcement={ann} onPress={() => markAnnouncementRead(ann.id)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  name: { fontSize: 24, fontFamily: "Inter_700Bold" },
  matric: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  avatarWrap: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  ongoingCard: {
    borderRadius: 20, padding: 20, marginBottom: 20,
    shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  ongoingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  liveChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    position: "relative",
  },
  liveDotOuter: {
    position: "absolute", left: 10, width: 8, height: 8,
    borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)",
  },
  liveDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold", marginLeft: 4 },
  ongoingCode: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  ongoingTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 12 },
  ongoingDetails: { flexDirection: "row", gap: 16, marginBottom: 14 },
  ongoingDetail: { flexDirection: "row", alignItems: "center", gap: 5 },
  ongoingDetailText: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "Inter_400Regular" },
  scanAttendanceBtn: {
    backgroundColor: "#fff", borderRadius: 10, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
  },
  scanAttendanceBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  heroWrap: { marginBottom: 20, borderRadius: 18, overflow: "hidden" },
  heroImg: { width: "100%", height: 140 },
  nextClassBadge: {
    position: "absolute", bottom: 12, left: 12,
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  nextClassText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  alertBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 20,
  },
  alertText: { color: "#92400E", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 14 },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 14 },
});
