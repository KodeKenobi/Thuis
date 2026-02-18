import React, { useState } from "react";
import { useFetchRentBreakdown, useFetchRentPeriods } from "@/service/rent";
import { formatDate, formatErrorMessage } from "@/utils";
import ScreenLoader from "@/components/ui/screen-loader";
import { EmptyData } from "@/components/ui/empty-data";
import { Container } from "@/components/ui/container";
import { FlatList, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import AnimatedCardTemplate from "@/components/templates/animated-card-template";
import SectionTemplate from "@/components/templates/section-template";
import Ionicons from "@expo/vector-icons/Ionicons";
import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import {
  DetailContentGroup,
  DetailContentItem,
} from "@/components/ui/detail-content";
import Divider from "@/components/ui/divider";
import { SIZES } from "@/constants";

interface RentsPeriodContainerProps {
  contractId: string;
}

const RentCard = ({
  item,
  contractId,
}: {
  item: string;
  contractId: string;
}) => {
  const textStyles = useTextStyles();
  const [loading, setLoading] = useState(false);
  const {
    rentBreakdown,
    rentBreakdownError,
    rentBreakdownLoading,
    rentBreakdownRefetch,
  } = useFetchRentBreakdown({
    params: {
      rentStartDate: item,
      contractId,
    },
  });

  const isLoading = loading || rentBreakdownLoading;

  const calculateTotalAmount = () => {
    if (!rentBreakdown || !Array.isArray(rentBreakdown)) return 0;
    return rentBreakdown.reduce((total, item) => {
      return total + (item.bedrag || 0);
    }, 0);
  };

  const renderBreakdown = () => {
    if (rentBreakdownError) {
      return (
        <Container justify="center" flex={1}>
          <EmptyData
            description={formatErrorMessage(rentBreakdownError)}
            variant="red"
            actionText="Opnieuw proberen"
            actionPress={() => {
              setLoading(true);
              rentBreakdownRefetch().finally(() => setLoading(false));
            }}
          />
        </Container>
      );
    }

    if (!rentBreakdown && !loading) {
      return (
        <Container justify="center" flex={1}>
          <EmptyData
            actionText="Opnieuw proberen"
            actionPress={() => {
              setLoading(true);
              rentBreakdownRefetch().finally(() => setLoading(false));
            }}
          />
        </Container>
      );
    }
    return (
      <Container>
        {isLoading ? (
          <DetailContentGroup
            items={[
              {
                label: "",
                content: "",
                loading: true,
              },
              {
                label: "",
                content: "",
                loading: true,
              },
              {
                label: "",
                content: "",
                loading: true,
              },
              {
                label: "",
                content: "",
                loading: true,
              },
            ]}
          />
        ) : null}
        {!isLoading ? (
          <>
            <DetailContentGroup
              items={(rentBreakdown || [])?.map((breakdown, index) => ({
                content: breakdown?.bedrag,
                contentType: "amount",
                amountProps: {
                  amount: breakdown?.bedrag,
                  applyDangerColor: false,
                  applySuccessColor: false,
                  ...textStyles.link,
                },
                label:
                  breakdown.prijselement?.naam || `Huurcomponent ${index + 1}`,
              }))}
            />
            <Divider
              direction="horizontal"
              style={{
                marginVertical: 8,
              }}
            />
            <DetailContentItem
              direction="horizontal"
              label={<ThemedText weight="semiBold">Totaal</ThemedText>}
              content={calculateTotalAmount()}
              contentType="amount"
              amountProps={{
                amount: calculateTotalAmount(),
                applyDangerColor: false,
                applySuccessColor: false,
              }}
              loading={isLoading}
            />
          </>
        ) : null}
      </Container>
    );
  };

  return (
    <SectionTemplate
      style={{
        marginVertical: 8,
        paddingHorizontal: 12,
      }}
    >
      <AvatarCardTemplate
        avatar={{
          icon: <Ionicons name="calculator" size={24} color="#4CAF50" />,
          color: "#4CAF50",
        }}
        showArrow={false}
      >
        <ThemedText {...textStyles.subtitle} size="lg">
          Huuropbouw {formatDate(item, { month: "long", year: "numeric" })}
        </ThemedText>
      </AvatarCardTemplate>
      {renderBreakdown()}
    </SectionTemplate>
  );
};

const RentsPeriodContainer = ({ contractId }: RentsPeriodContainerProps) => {
  const { bottom } = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [isRefetching, setRefetching] = useState(false);
  const {
    rentPeriods,
    rentPeriodsLoading,
    rentPeriodsError,
    rentPeriodsRefetch,
  } = useFetchRentPeriods({
    params: {
      contractId,
    },
  });

  const isLoading = loading || rentPeriodsLoading;

  if (isLoading && !rentPeriods) {
    return <ScreenLoader />;
  }

  const renderEmptyComponent = () => {
    if (rentPeriodsError) {
      return (
        <Container justify="center" flex={1}>
          <EmptyData
            title="Er is een fout opgetreden"
            description={formatErrorMessage(rentPeriodsError)}
            variant="red"
            actionText="Opnieuw proberen"
            actionPress={() => {
              setLoading(true);
              rentPeriodsRefetch().finally(() => setLoading(false));
            }}
          />
        </Container>
      );
    }

    if (!rentPeriods || rentPeriods.length === 0) {
      return (
        <Container justify="center" flex={1}>
          <EmptyData
            description="Geen huuropbouw perioden beschikbaar"
            actionText="Opnieuw proberen"
            actionPress={() => {
              setLoading(true);
              rentPeriodsRefetch().finally(() => setLoading(false));
            }}
          />
        </Container>
      );
    }

    return null;
  };

  return (
    <FlatList
      style={{ flex: 1 }}
      data={rentPeriods || []}
      renderItem={({ item, index }) => (
        <AnimatedCardTemplate index={index} key={index}>
          <RentCard item={item} contractId={contractId} />
        </AnimatedCardTemplate>
      )}
      keyExtractor={(_, index) => `rent-period-${index}`}
      ListEmptyComponent={renderEmptyComponent}
      contentContainerStyle={[
        {
          flexGrow: 1,
        },
        (!rentPeriods || rentPeriods.length === 0) && Platform.OS === "ios"
          ? { paddingBottom: (bottom || 0) + SIZES.padding / 2 }
          : {
            paddingBottom: bottom + SIZES.padding / 2,
          },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            setRefetching(true);
            rentPeriodsRefetch().finally(() => setRefetching(false));
          }}
        />
      }
    />
  );
};

export default RentsPeriodContainer;
