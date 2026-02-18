import React, { ReactNode, useEffect } from "react";
import { StyleProp, ViewStyle, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

interface AnimatedRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: "box-none" | "box-only" | "none" | "auto";
  collapsable?: boolean;
}

export const AnimatedReveal: React.FC<AnimatedRevealProps> = ({
  children,
  delay = 0,
  duration = 500,
  style,
  pointerEvents = "box-none",
  collapsable = true,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[animatedStyle, style]}
      pointerEvents={pointerEvents}
      collapsable={collapsable}
    >
      {children}
    </Animated.View>
  );
};

// New: AnimatedStepTransition for left/right slide
interface AnimatedStepTransitionProps {
  children: ReactNode;
  direction: "left" | "right";
  duration?: number;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: "box-none" | "box-only" | "none" | "auto";
  collapsable?: boolean;
}

export const AnimatedStepTransition: React.FC<AnimatedStepTransitionProps> = ({
  children,
  direction,
  duration = 350,
  style,
  pointerEvents = "box-none",
  collapsable = true,
}) => {
  const screenWidth = Dimensions.get("window").width;
  const translateX = useSharedValue(
    direction === "right" ? screenWidth : -screenWidth
  );
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    translateX.value = withTiming(0, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration: duration - 100,
      easing: Easing.out(Easing.cubic),
    });
  }, [direction, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[animatedStyle, style]}
      pointerEvents={pointerEvents}
      collapsable={collapsable}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedReveal;
