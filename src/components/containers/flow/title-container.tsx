import React from "react";
import { View, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

interface TitleContainerProps {
  element: any;
  currentStep?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const TitleContainer: React.FC<TitleContainerProps> = ({
  element,
  currentStep,
  style,
  textStyle,
}) => {
  const { colors: { primary } } = useCorporateBranding();
  return (
    <ThemedView transparent={false} style={[styles.row, style]}>
      {typeof currentStep === "number" && (
        <View style={[styles.stepBadge, { backgroundColor: primary }]}>
          <ThemedText
            style={styles.stepBadgeText}
            weight="semiBold"
            fontType="display"
          >
            {currentStep}
          </ThemedText>
        </View>
      )}
      <ThemedText
        weight="semiBold"
        style={[styles.titleText, textStyle]}
        selectable
        fontType="display"
      >
        {element?.data?.text}
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
  },
  stepBadge: {
    borderRadius: 999,
    minWidth: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    paddingHorizontal: 10,
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 16,
  },
  titleText: {
    fontSize: 20,
    flexShrink: 1,
  },
});
