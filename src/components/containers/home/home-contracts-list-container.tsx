import React from "react";
import SectionTemplate from "@/components/templates/section-template";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import ContractsListContainer from "../contracts/contracts-list-container";
import { useFetchContracts } from "@/service/contracts";

const HomeContractsListContainer = () => {
  const { contracts, contractsError, contractsLoading } = useFetchContracts({
    params: { subset: "ALL" },
  });

  if (!contracts?.length && !contractsLoading && !contractsError) return null;

  return (
    <SectionTemplate
      title="Contracten"
      action={
        <Button
          variant="link"
          title="meer"
          onPress={() => router.push("/contracts/contracts-screen")}
        />
      }
    >
      <ContractsListContainer hideIfEmpty n={2} avatarCardVariant="default" />
    </SectionTemplate>
  );
};

export default HomeContractsListContainer;
