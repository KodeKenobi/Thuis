import { SMOOTH_ANIMATION } from "@/config/screen-animation";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { Stack } from "expo-router";

export default function FlowLayout() {
  const { colors: { background, theme, white } } = useCorporateBranding();

  const bgColor = theme === "light" ? white : background;

  return (
    <Stack
      initialRouteName="[id]"
      screenOptions={{
        headerShown: false,
        ...SMOOTH_ANIMATION,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: bgColor },
      }}
    >
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
