import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!user) return <>{children}</>;

  if (user.profile_flagged) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Text style={styles.headerTitle}>Profile Review Required</Text>
        </LinearGradient>
        <View style={styles.body}>
          <View style={[styles.iconWrap, { backgroundColor: "#FEF3C7" }]}>
            <Feather name="alert-triangle" size={32} color="#F59E0B" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Profile Flagged</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Admin has flagged your profile due to a details mismatch.
            {user.flag_reason ? `\n\nReason: ${user.flag_reason}` : ""}
            {"\n\nPlease update your profile to proceed."}
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(student)/profile")}
          >
            <Feather name="edit-2" size={16} color="#fff" />
            <Text style={styles.btnText}>Update Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (user.role !== "admin" && !user.profile_complete) {
    const requiredFields =
      user.role === "student"
        ? ["full_name", "matric_number", "level", "phone"]
        : ["full_name", "staff_id", "faculty", "phone"];

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Text style={styles.headerTitle}>Complete Your Profile</Text>
        </LinearGradient>
        <View style={styles.body}>
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="user-check" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Profile Incomplete</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Please complete your profile before accessing the app. Required fields:
          </Text>
          <View style={styles.fieldList}>
            {requiredFields.map((f) => (
              <View key={f} style={styles.fieldRow}>
                <Feather name="check-circle" size={14} color={colors.primary} />
                <Text style={[styles.fieldText, { color: colors.foreground }]}>
                  {f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() =>
              user.role === "student"
                ? router.push("/(student)/profile")
                : router.push("/(lecturer)/settings")
            }
          >
            <Feather name="arrow-right" size={16} color="#fff" />
            <Text style={styles.btnText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 4 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  fieldList: { width: "100%", gap: 8, marginTop: 4 },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  btn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  btnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
