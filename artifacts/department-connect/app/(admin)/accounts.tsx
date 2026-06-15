import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddUserModal } from "@/components/AddUserModal";
import { UserDetailModal } from "@/components/UserDetailModal";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { User, UserRole } from "@/lib/types";

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#7C3AED",
  lecturer: "#10B981",
  student: "#3B82F6",
};
const ROLE_ICONS: Record<UserRole, "shield" | "briefcase" | "user"> = {
  admin: "shield",
  lecturer: "briefcase",
  student: "user",
};

type Tab = "active" | "pending" | "invited" | "suspended";

export default function AdminAccounts() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { users, invitations, approveUser, rejectUser, removeInvitation } = useData();
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [roleOverride, setRoleOverride] = useState<Record<string, UserRole>>({});
  const [showAddUser, setShowAddUser] = useState(false);

  const activeUsers = users.filter((u) => u.status === "active" || !u.status);
  const pendingUsers = users.filter((u) => u.status === "pending");
  const suspendedUsers = users.filter((u) => u.status === "suspended");

  const filteredUsers = (
    tab === "active" ? activeUsers : tab === "pending" ? pendingUsers : suspendedUsers
  ).filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.matric_number ?? "").toLowerCase().includes(q)
    );
  });

  const filteredInvitations = invitations.filter((inv) => {
    const q = search.toLowerCase();
    return (
      !q ||
      inv.full_name.toLowerCase().includes(q) ||
      inv.email.toLowerCase().includes(q)
    );
  });

  const handleApprove = async (u: User) => {
    const role = roleOverride[u.id] ?? u.role;
    setApprovingId(u.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await approveUser(u.id, role, u.full_name, u.email);
    setApprovingId(null);
  };

  const handleReject = (u: User) => {
    Alert.alert(
      "Reject Account",
      `Remove ${u.full_name}'s registration request? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRejectingId(u.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await rejectUser(u.id, u.full_name, u.email);
            setRejectingId(null);
          },
        },
      ]
    );
  };

  const handleRemoveInvite = (id: string, name: string) => {
    Alert.alert(
      "Cancel Invitation",
      `Remove the invitation for ${name}?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemovingId(id);
            await removeInvitation(id);
            setRemovingId(null);
          },
        },
      ]
    );
  };

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: activeUsers.length },
    { key: "pending", label: "Pending", count: pendingUsers.length },
    { key: "invited", label: "Invited", count: invitations.length },
    { key: "suspended", label: "Suspended", count: suspendedUsers.length },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Accounts</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {pendingUsers.length > 0 && (
            <View style={[styles.pendingBadge, { backgroundColor: "#F59E0B" }]}>
              <Text style={styles.pendingBadgeText}>{pendingUsers.length} pending</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddUser(true)}
            activeOpacity={0.85}
          >
            <Feather name="user-plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabRow, { borderBottomColor: colors.border }]}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => { setTab(t.key); setSearch(""); }}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabLabel, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>
              {t.label}
            </Text>
            {t.count > 0 && (
              <View style={[
                styles.tabCount,
                {
                  backgroundColor:
                    t.key === "pending" ? "#FEF3C7" :
                    t.key === "invited" ? "#EDE9FE" :
                    colors.secondary,
                },
              ]}>
                <Text style={[
                  styles.tabCountText,
                  {
                    color:
                      t.key === "pending" ? "#92400E" :
                      t.key === "invited" ? "#5B21B6" :
                      colors.primary,
                  },
                ]}>
                  {t.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 }}>
        <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search name, email, matric..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── INVITED TAB ── */}
        {tab === "invited" ? (
          filteredInvitations.length === 0 ? (
            <View style={[styles.emptyWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="mail" size={28} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {search ? "No invitations match your search" : "No pending invitations"}
              </Text>
              <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
                Tap "Add" above to invite a student or lecturer
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>
                {filteredInvitations.length} invitation{filteredInvitations.length !== 1 ? "s" : ""}
              </Text>
              {filteredInvitations.map((inv) => (
                <View
                  key={inv.id}
                  style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.avatar, { backgroundColor: inv.role === "student" ? ROLE_COLORS.student : ROLE_COLORS.lecturer }]}>
                      <Text style={styles.avatarText}>
                        {inv.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userName, { color: colors.foreground }]}>{inv.full_name}</Text>
                      <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{inv.email}</Text>
                      {inv.matric_number && (
                        <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>
                          {inv.matric_number}{inv.level ? ` · ${inv.level}` : ""}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: (inv.role === "student" ? ROLE_COLORS.student : ROLE_COLORS.lecturer) + "20" }]}>
                      <Feather name={ROLE_ICONS[inv.role]} size={11} color={inv.role === "student" ? ROLE_COLORS.student : ROLE_COLORS.lecturer} />
                      <Text style={[styles.roleText, { color: inv.role === "student" ? ROLE_COLORS.student : ROLE_COLORS.lecturer }]}>
                        {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.inviteActions, { borderTopColor: colors.border }]}>
                    <View style={[styles.inviteChip, { backgroundColor: "#EDE9FE" }]}>
                      <Feather name="clock" size={11} color="#5B21B6" />
                      <Text style={[styles.inviteChipText, { color: "#5B21B6" }]}>Awaiting sign-up</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.removeBtn, { borderColor: "#EF4444", opacity: removingId === inv.id ? 0.5 : 1 }]}
                      onPress={() => handleRemoveInvite(inv.id, inv.full_name)}
                      disabled={removingId === inv.id}
                      activeOpacity={0.8}
                    >
                      {removingId === inv.id ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <>
                          <Feather name="x" size={13} color="#EF4444" />
                          <Text style={styles.removeBtnText}>Cancel</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )
        ) : (
          /* ── OTHER TABS ── */
          filteredUsers.length === 0 ? (
            <View style={[styles.emptyWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather
                name={tab === "pending" ? "user-check" : tab === "suspended" ? "user-x" : "users"}
                size={28}
                color={colors.border}
              />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {tab === "pending"
                  ? "No pending registrations"
                  : tab === "suspended"
                  ? "No suspended accounts"
                  : search
                  ? "No accounts match your search"
                  : "No active accounts yet"}
              </Text>
              {tab === "pending" && (
                <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
                  New user registrations will appear here for review
                </Text>
              )}
            </View>
          ) : (
            <>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>
                {filteredUsers.length} account{filteredUsers.length !== 1 ? "s" : ""}
              </Text>

              {filteredUsers.map((u) => (
                <View
                  key={u.id}
                  style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <TouchableOpacity
                    style={styles.cardTop}
                    onPress={() => tab === "active" && setSelectedUser(u)}
                    activeOpacity={tab === "active" ? 0.75 : 1}
                  >
                    <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[u.role] }]}>
                      <Text style={styles.avatarText}>
                        {u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userName, { color: colors.foreground }]}>{u.full_name}</Text>
                      <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{u.email}</Text>
                      {u.matric_number && (
                        <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>
                          {u.matric_number}{u.level ? ` · ${u.level}` : ""}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[u.role] + "20" }]}>
                      <Feather name={ROLE_ICONS[u.role]} size={11} color={ROLE_COLORS[u.role]} />
                      <Text style={[styles.roleText, { color: ROLE_COLORS[u.role] }]}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {tab === "pending" && (
                    <View style={[styles.pendingActions, { borderTopColor: colors.border }]}>
                      <View style={styles.rolePickerRow}>
                        <Text style={[styles.rolePickerLabel, { color: colors.mutedForeground }]}>
                          Approve as:
                        </Text>
                        {(["student", "lecturer"] as const).map((r) => {
                          const picked = (roleOverride[u.id] ?? u.role) === r;
                          return (
                            <TouchableOpacity
                              key={r}
                              style={[
                                styles.roleChip,
                                {
                                  backgroundColor: picked ? ROLE_COLORS[r] + "20" : colors.muted,
                                  borderColor: picked ? ROLE_COLORS[r] : colors.border,
                                  borderWidth: 1,
                                },
                              ]}
                              onPress={() => setRoleOverride((prev) => ({ ...prev, [u.id]: r }))}
                              activeOpacity={0.75}
                            >
                              <Feather name={ROLE_ICONS[r]} size={12} color={picked ? ROLE_COLORS[r] : colors.mutedForeground} />
                              <Text style={[styles.roleChipText, { color: picked ? ROLE_COLORS[r] : colors.mutedForeground }]}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={styles.actionBtns}>
                        <TouchableOpacity
                          style={[styles.rejectBtn, { borderColor: "#EF4444" }]}
                          onPress={() => handleReject(u)}
                          disabled={rejectingId === u.id}
                          activeOpacity={0.8}
                        >
                          {rejectingId === u.id ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                          ) : (
                            <>
                              <Feather name="x" size={15} color="#EF4444" />
                              <Text style={styles.rejectBtnText}>Reject</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.approveBtn, { backgroundColor: "#10B981", opacity: approvingId === u.id ? 0.7 : 1 }]}
                          onPress={() => handleApprove(u)}
                          disabled={approvingId === u.id}
                          activeOpacity={0.85}
                        >
                          {approvingId === u.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Feather name="check" size={15} color="#fff" />
                              <Text style={styles.approveBtnText}>Approve</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </>
          )
        )}
      </ScrollView>

      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      <AddUserModal visible={showAddUser} onClose={() => setShowAddUser(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pendingBadgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabRow: {
    borderBottomWidth: 1,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tabCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabCountText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  count: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
  emptyWrap: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 36,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  emptyText: { fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptySubText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  userMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  pendingActions: {
    borderTopWidth: 1,
    padding: 12,
    gap: 10,
  },
  inviteActions: {
    borderTopWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inviteChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  inviteChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  removeBtnText: { color: "#EF4444", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  rolePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  rolePickerLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  actionBtns: { flexDirection: "row", gap: 8 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  rejectBtnText: { color: "#EF4444", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  approveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  approveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
