import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Drawer as RNDrawerLayout } from "react-native-drawer-layout";

interface DrawerContextType {
  open: () => void;
  close: () => void;
  isOpen: boolean;
  side: "left" | "right";
}

interface PressableElementProps {
  onPress?: (...args: any[]) => void;
  children: React.ReactNode;
  [key: string]: any;
}

const DrawerContext = createContext<DrawerContextType | null>(null);

interface DrawerProps {
  children: ReactNode;
  side?: "left" | "right";
  renderDrawerContent: () => ReactNode;
}

export function Drawer({
  children,
  side = "right",
  renderDrawerContent,
}: DrawerProps) {
  const { colors: { cardBg } } = useCorporateBranding();
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <DrawerContext.Provider value={{ open, close, isOpen, side }}>
      <RNDrawerLayout
        open={isOpen}
        onOpen={open}
        onClose={close}
        drawerPosition={side}
        drawerType="slide"
        drawerStyle={{
          width: "60%",
          backgroundColor: cardBg,
        }}
        renderDrawerContent={renderDrawerContent}
      >
        <View style={styles.mainContainer}>{children}</View>
      </RNDrawerLayout>
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawer must be used within a Drawer");
  }
  return context;
}

export function DrawerTrigger({
  children,
  asChild,
}: {
  children: React.ReactElement<PressableElementProps>;
  asChild?: boolean;
}) {
  const { open } = useDrawer();

  if (asChild) {
    return React.cloneElement(children, {
      onPress: (...args: any[]) => {
        children.props.onPress?.(...args);
        open();
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={() => open()}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {children}
    </TouchableOpacity>
  );
}

export function DrawerClose({
  children,
  asChild,
}: {
  children: React.ReactElement<PressableElementProps>;
  asChild?: boolean;
}) {
  const { close } = useDrawer();

  if (asChild) {
    return React.cloneElement(children, {
      onPress: (...args: any[]) => {
        children.props.onPress?.(...args);
        close();
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={() => close()}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {children}
    </TouchableOpacity>
  );
}

interface DrawerContentProps {
  children: React.ReactNode;
  style?: object;
}

export function DrawerContent({ children, style }: DrawerContentProps) {
  const { side } = useDrawer();
  const { colors: { cardBg } } = useCorporateBranding();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        style,
        {
          borderTopLeftRadius: side === "right" ? 40 : 0,
          borderBottomLeftRadius: side === "right" ? 40 : 0,
          borderTopRightRadius: side === "left" ? 40 : 0,
          borderBottomRightRadius: side === "left" ? 40 : 0,
          backgroundColor: cardBg,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  trigger: {
    position: "absolute",
    top: 50,
    zIndex: 100,
    borderRadius: 20,
    padding: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
    borderRadius: 20,
    padding: 5,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 50,
  },
});
