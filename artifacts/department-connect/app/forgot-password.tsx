import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await resetPassword(email.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View
        style={[
          styles.doneWrap,
          { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={[styles.doneIcon, { backgroundColor: "#EDE9FE" }]}>
          <Feather name="send" size={36} color="#7C3AED" />
        </View>
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>Check your inbox</Text>
        <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
          We sent a password reset link to{"\n"}
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>{email}</Text>
          {"\n\n"}Follow the link to set a new password, then sign in.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/login")}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Back to Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resendBtn}
          onPress={() => { setSent(false); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
            Didn't receive it? Try again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={[styles.iconWrap, { backgroundColor: "#EDE9FE" }]}>
          <Feather name="lock" size={32} color="#7C3AED" />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Forgot Password?</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter your registered email and we'll send you a link to reset your password.
        </Text>

        <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
        <View
          style={[
            styles.inputWrap,
            { borderColor: colors.border, backgroundColor: colors.muted },
          ]}
        >
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
            autoFocus
          />
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSend}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="send" size={17} color="#fff" />
              <Text style={styles.btnText}>Send Reset Link</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backToLogin}
          onPress={() => router.replace("/login")}
          activeOpacity={0.7}
        >
          <Text style={[styles.backToLoginText, { color: colors.mutedForeground }]}>
            Back to{" "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 32, alignSelf: "flex-start" },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24, marginBottom: 32 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 8,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  errorText: { color: "#EF4444", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  btn: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  backToLogin: { alignItems: "center", marginTop: 20 },
  backToLoginText: { fontSize: 14, fontFamily: "Inter_400Regular" },
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
  resendBtn: { marginTop: 16 },
  resendText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
