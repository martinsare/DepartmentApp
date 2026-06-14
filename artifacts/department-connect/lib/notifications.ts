import { Platform } from "react-native";

// expo-notifications remote push was removed from Expo Go SDK 53.
// Use a lazy require inside try/catch so the module-level throw is catchable.
let _notif: typeof import("expo-notifications") | null = null;
try {
  _notif = require("expo-notifications");
  _notif?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // silently skip — Expo Go or web
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web" || !_notif) return false;
  try {
    const { status: existing } = await _notif.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await _notif.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleAnnouncementNotification(
  title: string,
  body: string
): Promise<void> {
  if (Platform.OS === "web" || !_notif) return;
  try {
    await _notif.scheduleNotificationAsync({
      content: { title: `📢 ${title}`, body, sound: true },
      trigger: null,
    });
  } catch {
    // silently fail
  }
}
