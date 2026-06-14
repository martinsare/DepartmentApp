import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  onScanned: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanned, onClose }: Props) {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: "#111" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: "#111" }]}>
        <Feather name="camera-off" size={40} color="rgba(255,255,255,0.4)" />
        <Text style={styles.msg}>Camera permission required</Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={(result) => {
          onScanned(result.data);
        }}
      />
      <View style={styles.overlay}>
        <View style={[styles.frame, { borderColor: colors.primary }]} />
        <Text style={styles.hint}>Align QR code within the frame</Text>
      </View>
      <TouchableOpacity
        style={[styles.closeBtn, { backgroundColor: colors.primary }]}
        onPress={onClose}
      >
        <Feather name="x" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  msg: { color: "#fff", fontSize: 15, fontFamily: "Inter_500Medium", textAlign: "center" },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  frame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderRadius: 16,
  },
  hint: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontFamily: "Inter_400Regular" },
  closeBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
