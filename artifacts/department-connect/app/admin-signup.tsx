import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { DEFAULT_DEPARTMENT_ID } from "@/lib/types";
import { useColors } from "@/hooks/useColors";

export default function AdminSignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const validate = () => {
    if (!fullName.trim()) return "Full name is required.";
    if (!email.trim() || !email.includes("@")) return "Enter a valid email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  };

  const handleSignup = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: authError, data } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message.includes("already registered")
        ? "An account with this email already exists."
        : authError.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      setError("Signup failed. Please try again.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      role: "admin",
      full_name: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim() || null,
      department_id: DEFAULT_DEPARTMENT_ID,
      status: "active",
    }, { onConflict: "id" });

    setLoading(false);

    if (profileError) {
      setError("Account created but profile setup failed: " + profileError.message);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDone(true);
  };

  if (done) {
    return (
      <View style={[styles.doneWrap, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.doneIcon, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="shield" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>Admin Account Created</Text>
        <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
          Your admin account is ready.{"\n"}Check your email to verify, then sign in.
        </Text>
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/login")}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Go to Sign In</Text>
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="shield" size={14} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>Admin Registration</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Create Admin Account</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          This page is for department administrators only.
        </Text>

        <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="user" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="e.g. Dr. Kwame Mensah"
            placeholderTextColor={colors.mutedForeground}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="mail" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="admin@university.edu"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

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

        {error ? (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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
              <Feather name="shield" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Create Admin Account</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signinRow}
          onPress={() => router.replace("/login")}
          activeOpacity={0.7}
        >
          <Text style={[styles.signinText, { color: colors.mutedForeground }]}>
            Already have an account?{" "}
          </Text>
          <Text style={[styles.signinLink, { color: colors.primary }]}>Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24 },
  backBtn: { marginBottom: 20, alignSelf: "flex-start" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 28 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 4 },
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
  doneBtn: {
    width: "100%",
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
