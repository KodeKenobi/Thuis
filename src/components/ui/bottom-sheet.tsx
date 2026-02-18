import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  StyleSheet,
  Pressable,
  PressableProps,
  ViewProps,
  View,
  BackHandler,
  Platform,
  Keyboard,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
  BottomSheetFooter,
} from "@gorhom/bottom-sheet";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "./themed-text";
import { SIZES } from "@/constants";
import Ionicons from "@expo/vector-icons/Ionicons";

interface BottomSheetContextType {
  present: () => void;
  close: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextType | null>(null);
const BottomSheetContentContext = createContext<(() => void) | null>(null);

interface BottomSheetProps {
  children: ReactNode;
  snapPoints?: Array<string | number>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  footer?: (props: { close: () => void }) => ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  snapPoints = ["50%", "70%"],
  open,
  defaultOpen = false,
  onOpenChange,
  footer,
}) => {
  const { bottom, top } = useSafeAreaInsets();
  const { colors: { background, grayishColor } } = useCorporateBranding();
  const modalRef = useRef<BottomSheetModal>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  useEffect(() => {
    if (typeof open === "boolean") {
      if (open) {
        modalRef.current?.present();
        // Auto-expand to show all content
        setTimeout(() => {
          modalRef.current?.expand();
        }, 100);
      } else {
        modalRef.current?.close();
      }
      setInternalOpen(open);
    }
  }, [open]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      onOpenChange?.(isOpen);
      setInternalOpen(isOpen);
    },
    [onOpenChange]
  );

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (internalOpen) {
          modalRef.current?.close();
          handleOpenChange(false);
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [internalOpen, handleOpenChange]);

  const present = () => {
    modalRef.current?.present();
    modalRef.current?.expand();
    handleOpenChange(true);
  };

  const close = useCallback(() => {
    modalRef.current?.forceClose();
    handleOpenChange(false);
  }, []);

  const childArray = React.Children.toArray(children);
  const inlineChildren: ReactNode[] = [];
  const modalChildren: ReactNode[] = [];

  childArray.forEach((child) => {
    if (!React.isValidElement(child)) {
      inlineChildren.push(child);
      return;
    }
    const element = child as React.ReactElement<{ children?: ReactNode }>;
    const type = element.type as any;

    if (type.displayName === "BottomSheetContent") {
      modalChildren.push(element.props.children);
    } else {
      inlineChildren.push(element);
    }
  });

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheetContext.Provider value={{ present, close }}>
      {inlineChildren}
      <BottomSheetModal
        ref={modalRef}
        index={snapPoints.length > 0 ? snapPoints.length - 1 : 0}
        snapPoints={snapPoints.length > 0 ? snapPoints : undefined}
        /** CRITICAL: respect iOS status bar/safe-area */
        topInset={top}
        /** Make the sheet push content instead of overlaying status bar layers */
        stackBehavior="push"
        /** Keyboard behavior that prevents the “blank space above keyboard” on iOS */
        keyboardBehavior={Platform.OS === "ios" ? "interactive" : "extend"}
        keyboardBlurBehavior="restore"
        /** Android must resize, not pan, to avoid awkward overlaps */
        android_keyboardInputMode="adjustResize"
        enablePanDownToClose
        enableContentPanningGesture
        enableHandlePanningGesture
        enableBlurKeyboardOnGesture
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={[
          styles.sheetBackground,
          { backgroundColor: background },
        ]}
        handleIndicatorStyle={[
          styles.handleIndicator,
          { backgroundColor: grayishColor },
        ]}
        footerComponent={
          footer
            ? ({ animatedFooterPosition }) => (
                <BottomSheetFooter
                  animatedFooterPosition={animatedFooterPosition}
                  bottomInset={0}
                  style={{
                    backgroundColor: background,
                    paddingTop: 0,
                    paddingBottom: bottom,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: grayishColor,
                  }}
                >
                  {footer?.({ close })}
                </BottomSheetFooter>
              )
            : undefined
        }
        onChange={(index) => {
          handleOpenChange(index >= 0);
        }}
      >
        <BottomSheetContentContext.Provider value={close}>
          {modalChildren}
        </BottomSheetContentContext.Provider>
      </BottomSheetModal>
    </BottomSheetContext.Provider>
  );
};

/* ---------------- Marker Components ---------------- */
interface BottomSheetContentProps {
  children?: ReactNode;
}
export const BottomSheetContent: React.FC<BottomSheetContentProps> = ({
  children,
}) => <>{children}</>;
BottomSheetContent.displayName = "BottomSheetContent";

interface BottomSheetHeaderProps extends ViewProps {
  title?: string;
  children?: ReactNode;
}

export const BottomSheetHeader: React.FC<BottomSheetHeaderProps> = ({
  title,
  children,
  ...rest
}) => {
  const { colors: { background } } = useCorporateBranding();
  return (
    <BottomSheetView
      {...rest}
      style={[
        {
          zIndex: 1,
          backgroundColor: background,
          ...(rest.style as any),
        },
      ]}
    >
      <View
        style={{
          paddingHorizontal: SIZES.padding,
          paddingTop: 12,
          paddingBottom: 4,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            minHeight: 24,
            maxHeight: 48,
          }}
        >
          {title && (
            <ThemedText
              style={styles.bottomSheetTitle}
              numberOfLines={2}
              ellipsizeMode="tail"
              maxFontSizeMultiplier={1.2}
            >
              {title}
            </ThemedText>
          )}
          <BottomSheetClose
            style={{
              position: "absolute",
              right: SIZES.padding - 10,
              top: 0,
            }}
          >
            <Ionicons name="close" size={24} color="#666" />
          </BottomSheetClose>
        </View>
        {children && (
          <View style={{ paddingTop: 8, paddingBottom: 8 }}>{children}</View>
        )}
      </View>
    </BottomSheetView>
  );
};

interface BottomSheetTriggerProps extends PressableProps {
  children: ReactNode;
  asChild?: boolean;
}
export const BottomSheetTrigger: React.FC<BottomSheetTriggerProps> = ({
  children,
  asChild = false,
  ...rest
}) => {
  const ctx = useContext(BottomSheetContext);
  if (!ctx) return null;

  const handlePress = (e: any) => {
    // Dismiss keyboard on iOS before opening bottom sheet
    // This prevents keyboard from staying visible above the bottom sheet

    Keyboard.dismiss();

    ctx.present();
    rest.onPress?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      onPress: handlePress,
      ...rest,
    });
  }

  return (
    <Pressable {...rest} onPress={handlePress}>
      {children}
    </Pressable>
  );
};

interface BottomSheetCloseProps extends PressableProps {
  children?: ReactNode;
  asChild?: boolean;
}
export const BottomSheetClose: React.FC<BottomSheetCloseProps> = ({
  children,
  asChild = false,
  ...rest
}) => {
  const _sheetClose = useContext(BottomSheetContentContext);
  if (!_sheetClose)
    throw new Error("BottomSheetClose must be inside BottomSheet");

  const handlePress = (e: any) => {
    _sheetClose();

    if (React.isValidElement(children)) {
      const childProps = children.props as { onPress?: (e: any) => void };
      childProps.onPress?.(e);
    }

    rest.onPress?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      onPress: handlePress,
      ...rest,
    });
  }

  return (
    <Pressable {...rest} onPress={handlePress}>
      {children}
    </Pressable>
  );
};

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  sheetBackground: { borderRadius: 16, borderCurve: "continuous" },
  handleIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 8,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 40,
    lineHeight: 24,
  },
});
