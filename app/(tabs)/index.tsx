import HomeContractsListContainer from "@/components/containers/home/home-contracts-list-container";
import HomeFlowsListContainer from "@/components/containers/home/home-flows-list-container";
import HomeNewsListContainer from "@/components/containers/home/home-news-list-container";
import { HomeWelcomeHeaderContainer } from "@/components/containers/home/home-welcome-header-container";
// import UnfinishedFlowListContainer from "@/components/containers/unfinished-flows/unfinished-flow-list-container";
import { ThemedView } from "@/components/ui/themed-view";
import { SIZES } from "@/constants";
import { registerScrollable } from "@/utils/scroll-helper";
import React, { useRef, useEffect } from "react";
import { ScrollView } from "react-native";
import { ComponentProfiler } from "@/utils/component-profiler";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

const HomeScreen: React.FC = () => {
  const {
    colors: { background },
  } = useCorporateBranding();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    registerScrollable("HomeScreen", {
      scrollTo: (options) => scrollRef.current?.scrollTo(options),
      scrollToEnd: (options) => scrollRef.current?.scrollToEnd(options),
    });
    return () => registerScrollable("HomeScreen", null);
  }, []);

  return (
    <ComponentProfiler componentName="HomeScreen">
      <ThemedView style={{ flex: 1 }}>
        <HomeWelcomeHeaderContainer />
        {/* <HomeActionsContainer /> */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, gap: 24, backgroundColor: background }}
          contentContainerStyle={{
            gap: 24,
            paddingVertical: SIZES.padding / 2,
            paddingHorizontal: SIZES.padding,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* <UnfinishedFlowListContainer hideIfEmpty={true} /> */}
          <WithErrorBoundary
            resetKeys={[]}
            title="Kan contracten niet laden"
            description="Er is een fout opgetreden bij het laden van de contracten."
          >
            <HomeContractsListContainer />
          </WithErrorBoundary>
          <WithErrorBoundary
            resetKeys={[]}
            title="Kan processen niet laden"
            description="Er is een fout opgetreden bij het laden van de processen."
          >
            <HomeFlowsListContainer />
          </WithErrorBoundary>
          <WithErrorBoundary
            resetKeys={[]}
            title="Kan nieuws niet laden"
            description="Er is een fout opgetreden bij het laden van het nieuws."
          >
            <HomeNewsListContainer />
          </WithErrorBoundary>
        </ScrollView>
        {/* 
      <TenantAwareChat /> */}
      </ThemedView>
    </ComponentProfiler>
  );
};

export default HomeScreen;
