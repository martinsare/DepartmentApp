import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { DirectReport } from "@/lib/types";

const ISSUE_TYPES: { value: DirectReport["issue_type"]; label: string; desc: string }[] = [
  { value: "harassment", label: "Harassment", desc: "Bullying, intimidation, or unwanted conduct" },
  { value: "academic_misconduct", label: "Academic Misconduct", desc: "Cheating, plagiarism, or unfair practices" },
  { value: "grading_dispute", label: "Grading Dispute", desc: "Unfair or incorrect grading" },
  { value: "safety_concern", label: "Safety Concern", desc: "Physical or emotional safety issues" },
  { value: "discrimination", label: "Discrimination", desc: "Bias based on race, gender, religion, etc." },
  { value: "other", label: "Other", desc: "Any other serious concern" },
];

export default function StudentReport() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { submitDirectReport } = useData();
  const [selectedType, setSelectedType] = useState<DirectReport["issue_type"] | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSubmit = async () => {
    if (!selectedType || !description.trim()) {
      Alert.alert("Required", "Please select an issue type and describe the issue.");
      return;
    }
    setSubmitting(true);
    await submitDirectReport({
      reporter_id: user?.id ?? "",
      reporter_name: user?.full_name,
      issue_type: selectedType,
      description: description.trim(),
    });
    setSubmitting(false);
    setSubmitted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Submitted</Text>
        </LinearGradient>
        <View style={styles.successBody}>
          <View style={[styles.successIcon, { backgroundColor: "#D1FAE5" }]}>
            <Feather name="check-circle" size={40} color="#10B981" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Report Received</Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            Your report has been sent directly to the administrator. You will be notified when it has been reviewed.
            Your identity is protected.
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerSub}>Confidential</Text>
        <Text style={styles.headerTitle}>Report a Serious Issue</Text>
        <Text style={styles.headerNote}>
          This report goes directly to the administrator only. It is separate from the course rep system.
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ISSUE TYPE</Text>
        {ISSUE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[styles.typeCard,
              { backgroundColor: colors.card, borderColor: selectedType === type.value ? colors.primary : colors.border },
              selectedType === type.value && { borderWidth: 2 }
            ]}
            onPress={() => { setSelectedType(type.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.85}
          >
            <View style={[styles.typeRadio, {
              borderColor: selectedType === type.value ? colors.primary : colors.border,
              backgroundColor: selectedType === type.value ? colors.primary : "transparent",
            }]}>
              {selectedType === type.value && <View style={styles.typeRadioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.typeName, { color: colors.foreground }]}>{type.label}</Text>
              <Text style={[styles.typeDesc, { color: colors.mutedForeground }]}>{type.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>DESCRIPTION</Text>
        <TextInput
          style={[styles.descInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail. Include dates, names (if safe to do so), and what happened."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <View style={[styles.confidentialNote, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="lock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.confidentialText, { color: colors.mutedForeground }]}>
            Your report is confidential. Only the administrator can see it.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Feather name="send" size={16} color="#fff" />
          <Text style={styles.submitBtnText}>{submitting ? "Submitting…" : "Submit Report"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: { marginBottom: 8 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  headerNote: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8, lineHeight: 18 },
  scroll: { padding: 16, gap: 8 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 4 },
  typeCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  typeRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  typeRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  typeName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  typeDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  descInput: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 140, lineHeight: 22 },
  confidentialNote: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
  confidentialText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  submitBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  successBody: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  doneBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
