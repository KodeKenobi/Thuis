import React, { useState, useCallback, useMemo } from "react";
import { useLocalSearchParams, router } from "expo-router";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { AnimatedSearch } from "@/components/ui/animated-search";
// import { HeaderTemplate } from "@/components/templates/header-template";
// import { Container } from "@/components/ui/container";
// import { IconButton } from "@/components/ui/icon-button";
import FlowsListContainer from "@/components/containers/flows/flows-list-container";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import { useGetFlowProcess } from "@/service/flows";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";

const GROUP_TITLES: Record<TFlowGroups, string> = {
  verhuren: "Verhuren",
  huurcontract: "Huurcontract beëindigen",
  reparatieverzoek: "Reparatieverzoek",
  leefbaarheid: "Leefbaarheid",
  finance: "Betalen",
  diensten: "Diensten",
  contract: "Contract",
  contact: "Contact",
  account: "Digitaal contact",
  home: "Home",
  flow: "Flow",
};

export default function FlowGroupScreen() {
  const { group, categoryId } = useLocalSearchParams<{
    group?: TFlowGroups;
    categoryId?: string;
  }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { flowProcess } = useGetFlowProcess();

  const handleSearchCancel = useCallback(() => {
    setSearchQuery("");
    setIsSearchActive(false);
  }, []);

  // Get title from category if categoryId is provided, otherwise use group
  const screenTitle = useMemo(() => {
    if (categoryId && flowProcess) {
      const category = flowProcess.find(
        (f) =>
          f.processCategoryId === categoryId ||
          f.processCategory?.id === categoryId
      )?.processCategory;
      if (category) {
        return category.label;
      }
    }
    if (group) {
      return GROUP_TITLES[group] || group;
    }
    return "Processen";
  }, [categoryId, group, flowProcess]);

  return (
    <InnerScreenTemplate
      header={{
        title: screenTitle,
        showBackButton: true,
        onBackPress: () => router.back(),
        // action: !isSearchActive ? (
        //   <Container direction="horizontal" gap={8}>
        //     <IconButton
        //       size="sm"
        //       variant="secondary"
        //       onPress={() => setIsSearchActive(true)}
        //     >
        //       <Ionicons name="search" />
        //     </IconButton>
        //   </Container>
        // ) : undefined,
      }}
      // showHeaderAction={isSearchActive}
      scrollable={false}
      // headerAction={
      //   isSearchActive ? (
      //     <HeaderTemplate>
      //       <AnimatedSearch
      //         value={searchQuery}
      //         onChangeText={setSearchQuery}
      //         onCancel={handleSearchCancel}
      //       />
      //     </HeaderTemplate>
      //   ) : undefined
      // }
    >
      <WithErrorBoundary
        resetKeys={[searchQuery, group, categoryId]}
        title="Kan processen niet laden"
        description="Er is een fout opgetreden bij het laden van de processen."
      >
        <FlowsListContainer
          header={undefined}
          scrollable
          nSkeletons={8}
          categoryId={categoryId}
          group={group ? [group] : undefined}
          filter={{ search: searchQuery }}
          showLoaderPadding
          hideIfEmpty={false}
        />
      </WithErrorBoundary>
    </InnerScreenTemplate>
  );
}
