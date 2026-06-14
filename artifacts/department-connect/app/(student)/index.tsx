import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { ClassCard } from "@/components/ClassCard";
import { ContributionCard } from "@/components/ContributionCard";
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

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
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
      </View>

      {/* Ongoing class */}
      {ongoingSession && (
        <View style={[styles.ongoingCard, { backgroundColor: colors.primary }]}>
          <View style={styles.ongoingHeader}>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
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
        </View>
      )}

      {/* Next class */}
      {nextSession && !ongoingSession && (
        <View style={[styles.section]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Next Class</Text>
          <ClassCard session={nextSession} />
        </View>
      )}

      {/* Unpaid contributions */}
      {unpaidContributions.length > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
          <Feather name="alert-circle" size={16} color="#92400E" />
          <Text style={styles.alertText}>
            {unpaidContributions.length} outstanding payment{unpaidContributions.length > 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Today's classes */}
      {todaySessions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Classes</Text>
          {todaySessions.map((s) => (
            <ClassCard key={s.id} session={s} />
          ))}
        </View>
      )}

      {/* Announcements */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Announcements</Text>
        {recentAnnouncements.map((ann) => (
          <AnnouncementCard
            key={ann.id}
            announcement={ann}
            onPress={() => markAnnouncementRead(ann.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  name: { fontSize: 24, fontFamily: "Inter_700Bold" },
  matric: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  avatarWrap: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  ongoingCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ongoingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  ongoingCode: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  ongoingTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 12 },
  ongoingDetails: { flexDirection: "row", gap: 16 },
  ongoingDetail: { flexDirection: "row", alignItems: "center", gap: 5 },
  ongoingDetailText: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "Inter_400Regular" },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  alertText: { color: "#92400E", fontSize: 13, fontFamily: "Inter_500Medium" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 14 },
});
