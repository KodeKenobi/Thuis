import { useTheme } from "@/contexts/theme-context";
import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";

type SkeletonDimension = number | "auto" | `${number}%`;

interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  duration?: number;
  width?: SkeletonDimension;
  height?: SkeletonDimension;
}

const Skeleton: React.FC<SkeletonProps> = ({
  style,
  backgroundColor, // Tailwind's bg-black/5 equivalent
  duration = 1000,
  height = "auto",
  width = "auto",
}) => {
  const { theme } = useTheme();
  const actualBackgroundColor =
    backgroundColor || theme === "dark"
      ? "rgba(255,255,255,0.05)"
      : "rgba(0,0,0,0.05)";
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite repetition
      true // Reverse direction
    );

    return () => cancelAnimation(opacity);
  }, [duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: actualBackgroundColor,
          height,
          width,
          borderRadius: 8,
        },
        style,
        animatedStyle,
      ]}
    />
  );
};

export default Skeleton;
