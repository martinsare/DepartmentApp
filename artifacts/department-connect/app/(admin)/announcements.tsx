import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { AnnouncementDetailModal } from "@/components/AnnouncementDetailModal";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { Announcement } from "@/lib/types";

const TYPES: Announcement["type"][] = ["general", "assignment", "test", "emergency"];
const TYPE_COLORS: Record<Announcement["type"], string> = {
  general: "#3B82F6",
  assignment: "#10B981",
  test: "#F59E0B",
  emergency: "#EF4444",
};
const FILTERS = ["all", "general", "assignment", "test", "emergency"] as const;
type Filter = (typeof FILTERS)[number];

export default function AdminAnnouncements() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { announcements, addAnnouncement, markAnnouncementRead } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState({ title: "", body: "", type: "general" as Announcement["type"] });
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  const filtered = filter === "all" ? announcements : announcements.filter((a) => a.type === filter);
  const unreadCount = announcements.filter((a) => !a.read).length;

  const handlePost = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    const ann: Announcement = {
      id: `ann-${Date.now()}`,
      author_id: user?.id ?? "",
      author_name: user?.full_name ?? "",
      role: "admin",
      title: form.title,
      body: form.body,
      type: form.type,
      department_id: user?.department_id ?? "",
      created_at: new Date().toISOString(),
      read: false,
    };
    addAnnouncement(ann);
    setSaving(false);
    setModalOpen(false);
    setForm({ title: "", body: "", type: "general" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.background }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Announcements</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setModalOpen(true); }}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.mutedForeground }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bell-off" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No announcements</Text>
          </View>
        ) : (
          filtered.map((ann) => (
            <AnnouncementCard
              key={ann.id}
              announcement={ann}
              onPress={() => { markAnnouncementRead(ann.id); setSelectedAnn(ann); }}
            />
          ))
        )}
      </ScrollView>

      <AnnouncementDetailModal announcement={selectedAnn} onClose={() => setSelectedAnn(null)} />

      {/* Create modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Announcement</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
            {/* Type picker */}
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Type</Text>
              <View style={styles.typePicker}>
                {TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, form.type === t ? { backgroundColor: TYPE_COLORS[t] } : { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}
                    onPress={() => setForm((f) => ({ ...f, type: t }))}
                  >
                    <Text style={[styles.typeChipText, { color: form.type === t ? "#fff" : colors.mutedForeground }]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Announcement title"
                placeholderTextColor={colors.mutedForeground}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              />
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Write your announcement..."
                placeholderTextColor={colors.mutedForeground}
                value={form.body}
                onChangeText={(v) => setForm((f) => ({ ...f, body: v }))}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: !form.title.trim() || !form.body.trim() ? 0.5 : 1 }]}
              onPress={handlePost}
              disabled={saving || !form.title.trim() || !form.body.trim()}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Post Announcement</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  badge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  filtersScroll: { maxHeight: 44 },
  filtersContent: { paddingHorizontal: 20, gap: 8, alignItems: "center", paddingRight: 20 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  modal: { flex: 1, paddingHorizontal: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  typePicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  typeChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  textArea: { minHeight: 120, paddingTop: 12 },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
