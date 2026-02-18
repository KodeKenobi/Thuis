import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/auth-context";
import { useChatService } from "@/service/chat";
import { Header } from "@/components/ui/header";
import { ChatWebViewContainer } from "@/components/containers/chat/chat";
import { SIZES } from "@/constants";
import { router } from "expo-router";
import ChatScreenTemplateSkeleton from "@/components/templates/chat-screen-template-skeleton";
import { notifyToast } from "@/config/toast";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

export const ChatFullScreenContainer: React.FC<{
  corporationName?: string;
  selectedContract?: any;
  username?: string;
}> = ({ corporationName, selectedContract, username }) => {
  const { user, environment } = useAuth();
  const { colors: { background, white, theme } } = useCorporateBranding();

  const corp = useMemo(
    () => user?.corporationKey ?? corporationName ?? user?.corporationName,
    [user?.corporationKey, corporationName, user?.corporationName]
  );

  const { data: config, isLoading, isFetching, error } = useChatService(
    corp,
    { __env: environment } as any
  );

  const handleBack = () => {
    if (router?.canGoBack?.()) router.back();
    else router.replace("/(tabs)");
  };

  useEffect(() => {
    if (error) {
      notifyToast({
        props: {
          type: "error",
          message: (error as Error)?.message || "Er is iets misgegaan.",
        },
      });
      handleBack();
    } else if (!isLoading && !isFetching && config === null) {
      notifyToast({
        props: {
          type: "warning",
          message: "Livechat niet beschikbaar voor deze corporatie.",
        },
      });
      handleBack();
    }
  }, [error, config, isLoading, isFetching]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === "light" ? white : background },
      ]}
    >
      <Header
        title="Chat"
        addStatusBarPadding
        showBackButton
        backDestination={handleBack}
      />

      <View style={styles.body}>
        {isLoading || isFetching ? (
          <ChatScreenTemplateSkeleton
            rows={10}
            showHeader={false}
            showComposer={true}
          />
        ) : config ? (
          <ChatWebViewContainer
            config={config}
            userName={username}
            contract={selectedContract}
          />
        ) : (
          <View />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  body: { 
    flex: 1 
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SIZES.padding,
  },
  title: { 
    fontSize: 16, 
    fontWeight: "600", 
    marginBottom: 6 
  },
  subtle: { 
    fontSize: 14, 
    opacity: 0.7, 
    textAlign: "center" 
  },
});
