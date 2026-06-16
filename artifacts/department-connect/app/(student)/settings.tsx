import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

export default function StudentSettings() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { preference, setPreference } = useTheme();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerSub}>Preferences</Text>
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.themeRow}>
            {(["light", "dark", "system"] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.themeBtn, preference === opt
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setPreference(opt)}
              >
                <Feather
                  name={opt === "light" ? "sun" : opt === "dark" ? "moon" : "monitor"}
                  size={15}
                  color={preference === opt ? "#fff" : colors.mutedForeground}
                />
                <Text style={[styles.themeBtnText, { color: preference === opt ? "#fff" : colors.mutedForeground }]}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PROFILE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: "user" as const, label: "Full Name", value: user?.full_name },
            { icon: "mail" as const, label: "Email", value: user?.email },
            { icon: "hash" as const, label: "Matric Number", value: user?.matric_number ?? "—" },
            { icon: "layers" as const, label: "Level", value: user?.level ?? "—" },
          ].map((row, idx, arr) => (
            <View key={row.label} style={[styles.infoRow, idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.muted }]}>
                <Feather name={row.icon} size={14} color={colors.mutedForeground} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {user?.profile_flagged && (
          <View style={[styles.flagCard, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}>
            <Feather name="alert-triangle" size={16} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.flagTitle, { color: "#92400E" }]}>Profile Flagged</Text>
              {user.flag_reason && <Text style={[styles.flagSub, { color: "#92400E" }]}>{user.flag_reason}</Text>}
            </View>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HELP & SAFETY</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push("/(student)/report")}
            activeOpacity={0.85}
          >
            <View style={[styles.linkIcon, { backgroundColor: "#FEF3C7" }]}>
              <Feather name="alert-triangle" size={17} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkLabel, { color: colors.foreground }]}>Report a Serious Issue</Text>
              <Text style={[styles.linkSub, { color: colors.mutedForeground }]}>
                Confidential report to administrator
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]}
          onPress={handleLogout} activeOpacity={0.85}
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
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  scroll: { padding: 16, gap: 12 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, paddingHorizontal: 4 },
  card: { borderWidth: 1, borderRadius: 16, overflow: "hidden", padding: 14 },
  themeRow: { flexDirection: "row", gap: 8 },
  themeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  themeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  infoIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 1 },
  flagCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 },
  flagTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  flagSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  linkLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  linkSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1, borderRadius: 16, paddingVertical: 15 },
  logoutText: { color: "#EF4444", fontSize: 15, fontFamily: "Inter_700Bold" },
});
