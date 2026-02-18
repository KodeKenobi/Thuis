import React from "react";
import { ViewStyle } from "react-native";
import { ThemedView } from "./themed-view";
import { getBackgroundColor } from "@/utils";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

const Divider = ({
  style,
  direction = "horizontal",
}: {
  style?: ViewStyle;
  direction?: "horizontal" | "vertical";
}) => {
  const { colors: { grayishColor } } = useCorporateBranding();
  return (
    <ThemedView
      lightColor={getBackgroundColor(grayishColor, 0.15)}
      darkColor={getBackgroundColor(grayishColor, 0.15)}
      transparent={false}
      style={[
        {
          height: direction === "horizontal" ? 1 : "100%",
          width: direction === "horizontal" ? "100%" : 1,
          alignSelf: direction === "vertical" ? "stretch" : undefined,
        },
        style,
      ]}
    />
  );
};

export default Divider;
