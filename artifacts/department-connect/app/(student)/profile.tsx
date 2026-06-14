import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface RowProps { icon: string; label: string; value?: string; onPress?: () => void; danger?: boolean }

function ProfileRow({ icon, label, value, onPress, danger }: RowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? "#FEE2E2" : colors.secondary }]}>
        <Feather name={icon as any} size={17} color={danger ? "#EF4444" : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: danger ? "#EF4444" : colors.foreground }]}>{label}</Text>
        {value && <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>}
      </View>
      {onPress && <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
    </TouchableOpacity>
  );
}

export default function StudentProfile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

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
      <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{user?.full_name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>Student</Text>
        </View>
      </View>

      {/* Info */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
      <ProfileRow icon="mail" label="Email" value={user?.email} />
      {user?.matric_number && (
        <ProfileRow icon="hash" label="Matric Number" value={user.matric_number} />
      )}
      {user?.level && (
        <ProfileRow icon="layers" label="Level" value={user.level} />
      )}

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SETTINGS</Text>
      <ProfileRow icon="lock" label="Change Password" onPress={() => {}} />
      <ProfileRow icon="bell" label="Notification Preferences" onPress={() => {}} />

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SESSION</Text>
      <ProfileRow icon="log-out" label="Sign Out" onPress={handleLogout} danger />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 24 },
  avatarSection: { alignItems: "center", marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { color: "#fff", fontSize: 28, fontFamily: "Inter_700Bold" },
  name: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 6 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  roleText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  rowValue: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
});
