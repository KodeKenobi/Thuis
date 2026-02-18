import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import React from "react";
import {
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Container } from "./container";
import { ThemedText } from "./themed-text";
import { getBackgroundColor } from "@/utils";
import { SIZES } from "@/constants";
import Label from "./label";

export interface ButtonToggleItem {
  id: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface ButtonToggleItemProps {
  item: ButtonToggleItem;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
  // Styling props
  style?: ViewStyle;
  activeStyle?: ViewStyle;
  inactiveStyle?: ViewStyle;
  textStyle?: TextStyle;
  activeTextStyle?: TextStyle;
  inactiveTextStyle?: TextStyle;
  // Animation props
  scaleOnPress?: boolean;
  scaleValue?: number;
  animationDuration?: number;
  // Border props
  borderWidth?: number;
  activeBorderWidth?: number;
  borderRadius?: number;
  // Size props
  minHeight?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  // Color props
  backgroundColor?: string;
  activeBackgroundColor?: string;
  borderColor?: string;
  activeBorderColor?: string;
  textColor?: string;
  activeTextColor?: string;
  disabledOpacity?: number;
  // Text props
  textSize?: number;
  textWeight?: "regular" | "medium" | "semiBold" | "bold";
  activeTextWeight?: "regular" | "medium" | "semiBold" | "bold";
  // Interaction props
  activeOpacity?: number;
  pressable?: boolean;
}

// Discriminated union for ButtonToggleProps
interface ButtonToggleBaseProps {
  items: ButtonToggleItem[];
  direction?: "horizontal" | "vertical";
  scrollable?: boolean;
  flexWrap?: boolean;
  style?: ViewStyle;
  itemStyle?: ViewStyle;
  activeItemStyle?: ViewStyle;
  inactiveItemStyle?: ViewStyle;
  gap?: number;
  padding?: number;
  columns?: number;
  justify?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  align?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  wrap?: boolean;
  flex?: number;
  textColor?: string;
  activeTextColor?: string;
  textSize?: number;
  textWeight?: "regular" | "medium" | "semiBold" | "bold";
  activeTextWeight?: "regular" | "medium" | "semiBold" | "bold";
}

interface ButtonToggleMultiProps extends ButtonToggleBaseProps {
  isMulti: true;
  selected?: string[];
  onSelect?: (selected: string[]) => void;
}

interface ButtonToggleSingleProps extends ButtonToggleBaseProps {
  isMulti?: false;
  selected?: string;
  onSelect?: (selected: string) => void;
}

export type ButtonToggleProps =
  | (ButtonToggleMultiProps & {
      label?: string;
      required?: boolean;
      error?: string;
    })
  | (ButtonToggleSingleProps & {
      label?: string;
      required?: boolean;
      error?: string;
    });

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const ButtonToggleItem: React.FC<ButtonToggleItemProps> = ({
  item,
  isSelected,
  onPress,
  disabled = false,
  // Styling props
  style,
  activeStyle,
  inactiveStyle,
  textStyle,
  activeTextStyle,
  inactiveTextStyle,
  // Animation props
  scaleOnPress = true,
  scaleValue = 0.95,
  animationDuration = 150,
  // Border props
  borderWidth = 1,
  activeBorderWidth = 1,
  borderRadius,
  // Size props
  minHeight = 40,
  paddingHorizontal = 20,
  paddingVertical = 10,
  // Color props
  backgroundColor,
  activeBackgroundColor,
  borderColor,
  activeBorderColor,
  textColor,
  activeTextColor,
  disabledOpacity = 0.5,
  // Text props
  textSize = 14,
  textWeight = "regular",
  activeTextWeight = "regular",
  // Interaction props
  activeOpacity = 0.7,
  pressable = true,
}) => {
  const { colors } = useCorporateBranding();
  const scale = useSharedValue(1);

  // Use theme colors as defaults if not provided
  const finalBackgroundColor = backgroundColor || colors.background;
  const finalActiveBackgroundColor =
    activeBackgroundColor || getBackgroundColor(colors.primary);
  const finalBorderColor =
    borderColor || getBackgroundColor(colors.grayishColor, 0.1);
  const finalActiveBorderColor = activeBorderColor || colors.primary;
  const finalTextColor = textColor || colors.text;
  const finalActiveTextColor = activeTextColor || colors.text;
  const finalBorderRadius = borderRadius || SIZES.radius / 1.4;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: scaleOnPress ? [{ scale: scale.value }] : [],
  }));

  const handlePressIn = () => {
    if (!disabled && scaleOnPress) {
      scale.value = withSpring(scaleValue, {
        damping: 15,
        stiffness: 150,
      });
    }
  };

  const handlePressOut = () => {
    if (!disabled && scaleOnPress) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    }
  };

  const handlePress = () => {
    if (!disabled && pressable) {
      onPress();
    }
  };

  const currentBorderWidth = isSelected ? activeBorderWidth : borderWidth;
  const currentBackgroundColor = isSelected
    ? finalActiveBackgroundColor
    : finalBackgroundColor;
  const currentBorderColor = isSelected
    ? finalActiveBorderColor
    : finalBorderColor;
  const currentTextColor = isSelected ? finalActiveTextColor : finalTextColor;
  const currentTextWeight = isSelected ? activeTextWeight : textWeight;

  return (
    <AnimatedTouchable
      style={[
        {
          paddingHorizontal,
          paddingVertical,
          borderRadius: finalBorderRadius,
          justifyContent: "center",
          alignItems: "center",
          minHeight,
          borderColor: currentBorderColor,
          borderWidth: currentBorderWidth,
          backgroundColor: currentBackgroundColor,
          flexShrink: 1,
        },
        animatedStyle,
        style,
        isSelected ? activeStyle : inactiveStyle,
        disabled && { opacity: disabledOpacity },
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={activeOpacity}
      disabled={disabled}
    >
      {typeof item.label === "string" ? (
        <ThemedText
          style={[
            {
              fontSize: textSize,
              textAlign: "center",
              color: currentTextColor,
            },
            textStyle,
            isSelected ? activeTextStyle : inactiveTextStyle,
            disabled && { opacity: disabledOpacity },
          ]}
          weight={currentTextWeight}
        >
          {item.label}
        </ThemedText>
      ) : (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {item.label}
        </View>
      )}
    </AnimatedTouchable>
  );
};

export const ButtonToggle: React.FC<ButtonToggleProps> = ({
  items,
  selected,
  onSelect,
  isMulti = false,
  style,
  itemStyle,
  activeItemStyle,
  inactiveItemStyle,
  gap = 8,
  padding = 0,
  columns = 2,
  justify = "flex-start",
  align = "center",
  flex,
  textColor,
  activeTextColor,
  textSize = 14,
  textWeight = "regular",
  activeTextWeight = "semiBold",
  label,
  required,
  error,
}) => {
  if (isMulti && selected !== undefined && !Array.isArray(selected)) {
    throw new Error(
      "ButtonToggle: When isMulti is true, selected must be an array of strings."
    );
  }
  if (!isMulti && selected !== undefined && Array.isArray(selected)) {
    throw new Error(
      "ButtonToggle: When isMulti is false, selected must be a string."
    );
  }

  const selectedArray: string[] = isMulti
    ? (selected as string[]) || []
    : selected !== undefined && selected !== null && selected !== ""
    ? [selected as string]
    : [];

  const handleItemPress = (itemId: string) => {
    if (!onSelect) return;

    if (isMulti) {
      const arr = selectedArray as string[];
      const newSelected = arr.includes(itemId)
        ? arr.filter((id) => id !== itemId)
        : [...arr, itemId];
      (onSelect as (selected: string[]) => void)(newSelected);
    } else {
      (onSelect as (selected: string) => void)(itemId);
    }
  };

  const getGridRows = (arr: ButtonToggleItem[], cols: number) => {
    const rows = [];
    for (let i = 0; i < arr.length; i += cols) {
      rows.push(arr.slice(i, i + cols));
    }
    return rows;
  };

  const gridRows = getGridRows(items, columns);

  const renderItem = (
    item: ButtonToggleItem,

    columns: number
  ) => {
    const isSelected = selectedArray.includes(item.id);
    // If only one item, take full width. If multiple, each takes width of a column.
    const itemContainerStyle: ViewStyle = {
      ...styles.item,
      ...itemStyle,
      width: items.length === 1 ? "100%" : `${100 / columns}%`,
    };
    return (
      <ButtonToggleItem
        key={item.id}
        item={item}
        isSelected={isSelected}
        onPress={() => handleItemPress(item.id)}
        style={itemContainerStyle}
        activeStyle={activeItemStyle}
        inactiveStyle={inactiveItemStyle}
        disabled={item.disabled}
        textColor={textColor}
        activeTextColor={activeTextColor}
        textSize={textSize}
        textWeight={textWeight}
        activeTextWeight={activeTextWeight}
      />
    );
  };

  const containerStyle: ViewStyle = {
    padding,
    ...style,
  };

  return (
    <Container>
      {label && <Label required={required}>{label}</Label>}
      <Container
        direction="vertical"
        justify={justify}
        align={align}
        gap={gap}
        wrap={false}
        style={containerStyle}
        flex={flex}
      >
        {gridRows?.map((row, rowIdx) => (
          <Container
            key={rowIdx}
            direction="horizontal"
            gap={gap}
            style={{ width: "100%" }}
          >
            {row.map((item, colIdx) => renderItem(item, columns))}
          </Container>
        ))}
        {!!error && (
          <ThemedText style={{ color: "#ff0000", fontSize: 12 }}>
            {error}
          </ThemedText>
        )}
      </Container>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
});
