import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { user } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => {
    setCurrent(""); setNext(""); setConfirm("");
    setError(""); setDone(false); setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!current) { setError("Enter your current password."); return; }
    if (next.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (next !== confirm) { setError("Passwords do not match."); return; }
    if (!isSupabaseConfigured || !supabase || !user?.email) {
      setError("Not connected. Please try again."); return;
    }

    setLoading(true);
    setError("");

    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });

    if (verifyErr) {
      setLoading(false);
      setError("Current password is incorrect.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: next });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDone(true);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Change Password</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.body}>
          {done ? (
            <View style={styles.successWrap}>
              <View style={[styles.successIcon, { backgroundColor: "#D1FAE5" }]}>
                <Feather name="check" size={32} color="#10B981" />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Password Updated</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                Your password has been changed successfully.
              </Text>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                Enter your current password to verify your identity, then set a new one.
              </Text>

              <Text style={[styles.label, { color: colors.foreground }]}>Current Password</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="lock" size={17} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Your current password"
                  placeholderTextColor={colors.mutedForeground}
                  value={current}
                  onChangeText={setCurrent}
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                  <Feather name={showCurrent ? "eye-off" : "eye"} size={17} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.foreground }]}>New Password</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="lock" size={17} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.mutedForeground}
                  value={next}
                  onChangeText={setNext}
                  secureTextEntry={!showNext}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNext(!showNext)}>
                  <Feather name={showNext ? "eye-off" : "eye"} size={17} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.foreground }]}>Confirm New Password</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="lock" size={17} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.mutedForeground}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
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
                style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1, marginTop: 8 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginBottom: 24 },
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
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  errorText: { color: "#EF4444", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  btn: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 12 },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23, marginBottom: 32 },
});
