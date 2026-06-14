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
import { UserDetailModal } from "@/components/UserDetailModal";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { User, UserRole } from "@/lib/demoData";

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

type Tab = "active" | "pending" | "suspended";

export default function AdminAccounts() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { users, approveUser, rejectUser } = useData();
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [roleOverride, setRoleOverride] = useState<Record<string, UserRole>>({});

  const activeUsers = users.filter((u) => u.status === "active" || !u.status);
  const pendingUsers = users.filter((u) => u.status === "pending");
  const suspendedUsers = users.filter((u) => u.status === "suspended");

  const filtered = (tab === "active" ? activeUsers : tab === "pending" ? pendingUsers : suspendedUsers).filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.matric_number ?? "").toLowerCase().includes(q)
    );
  });

  const handleApprove = async (u: User) => {
    const role = roleOverride[u.id] ?? u.role;
    setApprovingId(u.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await approveUser(u.id, role);
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
            await rejectUser(u.id);
            setRejectingId(null);
          },
        },
      ]
    );
  };

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: activeUsers.length },
    { key: "pending", label: "Pending", count: pendingUsers.length },
    { key: "suspended", label: "Suspended", count: suspendedUsers.length },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Accounts</Text>
        {pendingUsers.length > 0 && (
          <View style={[styles.pendingBadge, { backgroundColor: "#F59E0B" }]}>
            <Text style={styles.pendingBadgeText}>{pendingUsers.length} pending</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
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
                { backgroundColor: t.key === "pending" ? "#FEF3C7" : colors.secondary },
              ]}>
                <Text style={[
                  styles.tabCountText,
                  { color: t.key === "pending" ? "#92400E" : colors.primary },
                ]}>
                  {t.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

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
        {filtered.length === 0 ? (
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
              {filtered.length} account{filtered.length !== 1 ? "s" : ""}
            </Text>

            {filtered.map((u) => (
              <View
                key={u.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* User info row */}
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

                {/* Pending: role picker + actions */}
                {tab === "pending" && (
                  <View style={[styles.pendingActions, { borderTopColor: colors.border }]}>
                    {/* Role override picker */}
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

                    {/* Approve / Reject buttons */}
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
        )}
      </ScrollView>

      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pendingBadgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
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
