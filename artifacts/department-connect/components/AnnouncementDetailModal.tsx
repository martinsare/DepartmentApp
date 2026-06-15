import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Announcement } from "@/lib/types";

const TYPE_CONFIG: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  general:    { bg: "#EDE9FE", text: "#5B21B6", icon: "info",           label: "General" },
  assignment: { bg: "#DBEAFE", text: "#1D4ED8", icon: "file-text",      label: "Assignment" },
  test:       { bg: "#FEF3C7", text: "#92400E", icon: "edit-2",         label: "Test" },
  emergency:  { bg: "#FEE2E2", text: "#991B1B", icon: "alert-triangle", label: "Emergency" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  announcement: Announcement | null;
  onClose: () => void;
}

export function AnnouncementDetailModal({ announcement, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const cfg = announcement ? (TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG["general"]!) : null;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={!!announcement}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {announcement && cfg && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type badge */}
              <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
                <Feather name={cfg.icon} size={13} color={cfg.text} />
                <Text style={[styles.typeText, { color: cfg.text }]}>{cfg.label}</Text>
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.foreground }]}>{announcement.title}</Text>

              {/* Meta */}
              <View style={styles.metaRow}>
                <Feather name="user" size={13} color={colors.mutedForeground} />
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>{announcement.author_name}</Text>
                <View style={[styles.dot, { backgroundColor: colors.border }]} />
                <Feather name="clock" size={13} color={colors.mutedForeground} />
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>{formatDate(announcement.created_at)}</Text>
              </View>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Full body */}
              <Text style={[styles.body, { color: colors.foreground }]}>{announcement.body}</Text>
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.primary }]}
            onPress={handleClose}
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
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
    maxHeight: "80%",
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  typeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 28, marginBottom: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 16 },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  dot: { width: 4, height: 4, borderRadius: 2 },
  divider: { height: 1, marginBottom: 16 },
  body: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24, marginBottom: 24 },
  closeBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  closeBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
