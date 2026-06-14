import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { UserRole } from "@/lib/demoData";

const ROLE_ICONS: Record<UserRole, string> = { admin: "shield", lecturer: "briefcase", student: "user" };
const ROLE_COLORS: Record<UserRole, string> = { admin: "#7C3AED", lecturer: "#10B981", student: "#3B82F6" };

export default function AdminAccounts() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { users } = useData();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.matric_number ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Accounts</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Feather name="user-plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name, email, matric..."
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {(["all", "student", "lecturer", "admin"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.filterChip,
                roleFilter === r
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => setRoleFilter(r)}
            >
              <Text style={[styles.filterText, { color: roleFilter === r ? "#fff" : colors.mutedForeground }]}>
                {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1) + "s"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{filtered.length} user{filtered.length !== 1 ? "s" : ""}</Text>
        {filtered.map((u) => (
          <View key={u.id} style={[styles.userRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[u.role] }]}>
              <Text style={styles.avatarText}>{u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.foreground }]}>{u.full_name}</Text>
              <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{u.email}</Text>
              {u.matric_number && (
                <Text style={[styles.userMatric, { color: colors.mutedForeground }]}>{u.matric_number} · {u.level}</Text>
              )}
            </View>
            <View>
              <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[u.role] + "20" }]}>
                <Feather name={ROLE_ICONS[u.role] as any} size={12} color={ROLE_COLORS[u.role]} />
                <Text style={[styles.roleText, { color: ROLE_COLORS[u.role] }]}>
                  {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  count: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  userMatric: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
