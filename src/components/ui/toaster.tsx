// ToastAlert.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Container } from "./container";
import { useTextStyles, ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

export interface ToastProps {
  type: "success" | "warning" | "error" | "custom";
  message: string;
  title?: string;
  toastId?: string;
  onPress?: (event: GestureResponderEvent) => void;
}

interface ToastAlertProps {
  toast: ToastProps;
}

const ToastAlert: React.FC<ToastAlertProps> = ({ toast }) => {
  const textStyles = useTextStyles();
  const {
    colors: {
      theme,
      toastSuccessColor,
      toastWarningColor,
      toastErrorColor,
      warningColor,
      errorColor,
      successColor,
      text,
    },
  } = useCorporateBranding();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = React.useState(true);

  useEffect(() => {
    setIsVisible(true);

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Safety: Always disable touches after short time (handles swipe dismiss)
    const safetyTimeout = setTimeout(() => {
      setIsVisible(false);
    }, 1000);

    // Fade out (for auto-hide)
    const fadeTimeout = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After animation completes, disable touch events
        setIsVisible(false);
      });
    }, 3200);

    return () => {
      clearTimeout(safetyTimeout);
      clearTimeout(fadeTimeout);
    };
  }, [fadeAnim, toast.toastId]);

  const iconName =
    toast.type === "warning"
      ? "warning"
      : toast.type === "error"
        ? "alert-circle"
        : "checkmark-circle";

  const backgroundColor =
    toast.type === "success"
      ? toastSuccessColor
      : toast.type === "warning"
        ? toastWarningColor
        : toastErrorColor;

  const iconColor =
    toast.type === "warning"
      ? warningColor
      : toast.type === "error"
        ? errorColor
        : successColor;

  const pressableStyle = ({
    pressed,
  }: {
    pressed: boolean;
  }): StyleProp<ViewStyle> => [styles.pressable, pressed && styles.pressed];

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { top: insets.top + 10, opacity: fadeAnim },
        Platform.OS === "ios" ? styles.iosShadow : styles.androidElevation,
      ]}
      pointerEvents={isVisible ? "box-none" : "none"}
      collapsable={false}
    >
      <Pressable
        onPress={toast.onPress}
        disabled={!toast.onPress || !isVisible}
        android_ripple={{ color: iconColor, radius: 200 }}
        style={pressableStyle}
        pointerEvents={isVisible ? "auto" : "none"}
      >
        <ThemedView style={styles.blurParent} transparent>
          <BlurView
            intensity={80}
            tint={theme === "light" ? "light" : "dark"}
            style={[styles.toastContainer, { backgroundColor }]}
            {...(Platform.OS === "android"
              ? { experimentalBlurMethod: "dimezisBlurView" }
              : {})}
            key={toast.toastId}
          >
            <Container
              direction="horizontal"
              align="center"
              gap={8}
              style={{ flex: 1 }}
            >
              {toast?.type !== "custom" && (
                <Ionicons name={iconName} size={20} color={iconColor} />
              )}
              <Container
                direction="vertical"
                justify="center"
                gap={2}
                style={{ flexShrink: 1 }}
              >
                {toast.title && (
                  <ThemedText
                    {...textStyles.subtitle}
                    lightColor={text}
                    darkColor={text}
                    selectable
                  >
                    {toast.title}
                  </ThemedText>
                )}
                {toast?.message && (
                  <ThemedText
                    {...textStyles.body}
                    lightColor={text}
                    darkColor={text}
                    selectable
                  >
                    {toast.message}
                  </ThemedText>
                )}
              </Container>
            </Container>
          </BlurView>
        </ThemedView>
      </Pressable>
    </Animated.View>
  );
};

export default ToastAlert;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignItems: "center",
    zIndex: 100000,
    alignSelf: "center",
  },
  iosShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  androidElevation: {
    elevation: 2,
  },
  pressable: {
    borderRadius: 20,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.75,
  },
  blurParent: {
    borderRadius: 20,
    overflow: "hidden",
  },
  toastContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: "100%",
    width: "auto",
  },
});
