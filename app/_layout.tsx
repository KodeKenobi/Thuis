import "react-native-reanimated";

import { DEPLOYMENT_ENVIRONMENT } from "@/constants";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/config/toast";
import { useFonts } from "expo-font";
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
} from "@expo-google-fonts/geist";
import * as SplashScreen from "expo-splash-screen";
import "@/constants/global-styles";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ScreenLoader from "@/components/ui/screen-loader";
import { SMOOTH_ANIMATION } from "@/config/screen-animation";
import { StatusBar } from "expo-status-bar";
import { AppState, AppStateStatus, Platform, View } from "react-native";
import { ThemeProvider, useTheme } from "@/contexts/theme-context";
import { UnfinishedFlowsProvider } from "@/contexts/unfinished-flows-context";
import * as NavigationBar from "expo-navigation-bar";
import { asyncStoragePersister, queryClient } from "@/config/react-query";
import { focusManager } from "@tanstack/react-query";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useExpoUpdates } from "@/hooks/use-expo-updates";
import { UpdateDownloadIndicator } from "@/components/ui/update-download-indicator";
import { StressTestIndicator } from "@/components/dev/stress-test-indicator";
import { useScreenTracking } from "@/hooks/use-screen-tracking";
import { setUserProps } from "@/config/analytics";
import {
  preloadCorpFonts,
  clearFontCache,
  setFontLoadingCallback,
} from "@/utils/font-preloader";
import { COLORS } from "@/constants/colors";
import { CorporateBrandingProvider, useCorporateBranding } from "@/contexts/corporate-branding-context";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
  });

  useEffect(() => {
    async function setup() {
      // Tag environment in Analytics as user property (not user ID)
      setUserProps({ environment: DEPLOYMENT_ENVIRONMENT });

      if (fontsLoaded || fontError) {
        await SplashScreen.hideAsync();
      }
    }

    setup();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24 * 30,
      }}
    >
      <AuthProvider>
        <ThemeProvider>
          <CorporateBrandingProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <BottomSheetModalProvider>
                <UnfinishedFlowsProvider>
                  <MainStack />
                </UnfinishedFlowsProvider>
                <Toast config={toastConfig} />
              </BottomSheetModalProvider>
            </GestureHandlerRootView>
          </CorporateBrandingProvider>
        </ThemeProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

function MainStack() {
  const { theme } = useTheme();

  const background = useMemo(() => {
    return theme === "dark" ? COLORS.dark.background : COLORS.light.background;
  }, [theme]);

  const { loading, user } = useAuth();
  const { checkForUpdates, isDownloading } = useExpoUpdates();
  const { assets, assetsLoading } = useCorporateBranding();
  const [fontsLoading, setFontsLoading] = useState(false);
  const [_fontsError, setFontsError] = useState(false);
  const [fontsChecked, setFontsChecked] = useState(false);

  // Use refs to prevent infinite loops
  const loadingRef = useRef(false);
  const checkedRef = useRef(false);
  const userCorpRef = useRef<string | null>(null);

  // Track font loading state - set up callback immediately
  useEffect(() => {
    const callback = (loading: boolean, error: boolean) => {
      // Only update if state actually changed to prevent unnecessary re-renders
      if (loadingRef.current !== loading) {
        loadingRef.current = loading;
        setFontsLoading(loading);
        setFontsError(error);
      }
    };
    setFontLoadingCallback(callback);

    // Cleanup
    return () => {
      setFontLoadingCallback(() => {});
    };
  }, []);

  // Preload fonts immediately when user/assets are available
  // This prevents layout shift during navigation
  useEffect(() => {
    // Prevent re-running if already checked for this user/corporation
    const currentCorp = user?.corporationName || null;
    if (
      checkedRef.current &&
      userCorpRef.current === currentCorp &&
      !assetsLoading
    ) {
      return;
    }

    // Wait for auth to finish loading
    if (loading) {
      if (!user) {
        checkedRef.current = false;
        setFontsChecked(false);
      }
      return;
    }

    if (!user) {
      clearFontCache();
      loadingRef.current = false;
      checkedRef.current = true;
      userCorpRef.current = null;
      setFontsLoading(false);
      setFontsError(false);
      setFontsChecked(true);
      return;
    }

    // If user has assets, we can load fonts immediately without waiting for tenants
    // Otherwise, wait for tenants to load
    const hasUserAssets = user?.corporation?.assets;
    if (!hasUserAssets && assetsLoading) {
      // User doesn't have assets and tenants are still loading - wait
      return;
    }

    // Mark that we're checking for this corporation
    userCorpRef.current = currentCorp;
    checkedRef.current = true;
    setFontsChecked(true);

    const loadFonts = async () => {
     
      // Check if we have fonts to load
      const hasFonts =
        assets?.fonts?.body?.[0] &&
        assets?.localFonts &&
        assets.localFonts.length > 0;

      if (hasFonts) {
        // Set loading BEFORE starting async operation
        loadingRef.current = true;
        setFontsLoading(true);
        setFontsError(false);
        try {
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Font loading timeout")), 10000); // Reduced to 10 seconds
          });

          await Promise.race([preloadCorpFonts(assets), timeoutPromise]);

          // Loading state will be updated by callback
          // Don't set it here to avoid race conditions
        } catch (error: any) {
          console.error(
            "[MainStack] Error loading fonts:",
            error?.message || error,
          );
          loadingRef.current = false;
          setFontsLoading(false);
          setFontsError(true);
          // Even on error, mark as checked so UI can render
          setFontsChecked(true);
        }
      } else {
        // No fonts to load, mark as ready
        loadingRef.current = false;
        setFontsLoading(false);
        setFontsError(false);
      }
    };

    loadFonts();
  }, [user?.corporationName, assets, loading, assetsLoading]); // Use tenants.length to prevent infinite loops

  // Global navigation tracking
  useScreenTracking();

  // Updates on app active
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        if (status === "active") {
          checkForUpdates();
        }
      },
    );
    return () => subscription.remove();
  }, [checkForUpdates]);

  // Initial update check
  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        const isActive = status === "active";
        console.log("[AppState] status →", status);
        handleFocus(isActive);
      },
    );
    return () => subscription.remove();
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      const style = theme === "dark" ? "light" : "dark";
      NavigationBar.setButtonStyleAsync(style);
    }
  }, [theme]);

  if (loading || assetsLoading || !fontsChecked || fontsLoading) {
    return <ScreenLoader />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <Stack
        initialRouteName={"(tabs)"}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: background },
          ...SMOOTH_ANIMATION,
        }}
      >
        <Stack.Screen name="(auth)" options={{ ...SMOOTH_ANIMATION }} />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, ...SMOOTH_ANIMATION }}
        />
        <Stack.Screen
          name="flows"
          options={{
            headerShown: false,
            animation: "slide_from_bottom",
            ...Platform.select({
              ios: { presentation: "modal", gestureEnabled: false },
              default: {},
            }),
          }}
        />
        <Stack.Screen
          name="flow-groups"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="financial"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="contracts"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="rent-score"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="house-valuation"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="account-screen"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="contact-screen"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="policy-screen"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="repairs-screen"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="unfinished-flows"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="corporation-onboarding"
          options={{
            headerShown: false,
            ...SMOOTH_ANIMATION,
          }}
        />
      </Stack>

      <UpdateDownloadIndicator visible={isDownloading} />
      <StressTestIndicator />
    </View>
  );
}
