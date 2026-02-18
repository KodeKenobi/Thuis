import React from "react";
import { TouchableOpacity } from "react-native";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { Container } from "@/components/ui/container";

interface DotsNavigatorProps {
  total: number;
  activeIndex: number;
  onDotPress?: (index: number) => void;
  dotSize?: number;
  activeColor?: string;
  inactiveColor?: string;
}

export function DotsNavigator({
  total,
  activeIndex,
  onDotPress,
  dotSize = 8,
  activeColor,
  inactiveColor,
}: DotsNavigatorProps) {
  const { colors: { primary, grayishColor } } = useCorporateBranding();
  const finalActiveColor = activeColor ?? primary;
  const finalInactiveColor = inactiveColor ?? grayishColor;
  return (
    <Container direction="horizontal" justify="center">
      {Array.from({ length: total }).map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onDotPress?.(index)}
          style={[
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor:
                index === activeIndex ? finalActiveColor : finalInactiveColor,
              marginHorizontal: dotSize / 2,
            },
          ]}
        />
      ))}
    </Container>
  );
}
