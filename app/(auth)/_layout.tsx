import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { Stack } from "expo-router";

export default function AuthLayout() {
  const {
    colors: { background, theme, white },
  } = useCorporateBranding();

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
      <Stack.Screen name="index" />
      <Stack.Screen name="signin-screen" />
      <Stack.Screen name="otp-verification-screen" />
      <Stack.Screen name="forgot-password-screen" />
      <Stack.Screen name="account-request-screen" />
    </Stack>
  );
}
