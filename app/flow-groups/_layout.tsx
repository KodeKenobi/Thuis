import { SMOOTH_ANIMATION } from "@/config/screen-animation";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { Stack } from "expo-router";

export default function FlowGroupsLayout() {
  const { colors: { background, theme, white } } = useCorporateBranding();
  const bgColor = theme === "light" ? white : background;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...SMOOTH_ANIMATION,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: bgColor },
      }}
    >
      <Stack.Screen name="[group]" />
      <Stack.Screen name="category" />
    </Stack>
  );
}
