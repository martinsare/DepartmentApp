import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function AdminLayout() {
  const colors = useColors();
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
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : undefined,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
        tabBarLabelStyle: { fontSize: 10, fontFamily: "Inter_500Medium", marginBottom: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> }} />
      <Tabs.Screen name="accounts" options={{ title: "Accounts", tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} /> }} />
      <Tabs.Screen name="courses" options={{ title: "Courses", tabBarIcon: ({ color }) => <Feather name="book-open" size={22} color={color} /> }} />
      <Tabs.Screen name="contributions" options={{ title: "Finance", tabBarIcon: ({ color }) => <Feather name="dollar-sign" size={22} color={color} /> }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics", tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={22} color={color} /> }} />
    </Tabs>
  );
}
