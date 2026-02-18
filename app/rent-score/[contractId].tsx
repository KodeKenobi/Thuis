import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import RentsPeriodContainer from "@/components/containers/rents/rents-period-container";
import { SIZES } from "@/constants";

const RentScoreScreen = () => {
  const { contractId } = useLocalSearchParams<{
    contractId: string;
  }>();

  return (
    <InnerScreenTemplate
      header={{
        title: "Huuropbouw",
        backDestination: () => router.back(),
      }}
      contentStyle={{
        flexGrow: 1,
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding / 2,
        gap: 24,
      }}
      scrollable={false}
    >
      <RentsPeriodContainer contractId={contractId} />
    </InnerScreenTemplate>
  );
};

export default RentScoreScreen;
