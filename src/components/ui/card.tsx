import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import React, { ReactNode } from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Container, ContainerProps } from "./container";

export type CardVariant =
  | "default"
  | "background"
  | "outline"
  | "list"
  | "grayish";

export type CardProps = ContainerProps & {
  variant?: CardVariant;
  children?: ReactNode;
  disabled?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  showRipple?: boolean;
  leftSwipe?: React.ReactNode;
  rightSwipe?: React.ReactNode;
  swipeBgColor?: string;
  active?: boolean;
};

const Card = ({
  children,
  variant = "default",
  disabled,
  onPress,
  onLongPress,
  showRipple,
  leftSwipe,
  rightSwipe,
  swipeBgColor = "",
  active,
  ...rest
}: CardProps) => {
  const {
    colors: { cardBg, grayishColor, primary, background, secondary },
  } = useCorporateBranding();
  const borderRadius = 12;

  let cardStyle: StyleProp<ViewStyle> = {
    borderRadius,
    opacity: disabled ? 0.5 : 1,
    maxWidth: "100%",
    overflow: "hidden",
    ...StyleSheet.flatten(rest?.style),
  };

  if (variant === "background") {
    cardStyle = {
      ...cardStyle,
      backgroundColor: cardBg,
      padding: 16,
    };
  } else if (variant === "grayish") {
    cardStyle = {
      ...cardStyle,
      backgroundColor: background,
      padding: 16,
    };
  } else if (variant === "outline") {
    cardStyle = {
      ...cardStyle,
      backgroundColor: "transparent",
      borderColor: grayishColor,
      borderWidth: 1,
      padding: 16,
    };
  } else if (variant === "list") {
    cardStyle = {
      ...cardStyle,
      backgroundColor: cardBg,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 0,
      borderBottomWidth: 1,
      borderBottomColor: grayishColor,
    };
  } else {
    // default: no bg, no border, no padding unless supplied
    cardStyle = {
      ...cardStyle,
    };
  }

  if (active) {
    cardStyle = {
      ...cardStyle,
      borderColor: primary,
      borderWidth: 1,
      backgroundColor: secondary,
      padding: 16,
    };
  }

  const content = (
    <Container {...rest} style={[cardStyle, rest?.style]}>
      {children}
    </Container>
  );

  let wrapped = content;

  if (onPress) {
    wrapped = <TouchableOpacity onPress={onPress}>{wrapped}</TouchableOpacity>;
  }

  // Custom swipeable logic using Reanimated and PanGestureHandler
  if (leftSwipe || rightSwipe) {
    function RightAction(prog: SharedValue<number>, drag: SharedValue<number>) {
      const [contentWidth, setContentWidth] = React.useState(100); // fallback
      const styleAnimation = useAnimatedStyle(() => {
        return {
          transform: [{ translateX: drag.value + contentWidth }],
        };
      });
      return (
        <Reanimated.View
          style={styleAnimation}
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
        >
          {rightSwipe}
        </Reanimated.View>
      );
    }

    function LeftAction(prog: SharedValue<number>, drag: SharedValue<number>) {
      const [contentWidth, setContentWidth] = React.useState(100); // fallback
      const styleAnimation = useAnimatedStyle(() => {
        return {
          transform: [{ translateX: drag.value - contentWidth }],
        };
      });
      return (
        <Reanimated.View
          style={styleAnimation}
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
        >
          {leftSwipe}
        </Reanimated.View>
      );
    }

    wrapped = (
      <GestureHandlerRootView>
        <ReanimatedSwipeable
          containerStyle={{
            backgroundColor: swipeBgColor,
          }}
          friction={2}
          enableTrackpadTwoFingerGesture
          rightThreshold={60}
          leftThreshold={60}
          renderRightActions={RightAction}
          renderLeftActions={LeftAction}
        >
          {wrapped}
        </ReanimatedSwipeable>
      </GestureHandlerRootView>
    );
  }

  return wrapped;
};

export default Card;
