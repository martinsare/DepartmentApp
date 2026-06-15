import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface Prefs {
  announcements: boolean;
  classReminders: boolean;
  contributionDeadlines: boolean;
  urgentAlerts: boolean;
}

const DEFAULT_PREFS: Prefs = {
  announcements: true,
  classReminders: true,
  contributionDeadlines: true,
  urgentAlerts: true,
};

const STORAGE_KEY = "notification_prefs";

export function NotificationPrefsModal({ visible, onClose }: Props) {
  const colors = useColors();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(STORAGE_KEY).then((val) => {
        if (val) {
          try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(val) }); } catch {}
        }
      });
    }
  }, [visible]);

  const toggle = (key: keyof Prefs) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const ITEMS: { key: keyof Prefs; icon: string; label: string; desc: string }[] = [
    {
      key: "announcements",
      icon: "bell",
      label: "Announcements",
      desc: "Get notified when new announcements are posted",
    },
    {
      key: "classReminders",
      icon: "calendar",
      label: "Class Reminders",
      desc: "Reminders before scheduled class sessions",
    },
    {
      key: "contributionDeadlines",
      icon: "credit-card",
      label: "Contribution Deadlines",
      desc: "Alerts when payment deadlines are approaching",
    },
    {
      key: "urgentAlerts",
      icon: "alert-triangle",
      label: "Urgent Alerts",
      desc: "High-priority notices from your department",
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Choose which notifications you'd like to receive. Changes are saved automatically.
          </Text>

          {ITEMS.map((item, i) => (
            <View
              key={item.key}
              style={[
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  marginBottom: i === ITEMS.length - 1 ? 0 : 10,
                },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: prefs[item.key] ? colors.primary + "18" : colors.muted }]}>
                <Feather
                  name={item.icon as any}
                  size={18}
                  color={prefs[item.key] ? colors.primary : colors.mutedForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
              </View>
              <Switch
                value={prefs[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: colors.border, true: colors.primary + "60" }}
                thumbColor={prefs[item.key] ? colors.primary : colors.mutedForeground}
              />
            </View>
          ))}

          <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="info" size={14} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              You must also allow notifications for this app in your phone's system settings.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  body: { paddingHorizontal: 24, paddingTop: 24 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  rowDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
