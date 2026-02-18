import React from "react";
import { Stack } from "expo-router";
import { SMOOTH_ANIMATION } from "@/config/screen-animation";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

export default function FinancialLayout() {
  const { colors: { background, theme, white } } = useCorporateBranding();
  return (
    <Stack
      initialRouteName="financial-screen"
      screenOptions={{
        headerShown: false,
        ...SMOOTH_ANIMATION,
        contentStyle: {
          backgroundColor: theme === "light" ? white : background,
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="financial-screen" />
      <Stack.Screen name="invoices-screen" />
    </Stack>
  );
}
