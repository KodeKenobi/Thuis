import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet";
import { ChatFab } from "@/components/ui/chat-bubble";
import { ChatWebViewContainer } from "./chat";
import ChatScreenTemplateSkeleton from "@/components/templates/chat-screen-template-skeleton";
import { notifyToast } from "@/config/toast";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

interface ChatBottomSheetContainerProps {
  config: IChatConfig | null | undefined;
  loading?: boolean;
  error?: string | null;
}

export const ChatBottomSheetContainer: React.FC<
  ChatBottomSheetContainerProps
> = ({ config, loading, error }) => {
  const { colors: { secondary } } = useCorporateBranding();
  const [open, setOpen] = useState(false);

  const disabled = config === null || !!error;

  const handlePressFab = useCallback(() => {
    if (disabled) {
      if (error) {
        notifyToast({
          props: {
            type: "error",
            message: error,
          },
        });
      }
      return;
    }
    setOpen(true);
  }, [disabled, error]);

  return (
    <BottomSheet
      open={open}
      onOpenChange={setOpen}
      defaultOpen={false}
      snapPoints={["90%"]}
    >
      <BottomSheetTrigger asChild>
        <ChatFab
          disabled={disabled}
          loading={loading}
          onPress={handlePressFab}
        />
      </BottomSheetTrigger>

      <BottomSheetContent>
        <BottomSheetHeader title="Live chat" />
        <BottomSheetView
          style={[styles.content, { borderTopColor: secondary, paddingTop: 50 }]}
        >
          {loading ? (
            <ChatScreenTemplateSkeleton rows={8} showHeader showComposer />
          ) : config ? (
            <ChatWebViewContainer
              config={config as IChatConfig}
              style={{ display: open ? "flex" : "none" }}
              onLcwEvent={(evt) => {
                if (evt === "closed" || evt === "minimized") setOpen(false);
              }}
            />
          ) : (
            <View />
          )}
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    borderTopWidth: 0,
  },
});
