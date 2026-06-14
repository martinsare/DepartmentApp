import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const DEMO_ROLES = [
  { id: "admin-001", label: "Admin", email: "admin@dept.edu", icon: "shield" as const },
  { id: "lect-001", label: "Lecturer", email: "james@dept.edu", icon: "book-open" as const },
  { id: "stud-001", label: "Student", email: "john@student.edu", icon: "user" as const },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    }
  };

  const handleDemoLogin = async (userId: string) => {
    setDemoLoading(userId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await loginAsDemo(userId);
    setDemoLoading(null);
    router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
            <Feather name="layers" size={36} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>Department Connect</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Your department, always connected
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="mail" size={17} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Email address"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="lock" size={17} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Feather name={showPass ? "eye-off" : "eye"} size={17} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>Try demo</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.demoSection}>
          {DEMO_ROLES.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[styles.demoBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleDemoLogin(role.id)}
              activeOpacity={0.85}
            >
              {demoLoading === role.id ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <View style={[styles.demoIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name={role.icon} size={16} color={colors.primary} />
                </View>
              )}
              <View>
                <Text style={[styles.demoLabel, { color: colors.foreground }]}>{role.label}</Text>
                <Text style={[styles.demoEmail, { color: colors.mutedForeground }]}>{role.email}</Text>
              </View>
              <Feather name="arrow-right" size={16} color={colors.mutedForeground} style={styles.demoArrow} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24 },
  logoSection: { alignItems: "center", marginBottom: 36 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6 },
  tagline: { fontSize: 14, fontFamily: "Inter_400Regular" },
  form: { gap: 12, marginBottom: 28 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  errorText: { color: "#EF4444", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  loginBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  demoSection: { gap: 10 },
  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  demoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  demoLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  demoEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  demoArrow: { marginLeft: "auto" },
});
