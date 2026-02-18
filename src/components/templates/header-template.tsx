import { SIZES } from "@/constants";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import React, { ReactNode, useEffect } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderTemplateProps {
  headerStyle?: StyleProp<ViewStyle>;
  headerContainerStyle?: ViewStyle;
  addStatusBarPadding?: boolean;
  minHeight?: "auto" | number;
  children?: ReactNode;
}

export const HeaderTemplate = ({
  children,
  headerStyle,
  addStatusBarPadding = true,
  headerContainerStyle,
  minHeight = "auto",
}: HeaderTemplateProps) => {
  const { top } = useSafeAreaInsets();
  const { colors: { theme, background, white } } = useCorporateBranding();

  const animatedHeight = useSharedValue<number | "auto">(minHeight);

  useEffect(() => {
    if (minHeight !== "auto") {
      animatedHeight.value = withTiming(minHeight, { duration: 300 });
    }
  }, [minHeight]);

  const animatedStyle = useAnimatedStyle(() => {
    return minHeight === "auto"
      ? {}
      : {
          minHeight: animatedHeight.value,
        };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: "100%",
          maxWidth: "100%",
          paddingTop: addStatusBarPadding ? top : 0,
          backgroundColor: theme === "light" ? white : background,
        },
        animatedStyle,
        headerContainerStyle,
      ]}
    >
      <View
        style={[
          styles.headerContainer,
          {
            paddingHorizontal: SIZES.padding,
            width: "100%",
            maxWidth: "100%",
          },
          headerStyle,
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // zIndex: 10,
    justifyContent: "flex-end",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
});
