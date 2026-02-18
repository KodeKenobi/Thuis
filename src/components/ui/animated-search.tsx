import React, { useState, useRef, useEffect } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
  TextInput,
  BackHandler,
  NativeEventSubscription,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Input } from "./input"; // your existing Input component
import { SIZES } from "@/constants";
import { Container } from "./container";
import { ThemedText } from "./themed-text";

interface AnimatedSearchProps {
  onCancel?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onChangeText?: (text: string) => void;
  value?: string;
  height?: number | `${number}%` | "auto";
  placeholder?: string;
}

export const AnimatedSearch: React.FC<AnimatedSearchProps> = ({
  onCancel,
  onFocus,
  onBlur,
  onChangeText,
  value,
  height = 42.5,
  placeholder = "Typ hier om te zoeken",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [container, setContainer] = useState({ width: 0, height: 0 });
  const animation = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const backSub = useRef<NativeEventSubscription | null>(null);
  const screenWidth = SIZES.viewport.width;

  // faster animation
  const animateTo = (toValue: number, callback?: () => void) => {
    Animated.timing(animation, {
      toValue,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(callback);
  };

  useEffect(() => {
    if (isExpanded) {
      animateTo(1, () => {
        setTimeout(() => inputRef.current?.focus(), 50);
      });
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded) {
      backSub.current = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          handleCancel();
          return true;
        }
      );
    }
    return () => {
      backSub.current?.remove();
      backSub.current = null;
    };
  }, [isExpanded]);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    setContainer({
      width: e.nativeEvent.layout.width - 82,
      height: e.nativeEvent.layout.height,
    });
  };

  const inputWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, container?.width],
  });

  const cancelOpacity = animation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 0, 1],
  });
  const cancelTranslateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });

  const handleFocus = () => {
    setIsExpanded(true);
    onFocus?.();
  };

  const handleCancel = () => {
    animateTo(0, () => {
      setIsExpanded(false);
      onChangeText?.("");
      onCancel?.();
    });
  };

  return (
    <Container
      direction="horizontal"
      align="center"
      justify="space-between"
      style={[
        styles.container,
        {
          width: screenWidth,
          maxWidth: screenWidth,
          height,
        },
      ]}
      onLayout={handleContainerLayout}
    >
      {/* back button on the left */}
      <Animated.View
        style={{
          opacity: cancelOpacity,
          transform: [{ translateX: cancelTranslateX }],
        }}
      >
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.backButton}
          testID="back-button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ThemedText style={styles.backIcon}>{"\u2039"}</ThemedText>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View style={[styles.inputContainer, { width: inputWidth }]}>
        <Input
          ref={inputRef}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={onBlur}
          autoFocus
          onChangeText={onChangeText}
          value={value}
          icon={<Ionicons name="search" size={20} color="gray" />}
          style={styles.inputInner}
        />
      </Animated.View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    zIndex: 2,
    paddingHorizontal: SIZES.padding,
  },
  backButton: {
    paddingHorizontal: SIZES.padding,
    height: "100%",
    justifyContent: "center",
    marginLeft: -SIZES.padding * 2,
  },
  backIcon: {
    fontSize: 30,
    lineHeight: 34,
  },
  inputContainer: {
    overflow: "hidden",
    marginRight: SIZES.padding * 2,
    // backgroundColor: "red",
  },
  inputInner: {
    flex: 1,
  },
});
