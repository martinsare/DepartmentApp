import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

export default function StudentLayout() {
  const colors = useColors();
  const { resolvedScheme } = useTheme();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 64,
          paddingBottom: isWeb ? 34 : 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={90} tint={resolvedScheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
        tabBarLabelStyle: { fontSize: 10, fontFamily: "Inter_500Medium" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Feather name="home" size={21} color={color} /> }} />
      <Tabs.Screen name="classes" options={{ title: "Classes", tabBarIcon: ({ color }) => <Feather name="calendar" size={21} color={color} /> }} />
      <Tabs.Screen name="attendance" options={{ title: "Attendance", tabBarIcon: ({ color }) => <Feather name="check-circle" size={21} color={color} /> }} />
      <Tabs.Screen name="contributions" options={{ title: "Payments", tabBarIcon: ({ color }) => <Feather name="credit-card" size={21} color={color} /> }} />
      <Tabs.Screen name="announcements" options={{ title: "Notices", tabBarIcon: ({ color }) => <Feather name="bell" size={21} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Feather name="user" size={21} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="report" options={{ href: null }} />
    </Tabs>
  );
}
