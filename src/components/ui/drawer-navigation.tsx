import { useDrawerProgress } from "react-native-drawer-layout";
import { router } from "expo-router";
import React, { ReactNode, useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import Animated, {
  FadeInRight,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { useTextStyles, ThemedText } from "./themed-text";
import { IconButton } from "./icon-button";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/contexts/auth-context";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import Avatar from "./avatar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DetailContentItem } from "./detail-content";
import { REPAIR_AS_CASES_CORPORATIONS_CONFIG } from "@/config/repair-cases-config";
import { useFetchCases } from "@/service/cases";
import Skeleton from "./skeleton";
import { useDrawer } from "@/components/ui/drawer";

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/* ────────────────────────────── Drawer Menu Item ────────────────────────────── */
interface DrawerMenuItemProps {
  item: {
    path: string;
    label: string;
    icon: ReactNode;
  };
  index: number;
  drawerProgress: SharedValue<number>;
}

const DrawerMenuItem: React.FC<DrawerMenuItemProps> = ({
  item,
  index,
  drawerProgress,
}) => {
  const { close } = useDrawer();

  const animatedStyle = useAnimatedStyle(() => {
    const p = drawerProgress.value ?? 0;
    const delay = index * 0.05;
    const itemProgress = Math.max(0, Math.min(1, (p - delay) / 0.5));
    const translateX = interpolate(itemProgress, [0, 1], [0, 20]);
    // Keep opacity always 1 (iOS fix)
    return { transform: [{ translateX }], opacity: 1 };
  });

  const handlePress = () => {
    close();
    router.push(item.path as any);
  };

  return (
    <AnimatedTouchable
      style={[styles.itemContainer, styles.item, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <IconButton
        size="sm"
        style={{ borderRadius: "100%" }}
        onPress={handlePress}
      >
        {item.icon}
      </IconButton>
      <ThemedText style={styles.label}>{item.label}</ThemedText>
    </AnimatedTouchable>
  );
};

/* ────────────────────────────── Skeleton Row ────────────────────────────── */
interface DrawerMenuSkeletonProps {
  index: number;
  drawerProgress: SharedValue<number>;
}

const DrawerMenuSkeleton: React.FC<DrawerMenuSkeletonProps> = ({
  index,
  drawerProgress,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const p = drawerProgress.value ?? 0;
    const delay = index * 0.05;
    const itemProgress = Math.max(0, Math.min(1, (p - delay) / 0.5));
    const translateX = interpolate(itemProgress, [0, 1], [0, 20]);
    return { transform: [{ translateX }], opacity: 1 };
  });

  return (
    <AnimatedView style={[styles.itemContainer, styles.item, animatedStyle]}>
      <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
      <Skeleton width={100} height={20} />
    </AnimatedView>
  );
};

/* ────────────────────────────── Navigation ────────────────────────────── */
type DrawerNavigationProps = {
  menuItems: {
    path: string;
    label: string;
    icon: ReactNode;
    sort: number;
  }[];
};

export const DrawerNavigation = ({ menuItems }: DrawerNavigationProps) => {
  const textStyles = useTextStyles();
  const drawerProgress = useDrawerProgress(); // shared value
  const { top } = useSafeAreaInsets();
  const { colors: { grayishColor, errorColor } } = useCorporateBranding();

  const { signOut, user, userData } = useAuth();

  const { cases: allCases, casesLoading } = useFetchCases({
    params: { subset: "all" },
  });

  const casesTab = REPAIR_AS_CASES_CORPORATIONS_CONFIG.includes(
    user?.corporationName as string
  )
    ? "Zaken"
    : "Reparaties";

  const rewrittenMenu = useMemo(() => {
    return menuItems
      ?.map((item) => {
        if (item.label === "Reparaties") {
          const path = "/repairs-screen";
          return { ...item, label: casesTab, path };
        }
        return item;
      })
      ?.slice()
      .sort((a, b) => a.sort - b.sort);
  }, [menuItems, casesTab]);

  const newMenuItems = useMemo(() => {
    const seen = new Set<string>();
    return rewrittenMenu.filter((it) => {
      if (it.label === "Zaken" || it.label === "Reparaties") {
        if ((allCases?.length ?? 0) === 0) return false;
      }
      if (seen.has(it.path)) return false;
      seen.add(it.path);
      return true;
    });
  }, [rewrittenMenu, allCases]);

  // Signout row (stagger index at end)
  const signoutIndex = newMenuItems.length;
  const signoutAnimatedStyle = useAnimatedStyle(() => {
    const p = drawerProgress.value ?? 0;
    const delay = signoutIndex * 0.05;
    const itemProgress = Math.max(0, Math.min(1, (p - delay) / 0.5));
    const translateX = interpolate(itemProgress, [0, 1], [0, 20]);
    return { transform: [{ translateX }], opacity: 1 };
  });

  const { close } = useDrawer();

  const handleSignOut = () => {
    close();
    signOut();
  };

  return (
    <AnimatedScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <AnimatedView
        entering={FadeInRight.duration(200)}
        style={[
          styles.header,
          {
            backgroundColor: grayishColor + "10",
            paddingTop: Platform.select({ ios: top, android: top + 20 }),
          },
        ]}
      >
        <TouchableOpacity
          style={{ flex: 1, gap: 12 }}
          onPress={() => {
            close();
            router.navigate("/account-screen");
          }}
        >
          <Avatar
            size={60}
            color={grayishColor}
            fallback={userData?.name || user?.fullName || user?.name}
          />
          <DetailContentItem
            direction="vertical"
            gap={1}
            justify="center"
            label={
              <ThemedText {...textStyles.body} size="md" numberOfLines={1}>
                {userData?.name || user?.fullName || user?.name}
              </ThemedText>
            }
            content={
              <ThemedText {...textStyles.gray} size="sm" numberOfLines={1}>
                {userData?.emailaddress1 || user?.email}
              </ThemedText>
            }
          />
        </TouchableOpacity>
      </AnimatedView>

      {casesLoading
        ? Array.from({ length: newMenuItems.length || 5 }).map((_, index) => (
            <DrawerMenuSkeleton
              key={`skeleton-${index}`}
              index={index}
              drawerProgress={drawerProgress}
            />
          ))
        : newMenuItems.map((item, index) => (
            <DrawerMenuItem
              key={item.path}
              item={item}
              index={index}
              drawerProgress={drawerProgress}
            />
          ))}

      <AnimatedView
        key={"signout"}
        style={[styles.itemContainer, signoutAnimatedStyle]}
      >
        <TouchableOpacity
          style={styles.item}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <IconButton
            size="sm"
            style={{ borderRadius: "100%" }}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" />
          </IconButton>
          <ThemedText style={[styles.label, { color: errorColor }]}>
            Uitloggen
          </ThemedText>
        </TouchableOpacity>
      </AnimatedView>
    </AnimatedScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemContainer: {
    marginBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 12,
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
});
