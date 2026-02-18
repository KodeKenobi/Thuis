import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Animated,
  Easing,
} from "react-native";
import Avatar, { AvatarVariant } from "./avatar";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { ThemedText, useTextStyles } from "./themed-text";
import { Button } from "./button"; // path to your Button component

interface EmptyDataProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode | string;
  variant?: AvatarVariant;
  size?: number;
  style?: StyleProp<ViewStyle>;
  animate?: boolean;
  actionText?: string;
  actionPress?: () => void;
  renderAction?: React.ReactNode;
}

// Simplified icon mapping
const ICONS: Record<string, string> = {
  blue: "information-circle-outline",
  gray: "help-circle-outline",
  green: "checkmark-circle-outline",
  red: "close-circle-outline",
  yellow: "warning-outline",
  custom: "image-outline",
  default: "information-circle-outline",
  error: "close-circle-outline",
  success: "checkmark-circle-outline",
  warning: "warning-outline",
};

export type { EmptyDataProps };
export const EmptyData: React.FC<EmptyDataProps> = ({
  title = "Geen gegevens beschikbaar",
  description = "Er is hier nog niets om weer te geven",
  icon,
  variant = "blue",
  size = 50,
  style,
  animate = true,
  actionText = "Opnieuw proberen",
  actionPress,
  renderAction,
}) => {
  const textStyles = useTextStyles();
  const { colors: { text, grayishColor } } = useCorporateBranding();
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  // text slide + fade values
  const textTranslate = React.useRef(new Animated.Value(20)).current;
  const textOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;

    // Avatar pop, container fade, and text slide+fade all start together
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(textTranslate, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animate, scaleAnim, opacityAnim, textTranslate, textOpacity]);

  // Get icon based on variant
  const getIcon = () => {
    if (icon) return icon;
    return ICONS[variant] || ICONS.default;
  };

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }, style]}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      >
        <Avatar
          variant={variant}
          size={size}
          icon={getIcon()}
          iconSize={0.5}
          shape="rounded"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }],
          },
        ]}
      >
        <ThemedText
          style={styles.title}
          {...textStyles.title}
          lightColor={text}
          darkColor={text}
          selectable
        >
          {title}
        </ThemedText>
        <ThemedText
          style={styles.description}
          {...textStyles.body}
          lightColor={grayishColor}
          darkColor={grayishColor}
          selectable
        >
          {description}
        </ThemedText>

        <View style={styles.button}>
          {actionText && actionPress ? (
            <Button variant="link" title={actionText} onPress={actionPress} />
          ) : (
            renderAction
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  textContainer: {
    marginTop: 16,
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 16,
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
    width: "100%",
  },
  button: {
    marginTop: 16,
  },
});
