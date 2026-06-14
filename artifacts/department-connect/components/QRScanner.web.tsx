import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  onScanned: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanned, onClose }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.wrap, { backgroundColor: "#111" }]}>
      <View style={[styles.box, { borderColor: colors.primary }]}>
        <Feather name="camera-off" size={48} color="rgba(255,255,255,0.4)" />
        <Text style={styles.msg}>Camera not available on web.</Text>
        <Text style={styles.sub}>Use the mobile app to scan QR codes.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  box: { borderWidth: 2, borderRadius: 20, padding: 40, alignItems: "center", gap: 14 },
  msg: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  sub: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});
