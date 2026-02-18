import React, { ReactNode } from "react";
import { ViewProps, StyleProp, ViewStyle } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";

type Direction = "horizontal" | "vertical";
type JustifyContent =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly";
type AlignItems = "flex-start" | "flex-end" | "center" | "stretch" | "baseline";

export interface ContainerProps extends ViewProps {
  direction?: Direction;
  justify?: JustifyContent;
  align?: AlignItems;
  gap?: number;
  wrap?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  flex?: number;
}

export function Container({
  direction = "vertical",
  justify = "flex-start",
  align = "stretch",
  gap = 0,
  wrap = false,
  children,
  style,
  flex,
  ...props
}: ContainerProps) {
  const containerStyle: StyleProp<ViewStyle> = [
    {
      flexDirection: direction === "horizontal" ? "row" : "column",
      justifyContent: justify,
      alignItems: align,
      flexWrap: wrap ? "wrap" : "nowrap",
      gap,
      flex,
      maxWidth: "100%",
    },
    style,
  ];

  return (
    <ThemedView transparent style={containerStyle} {...props}>
      {children}
    </ThemedView>
  );
}
