import React, { useState, useMemo, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { TabView, TabBar } from "react-native-tab-view";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { SIZES } from "@/constants";
import { ThemedText } from "../ui/themed-text";

export interface TabItem {
  key: string;
  title: string;
  content: React.ReactNode;
}

interface TabTemplateProps {
  tabs: TabItem[];
  initialTabKey?: string;
  tabBarStyle?: object;
  tabLabelStyle?: object;
  onKeyChange?: (key: string) => void;
  tabKey?: string;
  scrollEnabled?: boolean;
}

const TabTemplate: React.FC<TabTemplateProps> = ({
  tabs,
  initialTabKey,
  tabBarStyle,
  tabLabelStyle,
  onKeyChange,
  tabKey,
  scrollEnabled,
}) => {
  const { colors: { primary, text, grayishColor, background, theme, white } } = useCorporateBranding();
  const initialIndex = initialTabKey
    ? Math.max(
        0,
        tabs.findIndex((t) => t.key === initialTabKey)
      )
    : 0;
  const [index, setIndex] = useState(initialIndex);
  const routes = useMemo(
    () => tabs.map(({ key, title }) => ({ key, title })),
    [tabs]
  );

  // Controlled mode: update index if tabKey changes
  useEffect(() => {
    if (tabKey) {
      const idx = tabs.findIndex((t) => t.key === tabKey);
      if (idx !== -1 && idx !== index) setIndex(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabKey, tabs]);

  // Call onKeyChange when tab changes
  useEffect(() => {
    if (onKeyChange) onKeyChange(tabs[index]?.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const renderScene = ({ route }: { route: { key: string } }) => {
    const tab = tabs.find((t) => t.key === route.key);
    return tab ? tab.content : null;
  };

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      style={[
        styles.tabBar,
        {
          backgroundColor: theme === "light" ? white : background,
        },
        tabBarStyle,
      ]}
      scrollEnabled={scrollEnabled}
      indicatorStyle={[
        styles.indicator,
        {
          backgroundColor: primary,
        },
      ]}
      activeColor={text}
      inactiveColor={grayishColor}
      renderTabBarItem={({
        route,
        style,
        activeColor,
        inactiveColor,
        navigationState,
        defaultTabWidth,
        onPress,
        onLongPress,
        onLayout,
        ...props
      }) => {
        // Determine if this tab is focused from navigationState
        const isFocused =
          navigationState.index ===
          navigationState.routes.findIndex((r) => r.key === route.key);
        const color = isFocused ? activeColor : inactiveColor;

        // Flatten style to check width
        const flattenedStyle = StyleSheet.flatten(style);
        const hasWidth = flattenedStyle?.width !== undefined;

        // Extract key from props to avoid React warning
        const { key, ...restProps } = props;

        return (
          <TouchableOpacity
            key={key} // Pass key directly, not via spread
            onPress={onPress}
            onLongPress={onLongPress}
            onLayout={onLayout}
            activeOpacity={0.7}
            style={[
              // Apply defaultTabWidth if style doesn't have width
              !hasWidth && defaultTabWidth ? { width: defaultTabWidth } : {},
              styles.tabItemContainer,
              style, // Apply TabBar's calculated style (includes width, padding, etc.)
            ]}
            {...restProps}
          >
            <View style={styles.tabItemContent}>
              <ThemedText
                weight={isFocused ? "semiBold" : "regular"}
                style={{
                  color,
                  fontSize: 14,
                }}
              >
                {route.title}
              </ThemedText>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );

  return (
    <TabView
      lazy
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: SIZES.viewport.width || 1 }}
      renderTabBar={renderTabBar}
      style={{ flex: 1 }}
    />
  );
};

const styles = StyleSheet.create({
  tabBar: {},
  indicator: {
    height: 2,
    borderRadius: 1,
  },
  tabItemContainer: {
    // Container respects width from TabBar's style prop
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48, // Ensure minimum height
  },
  tabItemContent: {
    // Content centers the text
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});

export default TabTemplate;
