import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import Ionicons from "@expo/vector-icons/Ionicons";
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

interface CheckboxProps extends ContainerProps, AccessibilityProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  checkboxStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

const AnimatedContainer = Animated.createAnimatedComponent(Container);

interface CheckboxGroupContextType {
  value?: string[];
  onValueChange?: (value: string, checked: boolean) => void;
  disabled?: boolean;
}

const CheckboxGroupContext = React.createContext<CheckboxGroupContextType>({});

// Checkbox Group Component
interface CheckboxGroupProps extends ContainerProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
  children: React.ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  value,
  defaultValue = [],
  onValueChange,
  disabled = false,
  children,
  label,
  required,
  error,
  ...containerProps
}) => {
  const [internalValue, setInternalValue] =
    React.useState<string[]>(defaultValue);
  const isControlled = value !== undefined;
  const groupValue = isControlled ? value! : internalValue;

  const handleValueChange = (itemValue: string, checked: boolean) => {
    let newValue: string[];
    if (checked) {
      newValue = [...groupValue, itemValue];
    } else {
      newValue = groupValue.filter((v) => v !== itemValue);
    }
    if (!isControlled) setInternalValue(newValue);
    if (onValueChange) onValueChange(newValue);
  };

  return (
    <CheckboxGroupContext.Provider
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
    </CheckboxGroupContext.Provider>
  );
};

// Checkbox Item Component
interface CheckboxItemProps
  extends Omit<CheckboxProps, "checked" | "onCheckedChange"> {
  value: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

// CheckboxItem with safe defaults
export const CheckboxItem = React.memo(function CheckboxItem({
  value,
  checked: checkedProp = false,
  onCheckedChange: onCheckedChangeProp = () => {},
  disabled: disabledProp = false,
  label,
  checkboxStyle = {},
  labelStyle = {},
  ...props
}: CheckboxItemProps) {
  const group = React.useContext(CheckboxGroupContext);
  const isInGroup = typeof group.onValueChange === "function";
  const checked = isInGroup ? !!group.value?.includes(value) : !!checkedProp;
  const disabled = disabledProp || group.disabled;
  const handleChange = (newChecked: boolean) => {
    if (isInGroup && group.onValueChange) {
      group.onValueChange(value, newChecked);
    }
    if (onCheckedChangeProp) {
      onCheckedChangeProp(newChecked);
    }
  };
  return (
    <Checkbox
      {...props}
      checked={checked}
      onCheckedChange={handleChange}
      disabled={disabled}
      label={label}
      checkboxStyle={checkboxStyle}
      labelStyle={labelStyle}
    />
  );
});

export const Checkbox = React.memo(function Checkbox({
  checked = false,
  onCheckedChange = () => {},
  label,
  disabled = false,
  checkboxStyle = {},
  labelStyle = {},
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "checkbox",
  accessibilityState,
  ...containerProps
}: CheckboxProps) {
  const { colors } = useCorporateBranding();
  const scale = useSharedValue(checked ? 1 : 0);
  const borderScale = useSharedValue(checked ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(checked ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
    borderScale.value = withSpring(checked ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [checked]);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0, 1], [0, 1]),
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderWidth: interpolate(borderScale.value, [0, 1], [1, 2]),
    borderColor: checked ? colors.primary : colors.grayishColor,
    backgroundColor: checked ? colors.primary : "transparent",
  }));

  const handlePress = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  const defaultAccessibilityState = {
    checked: checked,
    disabled: disabled,
    ...accessibilityState,
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel || label || "Checkbox"}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={defaultAccessibilityState}
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
            styles.checkbox,
            animatedBorderStyle,
            checkboxStyle,
            disabled && styles.checkboxDisabled,
          ]}
        >
          <Animated.View style={[styles.checkmark, animatedCheckStyle]}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </Animated.View>
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
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
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
