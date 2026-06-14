import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
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
  {
    id: "admin-001",
    label: "Admin",
    email: "admin@dept.edu",
    icon: "shield" as const,
    color: "#7C3AED",
    route: "/(admin)/",
  },
  {
    id: "lect-001",
    label: "Lecturer",
    email: "james@dept.edu",
    icon: "book-open" as const,
    color: "#10B981",
    route: "/(lecturer)/",
  },
  {
    id: "stud-001",
    label: "Student",
    email: "john@student.edu",
    matric: "CS/21/001",
    icon: "user" as const,
    color: "#3B82F6",
    route: "/(student)/",
  },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, loginAsDemo } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo fade in
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start();
    // Form slide up
    Animated.parallel([
      Animated.timing(formAnim, {
        toValue: 0,
        duration: 600,
        delay: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        delay: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
    // Pulse on icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    ).start();
  }, []);

  const routeForRole = (role?: string) => {
    if (role === "admin") return "/(admin)/";
    if (role === "lecturer") return "/(lecturer)/";
    return "/(student)/";
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your email or matric number and password");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(identifier.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(routeForRole(result.role) as any);
    }
  };

  const handleDemoLogin = async (userId: string, route: string) => {
    setDemoLoading(userId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await loginAsDemo(userId);
    setDemoLoading(null);
    router.replace(route as any);
  };

  const isEmail = identifier.includes("@") || identifier.length === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Splash background image */}
        <Image
          source={require("@/assets/images/splash-bg.png")}
          style={styles.bgImage}
          contentFit="cover"
        />

        {/* Logo section */}
        <Animated.View
          style={[styles.logoSection, { opacity: logoAnim }]}
        >
          <Animated.View
            style={[
              styles.logoOuter,
              {
                backgroundColor: colors.primary + "18",
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.logoImg}
                contentFit="cover"
              />
            </View>
          </Animated.View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Department Connect
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Your department, always connected
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[
            styles.form,
            { opacity: formOpacity, transform: [{ translateY: formAnim }] },
          ]}
        >
          <View
            style={[
              styles.inputWrap,
              { borderColor: colors.border, backgroundColor: colors.muted },
            ]}
          >
            <Feather
              name={isEmail ? "mail" : "hash"}
              size={17}
              color={colors.mutedForeground}
            />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Email or matric number"
              placeholderTextColor={colors.mutedForeground}
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View
            style={[
              styles.inputWrap,
              { borderColor: colors.border, backgroundColor: colors.muted },
            ]}
          >
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
              <Feather
                name={showPass ? "eye-off" : "eye"}
                size={17}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.forgotRow}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.loginBtn,
              { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 },
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="log-in" size={18} color="#fff" />
                <Text style={styles.loginBtnText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Demo shortcuts */}
        <Animated.View style={{ opacity: formOpacity }}>
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
              Demo accounts
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.demoSection}>
            {DEMO_ROLES.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.demoBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => handleDemoLogin(role.id, role.route)}
                activeOpacity={0.85}
              >
                {demoLoading === role.id ? (
                  <ActivityIndicator
                    color={role.color}
                    size="small"
                    style={{ width: 38 }}
                  />
                ) : (
                  <View
                    style={[
                      styles.demoIcon,
                      { backgroundColor: role.color + "20" },
                    ]}
                  >
                    <Feather name={role.icon} size={16} color={role.color} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.demoLabel, { color: colors.foreground }]}>
                    {role.label}
                  </Text>
                  <Text
                    style={[styles.demoEmail, { color: colors.mutedForeground }]}
                  >
                    {role.email}
                    {"matric" in role ? ` · ${role.matric}` : ""}
                  </Text>
                </View>
                <Feather
                  name="arrow-right"
                  size={16}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24 },
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    opacity: 0.07,
  },
  logoSection: { alignItems: "center", marginBottom: 32 },
  logoOuter: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logoImg: { width: 80, height: 80 },
  appName: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6 },
  tagline: { fontSize: 14, fontFamily: "Inter_400Regular" },
  form: { gap: 12, marginBottom: 24 },
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
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  forgotRow: { alignItems: "flex-end" },
  forgotText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  loginBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
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
  demoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  demoLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  demoEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
