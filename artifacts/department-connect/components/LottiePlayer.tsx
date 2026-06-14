import LottieView from "lottie-react-native";
import React, { useRef, useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

type LottieAsset = "success" | "loading" | "empty";

const SOURCES: Record<LottieAsset, any> = {
  success: require("@/assets/lottie/success.json"),
  loading: require("@/assets/lottie/loading.json"),
  empty: require("@/assets/lottie/empty.json"),
};

interface LottiePlayerProps {
  animation: LottieAsset;
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  style?: ViewStyle;
  speed?: number;
}

export function LottiePlayer({
  animation,
  size = 120,
  loop = true,
  autoPlay = true,
  style,
  speed = 1,
}: LottiePlayerProps) {
  const ref = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay) ref.current?.play();
  }, [autoPlay]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <LottieView
        ref={ref}
        source={SOURCES[animation]}
        loop={loop}
        autoPlay={autoPlay}
        speed={speed}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
