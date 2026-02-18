import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Platform,
  Pressable,
} from "react-native";
import { RelativePathString, router } from "expo-router";
import { HeaderTemplate } from "../templates/header-template";
import { ThemedText } from "./themed-text";

export interface HeaderProps {
  title?: string;
  center?: React.ReactNode;
  showBackButton?: boolean;
  backDestination?: string | (() => void);
  onBackPress?: () => void;
  action?: React.ReactNode;
  headerStyle?: ViewStyle;
  headerContainerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  backButtonStyle?: ViewStyle;
  backIconStyle?: TextStyle;
  addStatusBarPadding?: boolean;
  minHeight?: "auto" | number;
  left?: React.ReactNode;
}

export const Header = ({
  title,
  showBackButton = true,
  backDestination,
  onBackPress,
  action,
  headerStyle,
  headerContainerStyle,
  titleStyle,
  backButtonStyle,
  backIconStyle,
  addStatusBarPadding,
  minHeight,
  left,
  center,
}: HeaderProps) => {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (backDestination) {
      if (typeof backDestination === "string") {
        router.replace(backDestination as RelativePathString);
      } else {
        backDestination?.();
      }
    }
  };

  return (
    <HeaderTemplate
      minHeight={minHeight}
      addStatusBarPadding={addStatusBarPadding}
      headerStyle={[headerStyle]}
      headerContainerStyle={{
        ...headerContainerStyle,
      }}
    >
      <View style={styles.section}>
        {left ? (
          left
        ) : (
          <>
            {showBackButton && (
              <Pressable
                onPress={handleBackPress}
                style={[styles.backButton, backButtonStyle]}
                testID="back-button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ThemedText style={[styles.backIcon, backIconStyle]}>
                  {"\u2039"}
                </ThemedText>
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* Center section (title) */}
      <View style={[styles.section, styles.centerSection]}>
        {center ? (
          center
        ) : (
          <>
            {title && (
              <ThemedText style={[styles.title, titleStyle]} numberOfLines={3} fontType="display">
                {title}
              </ThemedText>
            )}
          </>
        )}
      </View>

      {/* Right section (action button) */}
      <View
        style={[
          styles.section,
          { flexDirection: "row", justifyContent: "flex-end" },
        ]}
      >
        {action}
      </View>
    </HeaderTemplate>
  );
};

const styles = StyleSheet.create({
  section: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  centerSection: {
    justifyContent: "center",
    flex: 3,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    minHeight: 32,
    minWidth: 32,
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  backIcon: {
    fontSize: 30,
    lineHeight: 35,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
