import FlowsListContainer from "@/components/containers/flows/flows-list-container";
import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import { Container } from "@/components/ui/container";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";
import { SIZES } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { useChatService } from "@/service/chat";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { RefreshControl, TouchableOpacity } from "react-native";

const ContactScreen = () => {
  const textStyles = useTextStyles();
  const { user, environment } = useAuth();
  const [isRefetching, setRefetching] = useState(false);
  const corp = useMemo(
    () => user?.corporationKey ?? user?.corporationName,
    [user?.corporationKey, user?.corporationName]
  );
  const { data: config, refetch } = useChatService(corp, {
    __env: environment,
  } as any);

  return (
    <InnerScreenTemplate
      header={{
        title: "Klachten en Complimenten & Contact",
        backDestination: () => router.back(),
      }}
      contentStyle={{
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding / 2,
        gap: 24,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            setRefetching(true);
            refetch().finally(() => setRefetching(false));
          }}
        />
      }
    >
      <WithErrorBoundary
        resetKeys={[config?.LIVECHAT_ORG_ID]}
        title="Kan contactmogelijkheden niet laden"
        description="Er is een fout opgetreden bij het laden van de contactmogelijkheden."
      >
        <FlowsListContainer header="Contactmogelijkheden" group={["contact"]} />
      </WithErrorBoundary>

      {config ? (
        <TouchableOpacity onPress={() => router.push("/chat/chat-screen")}>
          <AvatarCardTemplate
            variant="background"
            avatar={{
              size: 48,
              variant: "custom",
              icon: "chatbubble-ellipses",
              backgroundColor: "#E3F2FD",
              color: "#1976D2",
            }}
          >
            <Container flex={1}>
              <ThemedText {...textStyles.body} weight="semiBold">
                Live Chat
              </ThemedText>
              <ThemedText {...textStyles.gray}>
                Chat direct met een medewerker
              </ThemedText>
            </Container>
          </AvatarCardTemplate>
        </TouchableOpacity>
      ) : null}
    </InnerScreenTemplate>
  );
};

export default ContactScreen;
