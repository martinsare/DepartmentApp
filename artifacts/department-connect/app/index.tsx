import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
// ActivityIndicator replaced by LottiePlayer
import { LottiePlayer } from "@/components/LottiePlayer";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function Index() {
  const { user, loading } = useAuth();
  const colors = useColors();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("dc_onboarded").then((v) => setOnboarded(!!v));
  }, []);

  if (loading || onboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <LottiePlayer animation="loading" size={100} loop />
      </View>
    );
  }

  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!user) return <Redirect href="/login" />;
  if (user.role === "admin") return <Redirect href="/(admin)/" />;
  if (user.role === "lecturer") return <Redirect href="/(lecturer)/" />;
  return <Redirect href="/(student)/" />;
}
