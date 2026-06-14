import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { User, UserRole } from "@/lib/demoData";

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#7C3AED",
  lecturer: "#10B981",
  student: "#3B82F6",
};
const ROLE_ICONS: Record<UserRole, string> = {
  admin: "shield",
  lecturer: "briefcase",
  student: "user",
};
const LEVELS = ["100L", "200L", "300L", "400L", "500L"];

export default function AdminAccounts() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { users } = useData();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<"student" | "lecturer">("student");
  const [form, setForm] = useState({ full_name: "", email: "", matric_number: "", level: "200L", phone: "" });
  const [saving, setSaving] = useState(false);
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const topPad = insets.top;

  const filtered = localUsers.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.matric_number ?? "").toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const handleCreate = async () => {
    if (!form.full_name.trim() || !form.email.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    const newUser: User = {
      id: `user-${Date.now()}`,
      role: newRole,
      full_name: form.full_name,
      email: form.email,
      matric_number: newRole === "student" ? form.matric_number : undefined,
      level: newRole === "student" ? form.level : undefined,
      phone: form.phone || undefined,
      department_id: "dept-001",
    };
    setLocalUsers((prev) => [newUser, ...prev]);
    setSaving(false);
    setModalOpen(false);
    setForm({ full_name: "", email: "", matric_number: "", level: "200L", phone: "" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Accounts</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalOpen(true)}
        >
          <Feather name="user-plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search + filter */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <View
          style={[
            styles.searchWrap,
            { borderColor: colors.border, backgroundColor: colors.muted },
          ]}
        >
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10 }}
        >
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
              <Text
                style={[
                  styles.filterText,
                  { color: roleFilter === r ? "#fff" : colors.mutedForeground },
                ]}
              >
                {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1) + "s"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {filtered.length} account{filtered.length !== 1 ? "s" : ""}
        </Text>
        {filtered.map((u) => (
          <View
            key={u.id}
            style={[
              styles.userRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.avatar, { backgroundColor: ROLE_COLORS[u.role] }]}
            >
              <Text style={styles.avatarText}>
                {u.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.foreground }]}>
                {u.full_name}
              </Text>
              <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                {u.email}
              </Text>
              {u.matric_number && (
                <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>
                  {u.matric_number}
                  {u.level ? ` · ${u.level}` : ""}
                </Text>
              )}
            </View>
            <View>
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: ROLE_COLORS[u.role] + "20" },
                ]}
              >
                <Feather
                  name={ROLE_ICONS[u.role] as any}
                  size={12}
                  color={ROLE_COLORS[u.role]}
                />
                <Text style={[styles.roleText, { color: ROLE_COLORS[u.role] }]}>
                  {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Create account modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              Create Account
            </Text>

            {/* Role toggle */}
            <View style={[styles.roleToggle, { backgroundColor: colors.muted }]}>
              {(["student", "lecturer"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleToggleBtn,
                    newRole === r && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setNewRole(r)}
                >
                  <Feather
                    name={ROLE_ICONS[r] as any}
                    size={14}
                    color={newRole === r ? "#fff" : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.roleToggleText,
                      { color: newRole === r ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fields */}
            {[
              { key: "full_name", label: "Full Name", placeholder: "e.g. Kwame Asante" },
              { key: "email", label: "Email", placeholder: "e.g. kwame@dept.edu" },
              ...(newRole === "student"
                ? [
                    { key: "matric_number", label: "Matric Number", placeholder: "e.g. CS/24/010" },
                  ]
                : []),
              { key: "phone", label: "Phone (optional)", placeholder: "+233 55 000 0000" },
            ].map(({ key, label, placeholder }) => (
              <View key={key} style={{ marginBottom: 12 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  {label}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted },
                  ]}
                  placeholder={placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={(form as any)[key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  keyboardType={key === "email" ? "email-address" : "default"}
                  autoCapitalize={key === "email" ? "none" : "words"}
                />
              </View>
            ))}

            {/* Level picker for students */}
            {newRole === "student" && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Level
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {LEVELS.map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.levelChip,
                        form.level === lvl
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, level: lvl }))}
                    >
                      <Text
                        style={[
                          styles.levelText,
                          { color: form.level === lvl ? "#fff" : colors.mutedForeground },
                        ]}
                      >
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View
              style={[
                styles.infoBox,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
            >
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                An invite email will be sent to the account holder with login credentials.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 },
              ]}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="user-plus" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    Create {newRole.charAt(0).toUpperCase() + newRole.slice(1)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => setModalOpen(false)}
              disabled={saving}
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
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
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  count: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
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
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 20 },
  roleToggle: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  roleToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  roleToggleText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  levelChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  levelText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  infoBox: {
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
