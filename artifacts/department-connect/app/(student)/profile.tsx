import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function StudentProfile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { courses, users, attendance, sessions, payments, contributions, addIssue, sendMessage, messages } = useData();
  const [issueOpen, setIssueOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ title: "", description: "" });
  const [msgBody, setMsgBody] = useState("");
  const [saving, setSaving] = useState(false);

  const isRep = user?.is_course_rep === true;
  const repCourseId = user?.course_rep_for;
  const repCourse = repCourseId ? courses.find((c) => c.id === repCourseId) : null;
  const repLecturer = repCourse ? users.find((u) => u.id === repCourse.lecturer_id) : null;

  const myAttendance = attendance.filter((a) => a.student_id === user?.id);
  const validSessions = sessions.filter((s) => s.status === "ended" || s.status === "completed");
  const attPct = validSessions.length > 0 ? Math.round((myAttendance.length / validSessions.length) * 100) : 0;
  const myPayments = payments.filter((p) => p.student_id === user?.id && (p.status === "paid" || p.status === "verified"));
  const totalPaid = myPayments.reduce((s, p) => s + p.amount, 0);

  const repStudents = repCourseId
    ? users.filter((u) => u.role === "student" && u.status === "active")
    : [];

  const myMessages = repCourseId
    ? messages.filter((m) => m.course_id === repCourseId && (m.sender_id === user?.id || m.recipient_id === user?.id))
    : [];

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSendIssue = async () => {
    if (!issueForm.title.trim() || !issueForm.description.trim() || !user || !repCourseId) return;
    setSaving(true);
    await addIssue({
      id: `issue-${Date.now()}`,
      course_id: repCourseId,
      raised_by: user.id,
      raiser_name: user.full_name,
      title: issueForm.title.trim(),
      description: issueForm.description.trim(),
      status: "open",
      created_at: new Date().toISOString(),
    });
    setSaving(false);
    setIssueOpen(false);
    setIssueForm({ title: "", description: "" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Issue Raised", "Your issue has been submitted to your lecturer.");
  };

  const handleSendMsg = async () => {
    if (!msgBody.trim() || !user || !repLecturer) return;
    setSaving(true);
    await sendMessage({
      id: `msg-${Date.now()}`,
      course_id: repCourseId!,
      sender_id: user.id,
      sender_name: user.full_name,
      recipient_id: repLecturer.id,
      body: msgBody.trim(),
      read: false,
      created_at: new Date().toISOString(),
    });
    setSaving(false);
    setMsgBody("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.profileTop}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{user?.full_name}</Text>
              {isRep && (
                <View style={styles.repBadge}>
                  <Feather name="star" size={10} color="#F59E0B" />
                  <Text style={styles.repBadgeText}>Course Rep</Text>
                </View>
              )}
            </View>
            {user?.matric_number && <Text style={styles.profileMeta}>{user.matric_number}</Text>}
            {user?.level && <Text style={styles.profileMeta}>Level {user.level}</Text>}
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert("Sign Out", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
            ])}
            style={styles.logoutBtn}
          >
            <Feather name="log-out" size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Attendance", value: `${attPct}%` },
            { label: "Check-ins", value: myAttendance.length },
            { label: "Paid", value: `₦${totalPaid.toLocaleString()}` },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardSection, { color: colors.mutedForeground }]}>ACCOUNT DETAILS</Text>
          {[
            { icon: "user" as const, label: "Full Name", value: user?.full_name },
            { icon: "mail" as const, label: "Email", value: user?.email },
            { icon: "hash" as const, label: "Matric Number", value: user?.matric_number ?? "—" },
            { icon: "layers" as const, label: "Level", value: user?.level ?? "—" },
            { icon: "phone" as const, label: "Phone", value: user?.phone ?? "—" },
          ].map((row) => (
            <View key={row.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.muted }]}>
                <Feather name={row.icon} size={14} color={colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {isRep && repCourse && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rep Tools — {repCourse.code}</Text>
            <View style={styles.repToolsRow}>
              {repLecturer && (
                <TouchableOpacity
                  style={[styles.repToolBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setMsgOpen(true)}
                >
                  <Feather name="message-circle" size={16} color="#fff" />
                  <Text style={styles.repToolText}>Message Lecturer</Text>
                  {myMessages.filter((m) => m.recipient_id === user?.id && !m.read).length > 0 && (
                    <View style={styles.msgBadge}>
                      <Text style={styles.msgBadgeText}>{myMessages.filter((m) => m.recipient_id === user?.id && !m.read).length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.repToolBtn, { backgroundColor: "#F59E0B" }]}
                onPress={() => setIssueOpen(true)}
              >
                <Feather name="alert-triangle" size={16} color="#fff" />
                <Text style={styles.repToolText}>Raise Issue</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Classmates ({repStudents.length})</Text>
            {repStudents.slice(0, 10).map((s) => (
              <View key={s.id} style={[styles.classmateRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.classmateAvatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.classmateAvatarText, { color: colors.primary }]}>{s.full_name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.classmateName, { color: colors.foreground }]}>{s.full_name}</Text>
                  {s.matric_number && <Text style={[styles.classmateMeta, { color: colors.mutedForeground }]}>{s.matric_number}</Text>}
                </View>
                {s.phone && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Feather name="phone" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.classmateMeta, { color: colors.mutedForeground }]}>{s.phone}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={issueOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Raise a Course Issue</Text>
            <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>This will be sent to your lecturer</Text>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Issue Title</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
              placeholder="Brief title of the issue" placeholderTextColor={colors.mutedForeground}
              value={issueForm.title} onChangeText={(v) => setIssueForm((f) => ({ ...f, title: v }))}
            />
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Description</Text>
            <TextInput
              style={[styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
              placeholder="Describe the issue in detail…" placeholderTextColor={colors.mutedForeground}
              multiline numberOfLines={4} textAlignVertical="top"
              value={issueForm.description} onChangeText={(v) => setIssueForm((f) => ({ ...f, description: v }))}
            />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#F59E0B", opacity: saving ? 0.7 : 1 }]} onPress={handleSendIssue} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <><Feather name="send" size={15} color="#fff" /><Text style={styles.saveBtnText}>Submit Issue</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setIssueOpen(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={msgOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Message Lecturer</Text>
            {repLecturer && (
              <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>To: {repLecturer.full_name}</Text>
            )}
            <ScrollView style={{ maxHeight: 200, marginBottom: 12 }}>
              {myMessages.map((m) => (
                <View key={m.id} style={[
                  styles.bubble,
                  m.sender_id === user?.id
                    ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                    : [styles.bubbleThem, { backgroundColor: colors.muted }],
                ]}>
                  <Text style={[styles.bubbleText, { color: m.sender_id === user?.id ? "#fff" : colors.foreground }]}>{m.body}</Text>
                </View>
              ))}
              {myMessages.length === 0 && (
                <Text style={[styles.noMsgText, { color: colors.mutedForeground }]}>No messages yet. Start the conversation!</Text>
              )}
            </ScrollView>
            <View style={styles.msgInputRow}>
              <TextInput
                style={[styles.msgInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                placeholder="Type a message…" placeholderTextColor={colors.mutedForeground}
                value={msgBody} onChangeText={setMsgBody}
              />
              <TouchableOpacity
                style={[styles.msgSendBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
                onPress={handleSendMsg} disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={16} color="#fff" />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border, marginTop: 8 }]} onPress={() => setMsgOpen(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  avatarWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  profileName: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  repBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(245,158,11,0.25)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  repBadgeText: { color: "#F59E0B", fontSize: 10, fontFamily: "Inter_700Bold" },
  profileMeta: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  scroll: { padding: 16 },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 24, overflow: "hidden" },
  cardSection: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, padding: 14, paddingBottom: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1 },
  infoIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 1 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  repToolsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  repToolBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 12, borderRadius: 14 },
  repToolText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  msgBadge: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  msgBadgeText: { color: "#7C3AED", fontSize: 10, fontFamily: "Inter_700Bold" },
  classmateRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  classmateAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  classmateAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  classmateName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  classmateMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sheetSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 16 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 14 },
  textarea: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 90, marginBottom: 14 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15, marginBottom: 10 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  bubble: { maxWidth: "80%", borderRadius: 14, padding: 10, marginBottom: 6 },
  bubbleMe: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  noMsgText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 12 },
  msgInputRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  msgInput: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  msgSendBtn: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
