import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

export default function AdminSettings() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { preference, setPreference } = useTheme();
  const { directReports } = useData();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const pendingReports = directReports.filter((r) => r.status === "pending").length;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  };

  const THEME_OPTIONS = [
    { key: "light" as const, label: "Light", icon: "sun" as const },
    { key: "dark" as const, label: "Dark", icon: "moon" as const },
    { key: "system" as const, label: "System", icon: "monitor" as const },
  ];

  const SYSTEM_LINKS = [
    { icon: "calendar" as const, label: "Semester Management", sub: "Create & close academic semesters", route: "/(admin)/semesters" as const, badge: null },
    { icon: "file-text" as const, label: "Audit Log", sub: "Full system activity trail", route: "/(admin)/audit-log" as const, badge: null },
    { icon: "alert-triangle" as const, label: "Direct Reports", sub: "Confidential student reports", route: "/(admin)/direct-reports" as const, badge: pendingReports > 0 ? pendingReports : null },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerSub}>Admin Settings</Text>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{user?.full_name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.full_name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="shield" size={11} color="#fff" />
            <Text style={styles.roleBadgeText}>Admin</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.foreground }]}>Theme</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.themeBtn, preference === opt.key
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => { setPreference(opt.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Feather name={opt.icon} size={15} color={preference === opt.key ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.themeBtnText, { color: preference === opt.key ? "#fff" : colors.mutedForeground }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SYSTEM</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SYSTEM_LINKS.map((link, idx) => (
            <TouchableOpacity
              key={link.label}
              style={[styles.linkRow, idx < SYSTEM_LINKS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={() => router.push(link.route as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.linkIcon, { backgroundColor: `${colors.primary}18` }]}>
                <Feather name={link.icon} size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkLabel, { color: colors.foreground }]}>{link.label}</Text>
                <Text style={[styles.linkSub, { color: colors.mutedForeground }]}>{link.sub}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {link.badge != null && (
                  <View style={[styles.notifBadge, { backgroundColor: "#EF4444" }]}>
                    <Text style={styles.notifBadgeText}>{link.badge}</Text>
                  </View>
                )}
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: "user" as const, label: "Full Name", value: user?.full_name },
            { icon: "mail" as const, label: "Email", value: user?.email },
            { icon: "phone" as const, label: "Phone", value: user?.phone ?? "—" },
          ].map((row) => (
            <View key={row.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.muted }]}>
                <Feather name={row.icon} size={15} color={colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Feather name="log-out" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2, marginBottom: 16 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 14 },
  profileAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  profileAvatarText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  profileName: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  profileEmail: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  roleBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, marginBottom: 8, marginTop: 8, paddingHorizontal: 4 },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 20, overflow: "hidden" },
  cardLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", padding: 14, paddingBottom: 10 },
  themeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  themeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  themeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  linkIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  linkLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  linkSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  notifBadge: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  notifBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1, borderRadius: 16, paddingVertical: 15, marginTop: 8 },
  logoutText: { color: "#EF4444", fontSize: 15, fontFamily: "Inter_700Bold" },
});
