import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import {
  useFetchHouseValuationDetails,
  useFetchHouseValuationForRelatie,
} from "@/service/valuation";
import { formatErrorMessage } from "@/utils";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import ScreenLoader from "@/components/ui/screen-loader";
import { EmptyData } from "@/components/ui/empty-data";
import { RefreshControl } from "react-native";
import { Container } from "@/components/ui/container";
import HouseValuationContainer from "@/components/containers/house-valuation/house-valuation-container";
import { SIZES } from "@/constants";

const HouseValuation = () => {
  const { unitId } = useLocalSearchParams<{
    unitId: string;
  }>();
  const [loading, setLoading] = useState(false);
  const [isRefetching, setRefetching] = useState(false);

  const {
    houseValuationDetails,
    houseValuationDetailsError,
    houseValuationDetailsLoading,
    houseValuationDetailsRefetch,
  } = useFetchHouseValuationDetails({
    params: { unitId },
  });

  const isLoading = loading || houseValuationDetailsLoading;

  const renderContent = () => {
    if (isLoading && !houseValuationDetails) {
      return <ScreenLoader />;
    }

    if (houseValuationDetailsError) {
      return (
        <Container flex={1} justify="center">
          <EmptyData
            description={formatErrorMessage(houseValuationDetailsError)}
            variant="red"
            actionText="Opnieuw proberen"
            actionPress={() => {
              setLoading(true);
              houseValuationDetailsRefetch().finally(() => setLoading(false));
            }}
          />
        </Container>
      );
    }

    if (!houseValuationDetails) {
      return (
        <Container flex={1} justify="center">
          <EmptyData
            description="Geen puntentelling gevonden"
            variant="blue"
            actionText="Opnieuw proberen"
            actionPress={() => {
              setLoading(true);
              houseValuationDetailsRefetch().finally(() => setLoading(false));
            }}
          />
        </Container>
      );
    }

    const valuation = houseValuationDetails?.[0];

    return <HouseValuationContainer valuation={valuation} />;
  };

  return (
    <InnerScreenTemplate
      header={{
        title: "Woningwaardering",
        backDestination: () => router.back(),
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            setRefetching(true);
            houseValuationDetailsRefetch().finally(() => setRefetching(false));
          }}
        />
      }
      contentStyle={{
        gap: 24,
        flexGrow: 1,
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding / 2,
      }}
    >
      {renderContent()}
    </InnerScreenTemplate>
  );
};

export default HouseValuation;
