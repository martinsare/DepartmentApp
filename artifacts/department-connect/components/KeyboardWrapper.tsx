import React from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

interface Props {
  children: React.ReactNode;
}

export function KeyboardWrapper({ children }: Props) {
  return <KeyboardProvider>{children}</KeyboardProvider>;
}
