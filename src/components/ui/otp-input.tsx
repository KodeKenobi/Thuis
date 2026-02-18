import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import {
  OTPInput as RNOTPInput,
  type OTPInputRef,
  type SlotProps,
} from "input-otp-native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "./themed-text";

type Props = {
  length?: number;
  label?: string;
  error?: string | null;
  onFinish?: (code: string) => void;
  containerStyle?: ViewStyle;
  labelAlign?: "left" | "center" | "right";
  slotsAlign?: "left" | "center" | "right";
};

export const OTPInput = React.forwardRef<OTPInputRef, Props>(
  (
    {
      length = 6,
      label,
      error,
      onFinish,
      containerStyle,
      labelAlign = "center",
      slotsAlign = "center",
    },
    ref,
  ) => {
    const {
      colors: { primary, grayishColor, text: textColor, errorColor },
      getCorpFont,
    } = useCorporateBranding();

    const corpFont = useMemo(() => {
      return getCorpFont("body");
    }, [getCorpFont]);

    const blinkOpacity = useSharedValue(1);

    const FakeCaret = () => {
      useAnimatedStyle(() => ({ opacity: blinkOpacity.value }));
      React.useEffect(() => {
        blinkOpacity.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 500 }),
            withTiming(1, { duration: 500 }),
          ),
          -1,
          true,
        );
      }, []);
      return (
        <Animated.View
          style={[
            styles.fakeCaret,
            { backgroundColor: primary, opacity: blinkOpacity },
          ]}
        />
      );
    };

    const renderSlot = ({ char, isActive, hasFakeCaret }: SlotProps) => (
      <View
        style={[
          styles.slot,
          {
            borderColor: isActive ? primary : grayishColor,
            borderWidth: 1,
            borderRadius: 30,
            height: 44,
          },
        ]}
        key={(char || "") + Math.random()}
      >
        {char ? (
          <ThemedText
            style={[
              styles.char,
              { color: textColor },
              corpFont ? { fontFamily: corpFont } : {},
            ]}
          >
            {char}
          </ThemedText>
        ) : isActive && hasFakeCaret ? (
          <FakeCaret />
        ) : null}
      </View>
    );

    let justifyContent: "flex-start" | "center" | "flex-end" = "center";
    if (slotsAlign === "left") justifyContent = "flex-start";
    else if (slotsAlign === "right") justifyContent = "flex-end";

    return (
      <View style={containerStyle}>
        {label && (
          <ThemedText
            lightColor={grayishColor}
            darkColor={grayishColor}
            style={[styles.label, { textAlign: labelAlign }]}
          >
            {label}
          </ThemedText>
        )}
        <RNOTPInput
          ref={ref}
          maxLength={length}
          autoFocus
          onComplete={onFinish}
          containerStyle={[styles.container, { justifyContent }]}
          render={({ slots }) => (
            <View style={[styles.group, { justifyContent }]}>
              {slots.map((slot, i) => renderSlot(slot))}
            </View>
          )}
        />
        {error && (
          <ThemedText
            lightColor={errorColor}
            darkColor={errorColor}
            style={styles.errorText}
          >
            {error}
          </ThemedText>
        )}
      </View>
    );
  },
);

OTPInput.displayName = "OTPInput";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  group: {
    flexDirection: "row",
    gap: 8,
  },
  slot: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  char: {
    fontSize: 24,
  },
  fakeCaret: {
    width: 2,
    height: 24,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
});
