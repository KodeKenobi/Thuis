import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { Stack } from "expo-router";

export default function PostsLayout() {
  const {
    colors: { background, theme, white },
  } = useCorporateBranding();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: theme === "light" ? white : background,
        },
      }}
    />
  );
}
