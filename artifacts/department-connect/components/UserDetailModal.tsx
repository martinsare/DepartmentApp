import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { User } from "@/lib/demoData";

const ROLE_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  admin:    { color: "#7C3AED", icon: "shield",    label: "Admin" },
  lecturer: { color: "#10B981", icon: "briefcase", label: "Lecturer" },
  student:  { color: "#3B82F6", icon: "user",      label: "Student" },
};

interface Row { icon: any; label: string; value: string }

interface Props {
  user: User | null;
  onClose: () => void;
}

export function UserDetailModal({ user, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const cfg = user ? (ROLE_CONFIG[user.role] ?? ROLE_CONFIG["student"]!) : null;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const rows: Row[] = user
    ? [
        { icon: "mail",       label: "Email",         value: user.email },
        ...(user.matric_number ? [{ icon: "hash" as any,       label: "Matric No.", value: user.matric_number }] : []),
        ...(user.level         ? [{ icon: "layers" as any,     label: "Level",      value: user.level }] : []),
        ...(user.phone         ? [{ icon: "phone" as any,      label: "Phone",      value: user.phone }] : []),
        { icon: "building",   label: "Department",    value: "Computer Science" },
      ]
    : [];

  return (
    <Modal
      visible={!!user}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {user && cfg && (
            <>
              {/* Avatar + name */}
              <View style={styles.heroRow}>
                <View style={[styles.avatar, { backgroundColor: cfg.color }]}>
                  <Text style={styles.avatarText}>
                    {user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{user.full_name}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: cfg.color + "18" }]}>
                    <Feather name={cfg.icon} size={12} color={cfg.color} />
                    <Text style={[styles.roleText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              </View>

              {/* Detail rows */}
              <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {rows.map((r, i) => (
                  <View
                    key={r.label}
                    style={[
                      styles.detailRow,
                      i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={styles.detailLeft}>
                      <Feather name={r.icon} size={14} color={cfg.color} />
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                      {r.value}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.primary }]}
                onPress={handleClose}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  name: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 6 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  detailCard: { borderRadius: 16, borderWidth: 1, marginBottom: 18, overflow: "hidden" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", maxWidth: "55%", textAlign: "right" },
  closeBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  closeBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
