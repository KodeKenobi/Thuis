import React, { ReactNode, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";

interface AnimatedCardTemplateProps {
  children: ReactNode;
  index: number;
}

const AnimatedCardTemplate: React.FC<AnimatedCardTemplateProps> = ({
  children,
  index,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(index * 50, withTiming(0, { duration: 200 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return <Animated.View style={[animatedStyle]}>{children}</Animated.View>;
};

export default AnimatedCardTemplate;
