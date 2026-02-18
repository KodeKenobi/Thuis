import React, { forwardRef } from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

export interface IconButtonProps {
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg" | number;
  variant?:
    | "primary"
    | "secondary"
    | "outlined"
    | "text"
    | "link"
    | "flat"
    | "gray"
    | "danger";
  onPress?: () => void;
  style?: ViewStyle;
  iconStyle?: ViewStyle;
  disabled?: boolean;
}

export const IconButton = forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  IconButtonProps
>(
  (
    {
      children,
      size = "md",
      variant = "primary",
      onPress,
      style,
      iconStyle,
      disabled = false,
    },
    ref
  ) => {
    // Get theme colors
    const { colors } = useCorporateBranding();

    // Extended colors - matching your Button component
    const extendedColors = {
      ...colors,
      secondaryBg: colors.secondary,
      secondaryBorder: colors.secondary,
      secondaryText: colors.primary,
      grayText: colors?.grayishColor,
      disabledBg: colors.secondary,
      disabledBorder: colors.secondary,
      disabledText: "#999999",
    };

    // Size calculations
    const getButtonSize = () => {
      if (typeof size === "number") return size;
      switch (size) {
        case "sm":
          return 32;
        case "md":
          return 40;
        case "lg":
          return 48;
        default:
          return 40;
      }
    };

    const getIconSize = () => {
      if (typeof size === "number") return size * 0.6;
      switch (size) {
        case "sm":
          return 16;
        case "md":
          return 20;
        case "lg":
          return 24;
        default:
          return 28;
      }
    };

    const getBorderRadius = () => {
      if (typeof size === "number") return size * 0.6;
      switch (size) {
        case "sm":
          return 8;
        case "md":
          return 12;
        case "lg":
          return 12;
        default:
          return 12;
      }
    };

    const buttonSize = getButtonSize();
    const iconSize = getIconSize();

    // Determine button container style
    const getButtonStyle = (): ViewStyle[] => {
      const baseStyle = [
        styles.container,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: getBorderRadius(),
        },
      ];

      switch (variant) {
        case "primary":
          return [
            ...baseStyle,
            {
              backgroundColor: disabled
                ? extendedColors.disabledBg
                : extendedColors.primary,
              borderColor: disabled
                ? extendedColors.disabledBorder
                : extendedColors.primary,
            },
            disabled
              ? {
                  opacity: 0.5,
                }
              : {},
          ];

        case "secondary":
          return [
            ...baseStyle,
            {
              backgroundColor: disabled
                ? extendedColors.disabledBg
                : extendedColors.secondaryBg,
            },
            disabled ? styles.disabledSecondary : {},
          ];

        case "outlined":
          return [
            ...baseStyle,
            {
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: disabled
                ? extendedColors.disabledBorder
                : extendedColors.primary,
            },
            disabled ? styles.disabledOutlined : {},
          ];

        case "gray":
          return [
            ...baseStyle,
            styles.textButton,
            disabled ? { opacity: 0.5 } : {},
          ];

        case "danger":
          return [
            ...baseStyle,
            {
              backgroundColor: disabled
                ? extendedColors.errorFadeColor
                : extendedColors.errorColor,
              borderColor: disabled
                ? extendedColors.errorFadeColor
                : extendedColors.errorColor,
            },
            disabled ? { opacity: 0.5 } : {},
          ];

        case "text":
        case "link":
        case "flat":
        default:
          return [
            ...baseStyle,
            styles.textButton,
            disabled ? { opacity: 0.5 } : {},
          ];
      }
    };

    // Determine icon color based on variant
    const getIconColor = (): string => {
      if (variant === "primary") return extendedColors.white;
      if (variant === "gray") return extendedColors.grayText;
      if (variant === "secondary") return extendedColors.grayishColor;
      if (variant === "danger") return "white";
      return extendedColors.primary;
    };

    // Apply color and size to the icon
    const styledIcon = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        const childElement = child as React.ReactElement;
        return React.cloneElement(childElement, {
          color: getIconColor(),
          size: iconSize,
          // @ts-ignore
          ...childElement.props,
          style: [
            iconStyle,
            // @ts-ignore
            childElement.props.style,
            { width: iconSize, height: iconSize },
          ],
        });
      }
      return child;
    });

    return (
      <TouchableOpacity
        ref={ref}
        style={[...getButtonStyle(), style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {styledIcon}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  textButton: {
    backgroundColor: "transparent",
  },
  disabledPrimary: {
    backgroundColor: "#cccccc",
    borderColor: "#cccccc",
  },
  disabledSecondary: {
    backgroundColor: "#f0f0f0",
  },
  disabledOutlined: {
    borderColor: "#cccccc",
  },
});
