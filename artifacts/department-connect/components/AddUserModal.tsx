import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: { label: string; value: "student" | "lecturer" }[] = [
  { label: "Student", value: "student" },
  { label: "Lecturer", value: "lecturer" },
];

export function AddUserModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addInvitedUser } = useData();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [matricNumber, setMatricNumber] = useState("");
  const [level, setLevel] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => {
    setFullName("");
    setEmail("");
    setRole("student");
    setMatricNumber("");
    setLevel("");
    setPhone("");
    setError("");
    setDone(false);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();
    if (!name) { setError("Full name is required."); return; }
    if (!mail || !mail.includes("@")) { setError("A valid email is required."); return; }
    setError("");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await addInvitedUser({
      full_name: name,
      email: mail,
      role,
      matric_number: matricNumber.trim() || undefined,
      level: level.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setDone(true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Add User</Text>
          <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
            <Feather name="x" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {done ? (
          <View style={styles.doneWrap}>
            <View style={[styles.doneIcon, { backgroundColor: "#D1FAE5" }]}>
              <Feather name="user-check" size={32} color="#10B981" />
            </View>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>Invitation Sent!</Text>
            <Text style={[styles.doneBody, { color: colors.mutedForeground }]}>
              {fullName.trim()} has been added. They can sign up using {email.trim().toLowerCase()} and will be automatically approved.
            </Text>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={handleClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.hint, { color: colors.mutedForeground, backgroundColor: colors.muted, borderColor: colors.border }]}>
              The user will receive an invite email and can sign up with the email you enter. Their account will be automatically approved.
            </Text>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>ROLE</Text>
            <View style={styles.roleRow}>
              {ROLE_OPTIONS.map((opt) => {
                const active = role === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.roleChip, {
                      backgroundColor: active ? colors.primary : colors.muted,
                      borderColor: active ? colors.primary : colors.border,
                    }]}
                    onPress={() => setRole(opt.value)}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={opt.value === "student" ? "user" : "briefcase"}
                      size={14}
                      color={active ? "#fff" : colors.mutedForeground}
                    />
                    <Text style={[styles.roleChipText, { color: active ? "#fff" : colors.foreground }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>FULL NAME *</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              placeholder="e.g. Kwame Mensah"
              placeholderTextColor={colors.mutedForeground}
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL ADDRESS *</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              placeholder="user@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {role === "student" && (
              <>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>MATRIC NUMBER</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                  placeholder="e.g. CS/21/001"
                  placeholderTextColor={colors.mutedForeground}
                  value={matricNumber}
                  onChangeText={setMatricNumber}
                  autoCapitalize="characters"
                />

                <Text style={[styles.label, { color: colors.mutedForeground }]}>LEVEL</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                  placeholder="e.g. 300"
                  placeholderTextColor={colors.mutedForeground}
                  value={level}
                  onChangeText={setLevel}
                  keyboardType="number-pad"
                />
              </>
            )}

            <Text style={[styles.label, { color: colors.mutedForeground }]}>PHONE (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              placeholder="+233 55 000 0000"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
                <Feather name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="user-plus" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Add & Send Invite</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
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
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingTop: 20, gap: 6 },
  hint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginTop: 12, marginBottom: 4 },
  roleRow: { flexDirection: "row", gap: 10 },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  roleChipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  errorText: { flex: 1, color: "#EF4444", fontSize: 13, fontFamily: "Inter_400Regular" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 },
  doneIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  doneBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  doneBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
