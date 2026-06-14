import React from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface Props {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 180 }: Props) {
  return (
    <View>
      <QRCode value={value} size={size} color="#1A0533" backgroundColor="#fff" />
    </View>
  );
}
