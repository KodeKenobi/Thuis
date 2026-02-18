import React, { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "../ui/themed-view";
import { Header, HeaderProps } from "../ui/header";
import AnimatedReveal from "../ui/animated-reveal";
import { Container } from "../ui/container";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import Toast from "react-native-toast-message";
import { toastModalConfig } from "@/config/toast";
import { registerScrollable } from "@/utils/scroll-helper";
import { SIZES } from "@/constants";

type InnerScreenTemplateProps = {
  header: HeaderProps;
  headerAction?: ReactNode;
  showHeaderAction?: boolean;
  footer?: ReactNode;
  footerKey?: string;
  scrollable?: boolean;
  scrollableName?: string;
  children?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?:
    | React.ReactElement<
        RefreshControlProps,
        string | React.JSXElementConstructor<any>
      >
    | undefined;
  stickyHeaderIndices?: number[];
  hasModalToast?: boolean;
};

const InnerScreenTemplate = ({
  header,
  children,
  footer,
  footerKey,
  contentStyle,
  refreshControl,
  headerAction,
  showHeaderAction = false,
  scrollable = true,
  scrollableName,
  stickyHeaderIndices,
  hasModalToast,
}: InnerScreenTemplateProps) => {
  const { bottom, top } = useSafeAreaInsets();
  const { colors: { cardBg, background } } = useCorporateBranding();

  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollableName && scrollable) {
      registerScrollable(scrollableName, {
        scrollTo: (options) => scrollRef.current?.scrollTo(options),
        scrollToEnd: (options) => scrollRef.current?.scrollToEnd(options),
      });
      return () => registerScrollable(scrollableName, null);
    }
  }, [scrollableName, scrollable]);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const onShow = () => setKeyboardVisible(true);
    const onHide = () => setKeyboardVisible(false);
    const subs = [
      Keyboard.addListener("keyboardWillShow", onShow),
      Keyboard.addListener("keyboardDidShow", onShow),
      Keyboard.addListener("keyboardWillHide", onHide),
      Keyboard.addListener("keyboardDidHide", onHide),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  // When keyboard is up on iOS: absolutely no bottom padding or inset.
  const bottomPad = useMemo(() => {
    if (Platform.OS === "ios" && keyboardVisible) return 0;
    return bottom + SIZES.padding / 2 || 0;
  }, [bottom, keyboardVisible]);

  // Footer also must not push content when keyboard is visible.
  const footerPad = useMemo(() => {
    if (Platform.OS === "ios" && keyboardVisible) return 24;
    return 24 + (bottom || 0);
  }, [bottom, keyboardVisible]);

  // Use HEIGHT while keyboard visible to prevent extra safe-area padding stacking.
  const avoidingBehavior =
    Platform.OS === "ios"
      ? keyboardVisible
        ? "height"
        : "padding"
      : undefined;

  return (
    <ThemedView style={{ flex: 1 }} pointerEvents="box-none">
      {hasModalToast && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: "transparent",
          }}
          pointerEvents="box-none"
        >
          <Toast config={toastModalConfig} />
        </View>
      )}

      {/* HEADER */}
      <View style={{ backgroundColor: background || "#fff" }}>
        <View key="header-content">
          {showHeaderAction ? headerAction : <Header {...header} />}
        </View>
      </View>

      {/* CONTENT */}
      {scrollable ? (
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: background }}
          behavior={avoidingBehavior}
          // No extra offset; offset + bottom padding is what causes the last sliver.
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1, backgroundColor: background }}
            // Kill all auto insets to avoid invisible padding on iOS
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            automaticallyAdjustsScrollIndicatorInsets={false}
            // Explicitly force contentInset bottom to 0 while keyboard visible

            scrollIndicatorInsets={{
              bottom: Platform.OS === "ios" && keyboardVisible ? 0 : bottomPad,
            }}
            keyboardShouldPersistTaps="handled"
            stickyHeaderIndices={stickyHeaderIndices}
            refreshControl={refreshControl}
            contentContainerStyle={[
              {
                flexGrow: 1,
                paddingBottom: footer
                  ? (Platform.OS === "ios" && keyboardVisible ? 0 : bottomPad) +
                    80
                  : bottomPad,
              },
              contentStyle,
            ]}
          >
            {children}
          </ScrollView>

          {/* FOOTER (stays visible but doesn't add safe-area when keyboard is up) */}
          {footer && (
            <AnimatedReveal
              key={footerKey}
              style={{
                paddingTop: 24,
                paddingHorizontal: 24,
                paddingBottom: footerPad,
                backgroundColor: cardBg,
                shadowColor: "#00000050",
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                overflow: "visible",
              }}
              pointerEvents="box-none"
              collapsable={false}
            >
              {footer}
            </AnimatedReveal>
          )}
        </KeyboardAvoidingView>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: background }}
          behavior={Platform.OS === "ios" ? avoidingBehavior : "padding"}
          keyboardVerticalOffset={0}
        >
          <Container
            style={[
              {
                flex: 1,
                // Only add bottom padding when there's a footer to make room for it
                paddingBottom: footer
                  ? (Platform.OS === "ios" && keyboardVisible ? 0 : bottomPad) +
                    80
                  : 0, // No bottom padding when no footer - content should extend to bottom
              },
              contentStyle,
            ]}
          >
            {children}
          </Container>

          {/* FOOTER (stays visible but doesn't add safe-area when keyboard is up) */}
          {footer && (
            <AnimatedReveal
              key={footerKey}
              style={{
                paddingTop: 24,
                paddingHorizontal: 24,
                paddingBottom: footerPad,
                backgroundColor: cardBg,
                shadowColor: "#00000050",
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                overflow: "visible",
              }}
              pointerEvents="box-none"
              collapsable={false}
            >
              {footer}
            </AnimatedReveal>
          )}
        </KeyboardAvoidingView>
      )}
    </ThemedView>
  );
};

export default InnerScreenTemplate;
