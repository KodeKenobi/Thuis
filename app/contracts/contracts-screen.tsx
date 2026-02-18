import FlowsListContainer from "@/components/containers/flows/flows-list-container";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import { SIZES } from "@/constants";
import { router } from "expo-router";
import React, { useState } from "react";
import { RefreshControl } from "react-native";
import ContractsListContainer from "@/components/containers/contracts/contracts-list-container";
import { useFetchContracts } from "@/service/contracts";
import { ComponentProfiler } from "@/utils/component-profiler";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";

const ContractsScreen = () => {
  const [isRefetching, setRefetching] = useState(false);
  const { contractsRefetch } = useFetchContracts({
    params: { subset: "ALL" },
  });

  return (
    <InnerScreenTemplate
      scrollableName="ContractsListContainer"
      header={{
        title: "Contract",
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
            contractsRefetch().finally(() => setRefetching(false));
          }}
        />
      }
    >
      <WithErrorBoundary
        resetKeys={[]}
        title="Kan contracten niet laden"
        description="Er is een fout opgetreden bij het laden van de contracten. Probeer het opnieuw."
      >
        <ComponentProfiler componentName="ContractsListContainer">
          <ContractsListContainer searchQuery={""} />
        </ComponentProfiler>
      </WithErrorBoundary>
      <WithErrorBoundary
        resetKeys={[]}
        title="Kan processen niet laden"
        description="Er is een fout opgetreden bij het laden van de processen. Probeer het opnieuw."
      >
        <FlowsListContainer
          header="Contract & Huurcontract beëindigen"
          group={["contract"]}
        />
      </WithErrorBoundary>
    </InnerScreenTemplate>
  );
};

export default ContractsScreen;
