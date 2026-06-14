import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LottiePlayer } from "@/components/LottiePlayer";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

const LEVELS = ["100L", "200L", "300L", "400L", "500L"];

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();

  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [matric, setMatric] = useState("");
  const [level, setLevel] = useState("100L");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const validate = () => {
    if (!fullName.trim()) return "Full name is required.";
    if (!email.trim() || !email.includes("@")) return "Enter a valid email address.";
    if (role === "student" && !matric.trim()) return "Matric number is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  };

  const handleSignup = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");
    const result = await signup({
      email,
      password,
      full_name: fullName,
      role,
      matric_number: role === "student" ? matric : undefined,
      level: role === "student" ? level : undefined,
      phone: phone || undefined,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    }
  };

  if (done) {
    return (
      <View style={[styles.doneWrap, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <LottiePlayer animation="loading" size={120} loop speed={0.7} />
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>Account Submitted</Text>
        <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
          Your account is pending review.{"\n\n"}
          Your department admin will verify your details and approve your access. You'll be able to sign in once approved.
        </Text>
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="mail" size={15} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Also check{" "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>{email}</Text>
            {" "}for a verification link from Supabase.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/login")}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.foreground }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Join your department on Department Connect
        </Text>

        {/* Role selector */}
        <Text style={[styles.label, { color: colors.foreground }]}>I am a</Text>
        <View style={styles.roleRow}>
          {(["student", "lecturer"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.roleCard,
                {
                  backgroundColor: role === r ? colors.primary : colors.card,
                  borderColor: role === r ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { setRole(r); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.85}
            >
              <Feather
                name={r === "student" ? "user" : "book-open"}
                size={22}
                color={role === r ? "#fff" : colors.primary}
              />
              <Text
                style={[
                  styles.roleLabel,
                  { color: role === r ? "#fff" : colors.foreground },
                ]}
              >
                {r === "student" ? "Student" : "Lecturer"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Full name */}
        <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="user" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="e.g. Kwame Mensah"
            placeholderTextColor={colors.mutedForeground}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="mail" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Phone (optional) */}
        <Text style={[styles.label, { color: colors.foreground }]}>
          Phone <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text>
        </Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="phone" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="+233 55 000 0000"
            placeholderTextColor={colors.mutedForeground}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Student-only fields */}
        {role === "student" && (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>Matric Number</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <Feather name="hash" size={17} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="e.g. CS/21/001"
                placeholderTextColor={colors.mutedForeground}
                value={matric}
                onChangeText={setMatric}
                autoCapitalize="characters"
              />
            </View>

            <Text style={[styles.label, { color: colors.foreground }]}>Level / Year</Text>
            <View style={styles.levelRow}>
              {LEVELS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[
                    styles.levelChip,
                    {
                      backgroundColor: level === l ? colors.primary : colors.card,
                      borderColor: level === l ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { setLevel(l); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.levelChipText,
                      { color: level === l ? "#fff" : colors.foreground },
                    ]}
                  >
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Password */}
        <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="lock" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Feather name={showPass ? "eye-off" : "eye"} size={17} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Confirm password */}
        <Text style={[styles.label, { color: colors.foreground }]}>Confirm Password</Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="lock" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Re-enter password"
            placeholderTextColor={colors.mutedForeground}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Feather name={showConfirm ? "eye-off" : "eye"} size={17} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="user-plus" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Create Account</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Sign in link */}
        <View style={styles.signinRow}>
          <Text style={[styles.signinText, { color: colors.mutedForeground }]}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/login")} activeOpacity={0.7}>
            <Text style={[styles.signinLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24 },
  backBtn: { marginBottom: 24, alignSelf: "flex-start" },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 28 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 4 },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    gap: 8,
  },
  roleLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 4,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  levelRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  levelChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  levelChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  errorText: { color: "#EF4444", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  submitBtn: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  signinRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signinText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  signinLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  doneWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  doneIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  doneTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 14, textAlign: "center" },
  doneSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 36,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    width: "100%",
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  doneBtn: {
    width: "100%",
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
