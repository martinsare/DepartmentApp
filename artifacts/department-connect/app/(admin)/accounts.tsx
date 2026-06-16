import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddUserModal } from "@/components/AddUserModal";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { User, UserRole } from "@/lib/types";

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#7C3AED", lecturer: "#10B981", student: "#3B82F6",
};

type Tab = "active" | "pending" | "invited" | "suspended";

export default function AdminAccounts() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const { users, invitations, approveUser, rejectUser, suspendUser, removeInvitation, flagProfileMismatch, clearProfileFlag } = useData();
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [roleOverride, setRoleOverride] = useState<Record<string, UserRole>>({});
  const [showAddUser, setShowAddUser] = useState(false);
  const [flagModal, setFlagModal] = useState<User | null>(null);
  const [flagReason, setFlagReason] = useState("");

  const activeUsers = users.filter((u) => u.status === "active");
  const pendingUsers = users.filter((u) => u.status === "pending");
  const suspendedUsers = users.filter((u) => u.status === "suspended");

  const q = search.toLowerCase();
  const filteredUsers = (tab === "active" ? activeUsers : tab === "pending" ? pendingUsers : suspendedUsers)
    .filter((u) => !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.matric_number ?? "").toLowerCase().includes(q));
  const filteredInvites = invitations.filter((inv) => !q || inv.full_name.toLowerCase().includes(q) || inv.email.toLowerCase().includes(q));

  const handleApprove = async (u: User) => {
    const role = roleOverride[u.id] ?? u.role;
    setActionId(u.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await approveUser(u.id, role, u.full_name, u.email);
    setActionId(null);
  };

  const handleReject = (u: User) => {
    Alert.alert("Remove Account", `Remove ${u.full_name}'s account? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { setActionId(u.id); await rejectUser(u.id, u.full_name, u.email); setActionId(null); } },
    ]);
  };

  const handleSuspend = (u: User) => {
    Alert.alert("Suspend Account", `Suspend ${u.full_name}? They won't be able to log in.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Suspend", style: "destructive", onPress: async () => { setActionId(u.id); await suspendUser(u.id); setActionId(null); } },
    ]);
  };

  const handleFlagProfile = async () => {
    if (!flagModal || !flagReason.trim()) return;
    await flagProfileMismatch(flagModal.id, flagReason.trim(), currentUser?.id ?? "", currentUser?.full_name ?? "");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setFlagModal(null);
    setFlagReason("");
  };

  const handleClearFlag = (u: User) => {
    Alert.alert("Clear Flag", `Clear the profile mismatch flag for ${u.full_name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", onPress: () => clearProfileFlag(u.id) },
    ]);
  };

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: activeUsers.length },
    { key: "pending", label: "Pending", count: pendingUsers.length },
    { key: "invited", label: "Invited", count: invitations.length },
    { key: "suspended", label: "Suspended", count: suspendedUsers.length },
  ];

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#5B21B6", "#7C3AED"]} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>Account Management</Text>
            <Text style={styles.headerTitle}>Accounts</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddUser(true)} activeOpacity={0.85}>
            <Feather name="user-plus" size={16} color="#7C3AED" />
            <Text style={styles.addBtnText}>Invite</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ gap: 4 }}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => { setTab(t.key); setSearch(""); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
              {t.count > 0 && (
                <View style={[styles.tabBadge, tab === t.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, tab === t.key && styles.tabBadgeTextActive]}>{t.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search by name, email, matric…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && <TouchableOpacity onPress={() => setSearch("")}><Feather name="x" size={15} color={colors.mutedForeground} /></TouchableOpacity>}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "invited" ? (
          filteredInvites.length === 0 ? (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="mail" size={36} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No invitations</Text>
            </View>
          ) : filteredInvites.map((inv) => (
            <View key={inv.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: "#3B82F6" }]}>
                  <Text style={styles.avatarText}>{inv.full_name[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{inv.full_name}</Text>
                  <Text style={[styles.cardEmail, { color: colors.mutedForeground }]}>{inv.email}</Text>
                </View>
                <View style={[styles.rolePill, { backgroundColor: "#3B82F620" }]}>
                  <Text style={[styles.rolePillText, { color: "#3B82F6" }]}>{inv.role}</Text>
                </View>
              </View>
              <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.btnOutline, { borderColor: "#EF4444" }]}
                  onPress={() => Alert.alert("Cancel Invitation", `Remove invite for ${inv.full_name}?`, [
                    { text: "Keep", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: () => removeInvitation(inv.id) },
                  ])}
                >
                  <Feather name="x" size={14} color="#EF4444" />
                  <Text style={[styles.btnOutlineText, { color: "#EF4444" }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={[styles.inviteStatus, { backgroundColor: colors.muted }]}>
                  <Feather name="clock" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.inviteStatusText, { color: colors.mutedForeground }]}>Awaiting signup</Text>
                </View>
              </View>
            </View>
          ))
        ) : filteredUsers.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="users" size={36} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              {tab === "pending" ? "No pending requests" : tab === "suspended" ? "No suspended accounts" : "No active users"}
            </Text>
          </View>
        ) : filteredUsers.map((u) => {
          const rc = ROLE_COLORS[u.role];
          const effectiveRole = roleOverride[u.id] ?? u.role;
          const loading = actionId === u.id;
          return (
            <View key={u.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: rc }]}>
                  <Text style={styles.avatarText}>{u.full_name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{u.full_name}</Text>
                  <Text style={[styles.cardEmail, { color: colors.mutedForeground }]}>{u.email}</Text>
                  {u.matric_number && (
                    <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>{u.matric_number} · {u.level ?? ""}</Text>
                  )}
                  {u.profile_flagged && (
                    <View style={styles.flagBadge}>
                      <Feather name="flag" size={10} color="#F59E0B" />
                      <Text style={styles.flagBadgeText}>Profile Flagged</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.rolePill, { backgroundColor: rc + "15" }]}>
                  <Text style={[styles.rolePillText, { color: rc }]}>{u.role}</Text>
                </View>
              </View>

              {tab === "pending" && (
                <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {(["student", "lecturer", "admin"] as UserRole[]).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.roleChip, { backgroundColor: effectiveRole === r ? ROLE_COLORS[r] : colors.muted, borderColor: colors.border }]}
                        onPress={() => setRoleOverride((prev) => ({ ...prev, [u.id]: r }))}
                      >
                        <Text style={{ color: effectiveRole === r ? "#fff" : colors.foreground, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.btnOutline, { borderColor: "#EF4444", flex: 1 }]}
                      onPress={() => handleReject(u)} disabled={loading}
                    >
                      {loading ? <ActivityIndicator size="small" color="#EF4444" /> : <><Feather name="x" size={14} color="#EF4444" /><Text style={[styles.btnOutlineText, { color: "#EF4444" }]}>Reject</Text></>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnFilled, { flex: 2 }]}
                      onPress={() => handleApprove(u)} disabled={loading}
                    >
                      {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Feather name="check" size={14} color="#fff" /><Text style={styles.btnFilledText}>Approve</Text></>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {tab === "active" && (
                <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.btnOutline, { borderColor: "#F59E0B" }]}
                    onPress={() => handleSuspend(u)} disabled={loading}
                  >
                    {loading ? <ActivityIndicator size="small" color="#F59E0B" /> : <><Feather name="pause-circle" size={14} color="#F59E0B" /><Text style={[styles.btnOutlineText, { color: "#F59E0B" }]}>Suspend</Text></>}
                  </TouchableOpacity>
                  {u.profile_flagged ? (
                    <TouchableOpacity
                      style={[styles.btnOutline, { borderColor: "#10B981" }]}
                      onPress={() => handleClearFlag(u)}
                    >
                      <Feather name="check-circle" size={14} color="#10B981" />
                      <Text style={[styles.btnOutlineText, { color: "#10B981" }]}>Clear Flag</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.btnOutline, { borderColor: "#F59E0B" }]}
                      onPress={() => { setFlagModal(u); setFlagReason(""); }}
                    >
                      <Feather name="flag" size={14} color="#F59E0B" />
                      <Text style={[styles.btnOutlineText, { color: "#F59E0B" }]}>Flag Profile</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.btnOutline, { borderColor: "#EF4444" }]}
                    onPress={() => handleReject(u)} disabled={loading}
                  >
                    {loading ? <ActivityIndicator size="small" color="#EF4444" /> : <><Feather name="trash-2" size={14} color="#EF4444" /><Text style={[styles.btnOutlineText, { color: "#EF4444" }]}>Delete</Text></>}
                  </TouchableOpacity>
                </View>
              )}

              {tab === "suspended" && (
                <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.btnFilled, { flex: 1 }]}
                    onPress={() => handleApprove(u)} disabled={loading}
                  >
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Feather name="user-check" size={14} color="#fff" /><Text style={styles.btnFilledText}>Reinstate</Text></>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <AddUserModal visible={showAddUser} onClose={() => setShowAddUser(false)} />

      <Modal visible={!!flagModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFlagModal(null)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Flag Profile Mismatch</Text>
            <TouchableOpacity onPress={() => setFlagModal(null)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          {flagModal && (
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Flagging <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{flagModal.full_name}</Text> will prevent them from accessing the app until they update their profile.
            </Text>
          )}
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Reason for flag</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            value={flagReason}
            onChangeText={setFlagReason}
            placeholder="e.g. Name does not match registration records"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.flagBtn, { backgroundColor: "#F59E0B", opacity: !flagReason.trim() ? 0.6 : 1 }]}
            onPress={handleFlagProfile}
            disabled={!flagReason.trim()}
          >
            <Feather name="flag" size={16} color="#fff" />
            <Text style={styles.flagBtnText}>Flag Profile</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 0 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#7C3AED", fontSize: 13, fontFamily: "Inter_700Bold" },
  tabScroll: { marginBottom: 0 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 4, backgroundColor: "rgba(255,255,255,0.15)" },
  tabBtnActive: { backgroundColor: "#fff" },
  tabLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_500Medium" },
  tabLabelActive: { color: "#7C3AED" },
  tabBadge: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: "#7C3AED20" },
  tabBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontFamily: "Inter_700Bold" },
  tabBadgeTextActive: { color: "#7C3AED" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 40, alignItems: "center", gap: 10, marginTop: 8 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 10, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  cardName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardEmail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  cardMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  flagBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, backgroundColor: "#FEF3C7", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, alignSelf: "flex-start" },
  flagBadgeText: { color: "#F59E0B", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rolePillText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  cardActions: { borderTopWidth: 1, padding: 12, gap: 8, flexDirection: "row", flexWrap: "wrap" },
  roleChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  btnOutline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5 },
  btnOutlineText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  btnFilled: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "#10B981" },
  btnFilledText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inviteStatus: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  inviteStatusText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  modal: { flex: 1, padding: 24 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 20 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80 },
  flagBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15, marginTop: 20 },
  flagBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
