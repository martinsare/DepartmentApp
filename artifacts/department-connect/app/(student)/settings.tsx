import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { ThemePreference, useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const THEME_OPTIONS: { label: string; value: ThemePreference; icon: string }[] = [
  { label: "Light", value: "light", icon: "sun" },
  { label: "Dark", value: "dark", icon: "moon" },
  { label: "System", value: "system", icon: "smartphone" },
];

export default function StudentSettings() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { preference, setPreference } = useTheme();

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/login");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

      {/* Profile summary */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{user?.full_name}</Text>
          <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>Student</Text>
        </View>
      </View>

      {/* Appearance */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APPEARANCE</Text>
      <View style={[styles.themeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.themeHeader}>
          <Feather name="droplet" size={16} color={colors.primary} />
          <Text style={[styles.themeTitle, { color: colors.foreground }]}>Theme</Text>
        </View>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((opt) => {
            const active = preference === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: active ? colors.primary : colors.muted,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPreference(opt.value);
                }}
                activeOpacity={0.8}
              >
                <Feather name={opt.icon as any} size={16} color={active ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.themeBtnText, { color: active ? "#fff" : colors.foreground }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Account */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
      <TouchableOpacity style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.75}>
        <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="lock" size={17} color={colors.primary} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>Change Password</Text>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.75}>
        <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="bell" size={17} color={colors.primary} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>Notification Preferences</Text>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Session */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SESSION</Text>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handleLogout}
        activeOpacity={0.75}
      >
        <View style={[styles.rowIcon, { backgroundColor: "#FEE2E2" }]}>
          <Feather name="log-out" size={17} color="#EF4444" />
        </View>
        <Text style={[styles.rowLabel, { color: "#EF4444" }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 20 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  profileName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  profileEmail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  themeCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 8, gap: 12 },
  themeHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  themeTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  themeRow: { flexDirection: "row", gap: 8 },
  themeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
  },
  themeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
});
