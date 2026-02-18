import SectionTemplate from "@/components/templates/section-template";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import React, { useState } from "react";
import FlowsListContainer from "../flows/flows-list-container";
import { useGetFlowProcess } from "@/service/flows";
import { getActiveContracts, isFlowDisabled } from "@/utils";
import { useFetchContracts } from "@/service/contracts";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";

const HomeFlowsListContainer = () => {
  const [value, setValue] = useState("");
  const { flowProcess, flowProcessError, flowProcessLoading } =
    useGetFlowProcess({});
  const { contracts } = useFetchContracts({
    params: { subset: "ACTIEF" },
  });
  const activeContracts = getActiveContracts(contracts || []);
  const hasHomeFlows = flowProcess?.find(
    (flow) =>
      flow.groups.includes("home") && !isFlowDisabled(flow, activeContracts)
  );
  if (!hasHomeFlows && !flowProcessLoading && !flowProcessError) return null;
  return (
    <SectionTemplate
      title="Regelen"
      action={
        <Button
          variant="link"
          title="meer"
          onPress={() => {
            router.navigate("/(tabs)/flows-screen");
          }}
        />
      }
    >
      <WithErrorBoundary
        resetKeys={[flowProcess?.length]}
        title="Kan processen niet laden"
        description="Er is een fout opgetreden bij het laden van de processen."
      >
        <FlowsListContainer
          cardProps={{
            variant: "default",
          }}
          group={["home"]}
          nSkeletons={2}
          hideIfEmpty
        />
      </WithErrorBoundary>
    </SectionTemplate>
  );
};

export default HomeFlowsListContainer;
