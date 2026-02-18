import React from "react";
import { Stack } from "expo-router";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

export default function ChatLayout() {
  const { colors: { background, white, theme } } = useCorporateBranding();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme === "light" ? white : background,
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="chat-screen" />
    </Stack>
  );
}
