import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import SectionTemplate from "@/components/templates/section-template";
import AnimatedCardTemplate from "@/components/templates/animated-card-template";
import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import { EmptyData } from "@/components/ui/empty-data";
import { IconButton } from "@/components/ui/icon-button";
import { useUnfinishedFlowsContext } from "@/contexts/unfinished-flows-context";
import { useGetFlowProcess } from "@/service/flows";
import { formatDate } from "@/utils";
import { SIZES } from "@/constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface UnfinishedFlowListContainerProps {
  maxItems?: number;
  showViewAll?: boolean;
  hideIfEmpty?: boolean;
  scrollable?: boolean;
}

const UnfinishedFlowListContainer: React.FC<
  UnfinishedFlowListContainerProps
> = ({ maxItems = 2, showViewAll = true, hideIfEmpty = true, scrollable }) => {
  const { bottom } = useSafeAreaInsets();
  const textStyles = useTextStyles();
  const [refreshing, setRefreshing] = useState(false);
  const { unfinishedFlows, loading, refresh, removeUnfinishedFlow } =
    useUnfinishedFlowsContext();
  const { data: flowProcesses } = useGetFlowProcess();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleResumeFlow = (flow: IUnfinishedFlow) => {
    router.push({
      pathname: "/flows/[id]",
      params: {
        id: flow.currentInstance.id,
        flowCode: flow.flowCode,
        defaultLabel: flow.flowLabel,
      },
    });
  };

  const handleDeleteFlow = async (flowId: string) => {
    try {
      await removeUnfinishedFlow(flowId);
      // The context will automatically refresh the list
    } catch (error) {
      console.error("Error removing unfinished flow:", error);
    }
  };

  const renderFlow = (flow: IUnfinishedFlow, index: number) => {
    const flowProcess = flowProcesses?.find(
      (fp) => fp.flowCode === flow.flowCode
    );

    const rightSwipe = (
      <Container
        align="center"
        direction="horizontal"
        justify="center"
        style={{
          height: "100%",
          paddingLeft: 16,
        }}
      >
        <IconButton
          size="sm"
          variant="danger"
          onPress={() => handleDeleteFlow(flow.id)}
        >
          <Ionicons name="trash-outline" size={16} />
        </IconButton>
      </Container>
    );

    return (
      <AnimatedCardTemplate index={index} key={flow.id}>
        <AvatarCardTemplate
          variant={showViewAll ? "default" : "background"}
          avatar={{
            ...(flowProcess?.defaultIcon
              ? {
                  icon: (
                    <Ionicons
                      size={20}
                      // @ts-ignore
                      name={flowProcess.defaultIcon}
                      color={flowProcess.color || "#FF9500"}
                    />
                  ),
                }
              : {
                  source: { uri: flowProcess?.iconURL },
                }),
            size: 48,
            color: flowProcess?.color || "#FF9500",
            bgAlpha: 0.15,
          }}
          rightSwipe={rightSwipe}
          onPress={() => {
            handleResumeFlow(flow);
          }}
        >
          <Container gap={4}>
            <ThemedText
              weight="semiBold"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {flow.flowLabel}
            </ThemedText>
            <ThemedText
              {...textStyles.gray}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Stap {flow.currentStep} • {formatDate(flow.lastUpdated)}
            </ThemedText>
          </Container>
        </AvatarCardTemplate>
      </AnimatedCardTemplate>
    );
  };

  // Loading state
  if (loading) {
    return <Container>{/* show skeletons */}</Container>;
  }

  const flowsToShow = unfinishedFlows.slice(0, maxItems);

  // Non-scrollable section (used for home screen with limited items)
  if (!scrollable) {
    if (hideIfEmpty && flowsToShow.length === 0) return null;
    return (
      <SectionTemplate
        title="Ongemaakte processen"
        action={
          showViewAll ? (
            <Button
              variant="link"
              title="meer"
              onPress={() => {
                router.navigate("/unfinished-flows");
              }}
            />
          ) : undefined
        }
      >
        {flowsToShow.map((flow: IUnfinishedFlow, index: number) =>
          renderFlow(flow, index)
        )}
      </SectionTemplate>
    );
  }

  // Scrollable list (for full screen)
  return (
    <FlatList
      data={unfinishedFlows}
      refreshControl={
        <RefreshControl onRefresh={handleRefresh} refreshing={refreshing} />
      }
      style={{
        flex: 1,
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding / 2,
      }}
      contentContainerStyle={[
        { flexGrow: 1 },
        unfinishedFlows.length === 0 && Platform.OS === "ios"
          ? { paddingBottom: (bottom || 0) + SIZES.padding / 2 }
          : null,
      ]}
      ListEmptyComponent={
        <Container flex={1} justify="center" align="center">
          <EmptyData
            title="Geen ongemaakte processen"
            description="Alle processen zijn voltooid"
          />
        </Container>
      }
      keyExtractor={(item) => item.id}
      renderItem={({ item: flow, index }) => renderFlow(flow, index)}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default UnfinishedFlowListContainer;
