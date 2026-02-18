import React from "react";
import { ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { SIZES } from "@/constants";
import { useTextStyles, ThemedText } from "./themed-text";
import { Container } from "./container";

interface UpdateDownloadIndicatorProps {
  visible: boolean;
}

export const UpdateDownloadIndicator: React.FC<
  UpdateDownloadIndicatorProps
> = ({ visible }) => {
  const textStyles = useTextStyles();
  const { colors: { background, primary, grayishColor } } = useCorporateBranding();
  const { bottom } = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  return (
    <Container
      justify="center"
      align="center"
      gap={8}
      direction="horizontal"
      style={[
        {
          backgroundColor: background,
          borderTopColor: grayishColor,
          borderTopWidth: StyleSheet.hairlineWidth,
          bottom: Platform.OS === "android" ? bottom : 0,
          paddingVertical: SIZES.padding / 2,
          paddingHorizontal: SIZES.padding,
          zIndex: 1000,
          position: "absolute",
          left: 0,
          right: 0,
        },
      ]}
    >
      <ActivityIndicator size="small" color={primary} />
      <ThemedText {...textStyles.gray}>Update wordt gedownload...</ThemedText>
    </Container>
  );
};
