import React from "react";
import { Stack } from "expo-router";
import { SMOOTH_ANIMATION } from "@/config/screen-animation";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

export default function HouseValuationLayout() {
  const { colors: { background, theme, white } } = useCorporateBranding();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...SMOOTH_ANIMATION,
        contentStyle: {
          backgroundColor: theme === "light" ? white : background,
        },
        animation: "slide_from_left",
      }}
    >
      <Stack.Screen name="[unitId]" />
    </Stack>
  );
}
