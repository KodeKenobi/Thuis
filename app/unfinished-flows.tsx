import React from "react";
import { router } from "expo-router";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import { Button } from "@/components/ui/button";
import UnfinishedFlowListContainer from "@/components/containers/unfinished-flows/unfinished-flow-list-container";
import { useUnfinishedFlowsContext } from "@/contexts/unfinished-flows-context";
import { ComponentProfiler } from "@/utils/component-profiler";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";

const UnfinishedFlowsScreen: React.FC = () => {
  const { clearAllUnfinishedFlows } = useUnfinishedFlowsContext();

  const handleClearAll = async () => {
    try {
      await clearAllUnfinishedFlows();
    } catch (error) {
      console.error("Error clearing all unfinished flows:", error);
    }
  };

  return (
    <InnerScreenTemplate
      header={{
        title: "Ongemaakte processen",
        backDestination: () => router.back(),
      }}
      headerAction={
        <Button variant="link" title="Wis alles" onPress={handleClearAll} />
      }
      scrollable={false}
    >
      <WithErrorBoundary
        resetKeys={[]}
        title="Kan ongemaakte processen niet laden"
        description="Er is een fout opgetreden bij het laden van de ongemaakte processen. Probeer het opnieuw."
      >
        <ComponentProfiler componentName="UnfinishedFlowListContainer">
          <UnfinishedFlowListContainer
            scrollable={true}
            hideIfEmpty={false}
            showViewAll={false}
          />
        </ComponentProfiler>
      </WithErrorBoundary>
    </InnerScreenTemplate>
  );
};

export default UnfinishedFlowsScreen;
