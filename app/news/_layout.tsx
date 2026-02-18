import React from "react";
import { Stack } from "expo-router";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

export default function NewsLayout() {
  const { colors: { background, theme, white } } = useCorporateBranding();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
        contentStyle: {
          backgroundColor: theme === "light" ? white : background,
        },
      }}
    />
  );
}
