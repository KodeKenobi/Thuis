import React from "react";
import { StyleSheet, View, ViewStyle, TextStyle } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { ThemedText } from "./themed-text";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "warning" | "success" | "error" | "info";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const getBadgeStyles = (
  variant: NonNullable<BadgeProps["variant"]>,
  colors: ReturnType<typeof useColors>,
) => {
  switch (variant) {
    case "warning":
      return {
        container: {
          backgroundColor: colors.badgeWarningBg,
          borderColor: colors.badgeWarningBorder,
        },
        text: {
          color: colors.badgeWarningText,
        },
      };
    case "success":
      return {
        container: {
          backgroundColor: colors.badgeSuccessBg,
          borderColor: colors.badgeSuccessBorder,
        },
        text: {
          color: colors.badgeSuccessText,
        },
      };
    case "error":
      return {
        container: {
          backgroundColor: colors.badgeErrorBg,
          borderColor: colors.badgeErrorBorder,
        },
        text: {
          color: colors.badgeErrorText,
        },
      };
    case "info":
      return {
        container: {
          backgroundColor: colors.badgeInfoBg,
          borderColor: colors.badgeInfoBorder,
        },
        text: {
          color: colors.badgeInfoText,
        },
      };
    default:
      return {
        container: {
          backgroundColor: colors.badgeDefaultBg,
          borderColor: colors.badgeDefaultBorder,
        },
        text: {
          color: colors.badgeDefaultText,
        },
      };
  }
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  style,
  textStyle,
}) => {
  const { colors } = useCorporateBranding();
  const { container, text } = getBadgeStyles(variant, colors);

  return (
    <View style={[styles.badge, container, style]}>
      <ThemedText style={[styles.badgeText, text, textStyle]}>
        {children}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default Badge;
