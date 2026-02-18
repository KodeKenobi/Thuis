import { Tabs, Redirect, useSegments } from "expo-router";
import React, { useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Drawer } from "@/components/ui/drawer";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DrawerNavigation } from "@/components/ui/drawer-navigation";
import { MENU_ITEMS } from "@/data/menu-items";
import { Platform, StyleSheet, View } from "react-native";
import { REPAIR_AS_CASES_CORPORATIONS_CONFIG } from "@/config/repair-cases-config";
import { useGetTenants } from "@/service/tenants";
import { useFetchAppConfig } from "@/service/app-config";

import { logEvent, trackScreen } from "@/config/analytics";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

function useTabTracking() {
  const rawSegments = useSegments();

  const segments = Array.from(rawSegments || []);

  useEffect(() => {
    if (segments.length < 2) return;
    if (segments[0] !== "(tabs)") return;

    const tabName = segments[1] || "unknown";

    logEvent("tab_changed", { tab: tabName });
    trackScreen(`tab_${tabName}`);
  }, [segments.join("/")]);
}

const smoothTransition = {
  animation: "fade" as const,
  animationDuration: 150,
};

export default function TabLayout() {
  const { user, corporationOnboarded } = useAuth();
  const { tenants } = useGetTenants({});

  const {
    getCorpFont,
    colors: { primary, text, background, theme, white, black },
  } = useCorporateBranding();

  const corpFont = useMemo(() => {
    return getCorpFont("body");
  }, [getCorpFont]);

  useTabTracking();

  const corporationName = (user?.corporationName || "").toUpperCase();

  const tenant = useMemo(() => {
    return tenants?.find((tenant) => tenant.name === user?.corporationName);
  }, [tenants, user?.corporationName]);

  const isRepairAsCasesCorp =
    REPAIR_AS_CASES_CORPORATIONS_CONFIG.includes(corporationName);

  const casesTab = isRepairAsCasesCorp ? "Reparaties" : "Zaken";
  const visibleMenuItems = isRepairAsCasesCorp
    ? MENU_ITEMS.filter((item) => item.label !== "Reparaties")
    : MENU_ITEMS;

  const {} = useFetchAppConfig({});

  if (!user) return <Redirect href="/(auth)" />;

  if (
    (corporationOnboarded?.id !== user?.custId ||
      user?.corporationName !== corporationOnboarded?.corporationName) &&
    tenant?.onboardingScreens?.length
  ) {
    return <Redirect href="/corporation-onboarding" />;
  }

  return (
    <Drawer
      side="left"
      renderDrawerContent={() => (
        <DrawerNavigation menuItems={visibleMenuItems} />
      )}
    >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: primary,
          tabBarInactiveTintColor: text,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            ...(corpFont ? { fontFamily: corpFont } : {}),
          },
          tabBarStyle: {
            backgroundColor: theme === "light" ? white : background,
            shadowRadius: 2,
            shadowOffset: { width: 1, height: 2 },
            elevation: 5,
            shadowOpacity: 1,
            ...(theme === "dark"
              ? {
                  borderColor: "transparent",
                  shadowColor: white,
                }
              : {
                  elevation: 10,
                  shadowColor: black,
                  shadowOpacity: Platform.select({
                    ios: 0.5,
                    android: 1,
                  }),
                }),
          },
          tabBarBackground: () => (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: background,
              }}
            />
          ),
          ...smoothTransition,
          animation: "shift",
          sceneStyle: { backgroundColor: background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Thuis",
            headerShown: false,
            ...smoothTransition,
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="flows-screen"
          options={{
            title: "Regelen",
            headerShown: false,
            ...smoothTransition,
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-outline" color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="cases-screen"
          options={{
            title: casesTab,
            headerShown: false,
            ...smoothTransition,
            tabBarIcon: ({ color }) => (
              <Ionicons name="document-text-outline" color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="posts-screen"
          options={{
            title: "Post",
            headerShown: false,
            ...smoothTransition,
            tabBarIcon: ({ color }) => (
              <Ionicons name="mail-outline" color={color} size={24} />
            ),
          }}
        />
      </Tabs>
    </Drawer>
  );
}
