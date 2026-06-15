import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const PREFS_KEY = "notification_prefs";

interface NotifPrefs {
  announcements: boolean;
  classReminders: boolean;
  contributionDeadlines: boolean;
  urgentAlerts: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  announcements: true,
  classReminders: true,
  contributionDeadlines: true,
  urgentAlerts: true,
};

async function getPrefs(): Promise<NotifPrefs> {
  try {
    const val = await AsyncStorage.getItem(PREFS_KEY);
    if (val) return { ...DEFAULT_PREFS, ...JSON.parse(val) };
  } catch {}
  return DEFAULT_PREFS;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleAnnouncementNotification(
  title: string,
  body: string,
  type: "general" | "urgent" | "event" = "general"
): Promise<void> {
  if (Platform.OS === "web") return;
  const prefs = await getPrefs();
  const allowed = type === "urgent" ? prefs.urgentAlerts : prefs.announcements;
  if (!allowed) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {}
}

export async function scheduleClassReminderNotification(
  title: string,
  body: string
): Promise<void> {
  if (Platform.OS === "web") return;
  const prefs = await getPrefs();
  if (!prefs.classReminders) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {}
}

export async function scheduleContributionNotification(
  title: string,
  body: string
): Promise<void> {
  if (Platform.OS === "web") return;
  const prefs = await getPrefs();
  if (!prefs.contributionDeadlines) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {}
}
