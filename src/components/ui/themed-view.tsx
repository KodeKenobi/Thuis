import { View, type ViewProps } from "react-native";

import { useCorporateBranding } from "@/contexts/corporate-branding-context";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  transparent?: boolean;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  transparent,
  ...otherProps
}: ThemedViewProps) {
  const { colors: { background } } = useCorporateBranding();

  return (
    <View
      style={[transparent ? {} : { backgroundColor: background }, style]}
      {...otherProps}
    />
  );
}
