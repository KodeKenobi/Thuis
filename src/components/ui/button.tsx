
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import * as Font from "expo-font";
import React, { forwardRef, useMemo } from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?:
    | "primary"
    | "outlined"
    | "secondary"
    | "text"
    | "link"
    | "flat"
    | "gray";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  textColor?: "link" | "gray" | "foreground" | "white";
  fontWeight?: "bold" | "regular";
  style?: StyleProp<ViewStyle>;
}

export const Button = forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  ButtonProps
>(
  (
    {
      title,
      onPress,
      variant = "primary",
      loading = false,
      disabled = false,
      icon,
      textColor = "link",
      fontWeight = "bold",
      style,
    },
    ref
  ) => {
    // Get theme colors
    const { colors: themeColors } = useCorporateBranding(); // Or use dynamic theme based on app state
    const { getCorpFont } = useCorporateBranding();
    const corpFont = useMemo(() => {
      return getCorpFont("body");
    }, [getCorpFont]);

    // Extended colors
    const extendedColors = {
      ...themeColors,
      secondaryBg: themeColors.secondary,
      secondaryBorder: themeColors.secondary,
      secondaryText: themeColors.primary,
      grayText: themeColors?.grayishColor,
      disabledBg: themeColors.secondary,
      disabledBorder: themeColors.secondary,
      disabledText: "#999999",
    };

    // Determine button container style
    const getButtonStyle = (): StyleProp<ViewStyle> => {
      switch (variant) {
        case "primary":
          return [
            {
              borderWidth: 1,
              backgroundColor: extendedColors.primary,
              borderColor: extendedColors.primary,
            },
            disabled && {
              opacity: 0.5,
            },
          ];
        case "secondary":
          return [
            styles.secondaryButton,
            disabled && {},
            {
              backgroundColor: extendedColors.secondaryBg,
              borderColor: disabled
                ? extendedColors.disabledBorder
                : extendedColors.secondaryBorder,
            },
          ];
        case "outlined":
          return [
            {
              borderWidth: 1,
              borderColor: disabled
                ? extendedColors.disabledBorder
                : extendedColors.primary,
            },
          ];
        case "text":
        case "link":
        case "flat":
        case "gray":
          return [
            styles.textButton,
            {
              minHeight: undefined,
              maxHeight: undefined,
              height: undefined,
            },
            disabled && { opacity: 0.5 },
          ];
        default:
          return {};
      }
    };

    // Determine text color based on variant and textColor prop
    const getTextColor = (): string => {
      // Handle primary button text separately (always white)
      if (variant === "primary") return extendedColors.white;

      if (variant === "gray") return extendedColors.grayText;
      if (variant === "flat") return extendedColors.text;

      switch (textColor) {
        case "link":
          return extendedColors.primary;
        case "gray":
          return extendedColors.grayText;
        case "foreground":
          return extendedColors.text;
        case "white":
          return extendedColors.white;
        default:
          return extendedColors.primary;
      }
    };

    // Determine text style with proper font handling for Android
    const getTextStyle = (): TextStyle => {
      const textStyle: TextStyle = {
        ...styles.baseText,
        color: getTextColor(),
      };

      if (!corpFont) {
        // No corporate font, use default fontWeight
        textStyle.fontWeight = fontWeight === "bold" ? "bold" : "normal";
        return textStyle;
      }

      // Check if it's a registration key (contains "-400", "-500", etc.)
      if (corpFont.match(/-\d+$/)) {
        // It's a registration key - extract base name and select correct weight key
        const baseName = corpFont.split("-")[0]; // "Poppins" from "Poppins-400"
        const weightValue = fontWeight === "bold" ? 700 : 400;

        // Fallback chain: try requested weight, then fallback weights
        const WEIGHT_FALLBACKS: Record<number, number[]> = {
          700: [700, 600, 500, 400], // bold -> semibold -> medium -> regular
          600: [600, 500, 400], // semibold -> medium -> regular
          500: [500, 400], // medium -> regular
          400: [400], // regular
        };

        const fallbacks = WEIGHT_FALLBACKS[weightValue] || [weightValue, 400];
        let fontFamilyToUse = corpFont; // Default to original key

        // Try each weight in fallback chain
        for (const fallbackWeight of fallbacks) {
          const testKey = `${baseName}-${fallbackWeight}`;
          if (Font.isLoaded(testKey)) {
            fontFamilyToUse = testKey;
            break;
          }
        }

        textStyle.fontFamily = fontFamilyToUse;
        // Don't use fontWeight with registration keys
      } else {
        // It's a font name (like "Overlock") - use with fontWeight
        textStyle.fontFamily = corpFont;
        const weightValue = fontWeight === "bold" ? 700 : 400;
        textStyle.fontWeight = weightValue as 400 | 500 | 600 | 700;
      }

      return textStyle;
    };

    const isTextVariant = ["text", "link", "flat", "gray"].includes(variant);

    return (
      <TouchableOpacity
        ref={ref}
        style={[styles.button, getButtonStyle(), style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        hitSlop={
          isTextVariant ? { top: 8, bottom: 8, left: 8, right: 8 } : undefined
        }
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size={16} />
        ) : (
          <View style={styles.buttonContent}>
            {icon && <View>{icon}</View>}
            <Text style={getTextStyle()}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    minHeight: 44,
    maxHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  textButton: {
    backgroundColor: "transparent",
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  baseText: {
    fontSize: 16,
    textAlign: "center",
  },
});
