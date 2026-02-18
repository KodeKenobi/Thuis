
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Divider from "./divider";
import { ThemedText } from "./themed-text";
import { SIZES } from "@/constants";
import { getBackgroundColor } from "@/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

type TriggerLayout = { x: number; y: number; width: number; height: number };

interface DropdownRadioGroupContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const DropdownRadioGroupContext = createContext<DropdownRadioGroupContextType>(
  {},
);

export const DropdownRadioGroup: React.FC<{
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ value, onValueChange, disabled = false, children, style }) => {
  const [internalValue, setInternalValue] = useState<string | undefined>();
  const isControlled = value !== undefined;
  const groupValue = isControlled ? value : internalValue;
  const handleChange = (newValue: string) => {
    if (!isControlled) setInternalValue(newValue);
    onValueChange?.(newValue);
  };
  return (
    <DropdownRadioGroupContext.Provider
      value={{ value: groupValue, onValueChange: handleChange, disabled }}
    >
      <View style={style}>{children}</View>
    </DropdownRadioGroupContext.Provider>
  );
};

export const DropdownRadioItem: React.FC<{
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onSelect?: (value: string) => void;
}> = ({ value, children, disabled: dProp = false, style, onSelect }) => {
  const {
    value: groupValue,
    onValueChange,
    disabled: gDisabled,
  } = useContext(DropdownRadioGroupContext);

  const ctx = useContext(DropdownContext);
  const { colors } = useCorporateBranding();
  const isSelected = groupValue === value;
  const isDisabled = dProp || gDisabled;

  return (
    <TouchableOpacity
      style={[
        styles.item,
        {
          flexDirection: "row",
          alignItems: "center",
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      disabled={isDisabled}
      onPress={() => {
        if (isDisabled) return;
        onValueChange?.(value);
        onSelect?.(value);
        ctx?.setOpen(false);
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
    >
      <View style={styles.iconWrapper}>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: isSelected ? colors.primary : colors.grayishColor,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isSelected && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
              }}
            />
          )}
        </View>
      </View>

      <ThemedText style={styles.itemText}>{children}</ThemedText>
    </TouchableOpacity>
  );
};

interface DropdownCheckboxGroupContextType {
  value?: string[];
  onValueChange?: (itemValue: string, checked: boolean) => void;
  disabled?: boolean;
}

const DropdownCheckboxGroupContext =
  createContext<DropdownCheckboxGroupContextType>({});

export const DropdownCheckboxGroup: React.FC<{
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (v: string[]) => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({
  value,
  defaultValue = [],
  onValueChange,
  disabled = false,
  children,
  style,
}) => {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const vals = isControlled ? value! : internal;

  const toggle = (itemValue: string, checked: boolean) => {
    let next: string[] = checked
      ? [...vals, itemValue]
      : vals.filter((v) => v !== itemValue);

    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <DropdownCheckboxGroupContext.Provider
      value={{ value: vals, onValueChange: toggle, disabled }}
    >
      <View style={style}>{children}</View>
    </DropdownCheckboxGroupContext.Provider>
  );
};

export const DropdownCheckboxItem: React.FC<{
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ value, children, disabled: dProp = false, style }) => {
  const {
    value: vals,
    onValueChange,
    disabled: gDisabled,
  } = useContext(DropdownCheckboxGroupContext);

  const checked = !!vals?.includes(value);
  const disabled = dProp || gDisabled;
  const { colors } = useCorporateBranding();

  return (
    <TouchableOpacity
      style={[
        styles.item,
        {
          flexDirection: "row",
          alignItems: "center",
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        onValueChange?.(value, !checked);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      <View style={styles.iconWrapper}>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: checked ? colors.primary : colors.grayishColor,
            backgroundColor: checked ? colors.primary : "transparent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {checked && (
            <Ionicons name="checkmark" size={12} color={colors.background} />
          )}
        </View>
      </View>
      <ThemedText style={styles.itemText}>{children}</ThemedText>
    </TouchableOpacity>
  );
};

interface DropdownContextProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  setTriggerLayout: (layout: TriggerLayout | null) => void;
  triggerLayout: TriggerLayout | null;
}

const DropdownContext = createContext<DropdownContextProps | null>(null);

export const Dropdown: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(
    null,
  );

  return (
    <DropdownContext.Provider
      value={{ isOpen: open, setOpen, setTriggerLayout, triggerLayout }}
    >
      {children}
    </DropdownContext.Provider>
  );
};

export const DropdownTrigger: React.FC<{
  children: React.ReactElement<any>;
  style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => {
  const ctx = useContext(DropdownContext);
  const ref = useRef<View>(null);

  if (!ctx) return null;

  const handlePress = (...args: any[]) => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width && height) {
        ctx.setTriggerLayout({ x, y, width, height });
        ctx.setOpen(!ctx.isOpen);
      }
    });

    (children.props as any)?.onPress?.(...args);
  };

  return React.cloneElement(children, { ref, onPress: handlePress, style });
};

export const DropdownContent: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  maxHeight?: number;
}> = ({ children, style, maxHeight = 250 }) => {
  const { bottom } = useSafeAreaInsets();
  const { colors: { grayishColor, background, theme } } = useCorporateBranding();
  const ctx = useContext(DropdownContext);

  const anim = useSharedValue(0);
  const [visible, setVisible] = useState(false);
  const [contentH, setContentH] = useState<number | null>(null);

  const window = SIZES.viewport;
  const GAP = 4;
  const EDGE_THRESHOLD = 100;
  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

  useEffect(() => {
    if (ctx?.isOpen) {
      setVisible(true);
      anim.value = withTiming(1, { duration: 150 });
    } else {
      anim.value = withTiming(0, { duration: 100 }, (finished) => {
        finished && runOnJS(setVisible)(false);
      });
    }
  }, [ctx?.isOpen]);

  const styleAnim = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{ scale: 0.9 + anim.value * 0.1 }],
  }));

  const shadowStyleAnim = useAnimatedStyle(() => ({
    opacity: anim.value,
  }));

  if (!visible || !ctx) return null;

  const layout = ctx.triggerLayout;
  const flatStyle = style ? StyleSheet.flatten(style) : undefined;
  const explicitWidth =
    flatStyle && typeof flatStyle.width === "number"
      ? flatStyle.width
      : undefined;

  const baseWidth = Math.max(layout?.width || 160, 120);
  const width = explicitWidth ?? baseWidth;

  let left = layout ? layout.x : (window.width - width) / 2;
  const margin = 8;

  const triggerRight = layout ? layout.x + layout.width : 0;
  const wouldOverflowRight = left + width + margin > window.width;
  const nearRight = triggerRight >= window.width - EDGE_THRESHOLD;

  if (wouldOverflowRight && nearRight) left = triggerRight - width;
  if (left < margin) left = margin;
  if (left + width + margin > window.width)
    left = window.width - width - margin;

  let top: number;
  if (layout) {
    const triggerY = layout.y - statusBarHeight;
    const below = window.height - (triggerY + layout.height + GAP);

    if (triggerY <= EDGE_THRESHOLD) {
      top = triggerY + layout.height + GAP;
    } else if (below <= EDGE_THRESHOLD) {
      top =
        triggerY -
        (contentH || 0) -
        GAP +
        Platform.select({ android: bottom, default: 0 });
    } else {
      top = triggerY + layout.height + GAP;
    }

    if (top < margin) top = margin;
    if (top + (contentH || 0) + margin > window.height) {
      top = window.height - (contentH || 0) - margin;
    }
  } else {
    top = window.height / 2 - (contentH || 0) / 2;
  }

  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={() => ctx.setOpen(false)}
      statusBarTranslucent
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={() => ctx.setOpen(false)}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.dropdownModal,
          { left, top, width, maxHeight },
          shadowStyleAnim,
          style,
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.animatedDropdown,
            styleAnim,
            {
              backgroundColor:
                Platform.OS === "ios"
                  ? getBackgroundColor(background, 0.9)
                  : background,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: getBackgroundColor(grayishColor, 0.25),
            },
          ]}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            h !== contentH && setContentH(h);
          }}
        >
          {Platform.OS === "ios" && (
            <BlurView
              intensity={80}
              tint={theme}
              style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
            />
          )}

          <ScrollView style={{ maxHeight }}>{children}</ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export const DropdownItem: React.FC<{
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ onPress, children, style }) => {
  const ctx = useContext(DropdownContext);
  return (
    <TouchableOpacity
      style={[styles.item, style]}
      onPress={() => {
        ctx?.setOpen(false);
        onPress?.();
      }}
    >
      <ThemedText style={styles.itemText}>{children}</ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 10,
  },

  dropdownModal: {
    position: "absolute",
    zIndex: 999,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 10,
      },
    }),
  },

  animatedDropdown: {
    borderRadius: 12,
    overflow: "hidden",
  },

  item: { paddingVertical: 12, paddingHorizontal: 18 },

  itemText: { fontSize: 16 },

  iconWrapper: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
});
