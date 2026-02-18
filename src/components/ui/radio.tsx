import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import React from "react";
import {
  AccessibilityProps,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Container, ContainerProps } from "./container";
import { ThemedText } from "./themed-text";

interface RadioProps extends ContainerProps, AccessibilityProps {
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  label?: string;
  disabled?: boolean;
  radioStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

const AnimatedContainer = Animated.createAnimatedComponent(Container);

interface RadioGroupContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextType>({});

interface RadioGroupProps extends ContainerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  defaultValue = "",
  onValueChange,
  disabled = false,
  children,
  label,
  required,
  error,
  ...containerProps
}) => {
  const [internalValue, setInternalValue] =
    React.useState<string>(defaultValue);
  const isControlled = value !== undefined;
  const groupValue = isControlled ? value : internalValue;

  const handleValueChange = (itemValue: string) => {
    if (!isControlled) setInternalValue(itemValue);
    if (onValueChange) onValueChange(itemValue);
  };

  return (
    <RadioGroupContext.Provider
      value={{ value: groupValue, onValueChange: handleValueChange, disabled }}
    >
      <Container {...containerProps}>
        {label && (
          <>
            <ThemedText
              style={{ fontSize: 14, color: error ? "#ff0000" : "#333" }}
              weight="medium"
            >
              {label}
              {required && (
                <ThemedText style={{ color: "#ff0000", fontWeight: "bold" }}>
                  {" "}
                  *
                </ThemedText>
              )}
            </ThemedText>
            {!!error && (
              <ThemedText style={{ color: "#ff0000", fontSize: 12 }}>
                {error}
              </ThemedText>
            )}
          </>
        )}
        {children}
      </Container>
    </RadioGroupContext.Provider>
  );
};

interface RadioItemProps extends Omit<
  RadioProps,
  "selected" | "onSelectedChange"
> {
  value: string;
}

export const RadioItem = React.memo(function RadioItem({
  value,
  disabled: itemDisabled = false,
  label,
  radioStyle = {},
  labelStyle = {},
  ...props
}: RadioItemProps) {
  const group = React.useContext(RadioGroupContext);
  const disabled = itemDisabled || group.disabled;
  const selected = group.value === value;

  const handlePress = () => {
    if (!disabled && group.onValueChange) {
      group.onValueChange(value);
    }
  };

  return (
    <Radio
      {...props}
      selected={selected}
      onSelectedChange={handlePress}
      disabled={disabled}
      label={label}
      radioStyle={radioStyle}
      labelStyle={labelStyle}
    />
  );
});

export const Radio = React.memo(function Radio({
  selected = false,
  onSelectedChange = () => {},
  label,
  disabled = false,
  radioStyle = {},
  labelStyle = {},
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "radio",
  accessibilityState,
  ...containerProps
}: RadioProps) {
  const { colors } = useCorporateBranding();
  const scale = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(selected ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [selected]);

  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0, 1], [0, 1]),
  }));

  const handlePress = () => {
    if (!disabled && onSelectedChange) {
      onSelectedChange(!selected);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel || label || "Radio button"}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        checked: selected,
        disabled,
        ...accessibilityState,
      }}
      activeOpacity={0.7}
    >
      <AnimatedContainer
        direction="horizontal"
        align="center"
        gap={8}
        style={[
          styles.container,
          disabled && styles.disabled,
          containerProps.style,
        ]}
        {...containerProps}
      >
        <Animated.View
          style={[
            styles.radio,
            {
              borderColor: selected ? colors.primary : colors.grayishColor,
            },
            radioStyle,
            disabled && styles.radioDisabled,
          ]}
        >
          <Animated.View
            style={[
              styles.inner,
              { backgroundColor: colors.primary },
              animatedInnerStyle,
            ]}
          />
        </Animated.View>

        {label && (
          <ThemedText
            style={[styles.label, labelStyle, disabled && styles.labelDisabled]}
          >
            {label}
          </ThemedText>
        )}

        {children}
      </AnimatedContainer>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  inner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  labelDisabled: {
    opacity: 0.5,
  },
  disabled: {
    opacity: 0.6,
  },
});
