import FlowsListContainer from "@/components/containers/flows/flows-list-container";
import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import SectionTemplate from "@/components/templates/section-template";
import { Container } from "@/components/ui/container";
import { DetailContentGroup } from "@/components/ui/detail-content";
import { EmptyData } from "@/components/ui/empty-data";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";
import { SIZES } from "@/constants";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { useFetchPaymentOverview } from "@/service/financial";
import { formatErrorMessage, generatePaymentStats } from "@/utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useState } from "react";
import { RefreshControl, TouchableOpacity } from "react-native";

const FinancialScreen = () => {
  const textStyles = useTextStyles();
  const { colors: { primary } } = useCorporateBranding();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    paymentOverview,
    paymentOverviewLoading,
    paymentOverviewError,
    paymentOverviewRefetch,
  } = useFetchPaymentOverview({});

  const loading = isLoading || paymentOverviewLoading;

  const paymentStats = generatePaymentStats(paymentOverview || []);

  return (
    <InnerScreenTemplate
      header={{
        title: "Betalen",
        backDestination: () => router.back(),
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            paymentOverviewRefetch().finally(() => setIsRefreshing(false));
          }}
        />
      }
      contentStyle={{
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding / 2,
        gap: 24,
      }}
    >
      <SectionTemplate>
        <AvatarCardTemplate
          avatar={{
            icon: <Ionicons name="wallet" size={24} color={primary} />,
            color: primary,
            size: 48,
          }}
          showArrow={false}
        >
          <ThemedText {...textStyles.subtitle} size="lg">
            Financieel Overzicht
          </ThemedText>
        </AvatarCardTemplate>
        {paymentOverviewError && !loading ? (
          <EmptyData
            description={formatErrorMessage(paymentOverviewError)}
            variant="red"
            actionPress={() => {
              setIsLoading(true);
              paymentOverviewRefetch().finally(() => setIsLoading(false));
            }}
          />
        ) : null}

        <DetailContentGroup
          items={[
            {
              label: "Openstaand saldo:",
              content: paymentStats?.totalOutstanding,
              contentType: "amount",
              loading: loading,
            },
            {
              label: "Openstaande facturen:",
              content: (
                <ThemedText
                  style={{
                    flexShrink: 1,
                    flexGrow: 1,
                    minWidth: 0,
                    textAlign: "right",
                  }}
                  {...(paymentStats?.unpaidInvoices > 0
                    ? {
                        ...textStyles.danger,
                      }
                    : {})}
                >
                  {paymentStats?.unpaidInvoices}
                </ThemedText>
              ),
              loading: loading,
            },
          ]}
        />
      </SectionTemplate>
      <TouchableOpacity
        onPress={() => router.push("/financial/invoices-screen")}
      >
        <AvatarCardTemplate
          variant="background"
          avatar={{
            size: 48,
            variant: "custom",
            icon: "document-text",
            backgroundColor: "#F3E5F5",
            color: "#9C27B0",
          }}
        >
          <Container flex={1}>
            <Container
              direction="horizontal"
              justify="space-between"
              align="center"
            >
              <Container flex={1} gap={4}>
                <ThemedText {...textStyles.body} weight="semiBold">
                  Mijn betalingen
                </ThemedText>
                <ThemedText {...textStyles.gray}>
                  Bekijk openstaande en betaalde facturen
                </ThemedText>
              </Container>
            </Container>
          </Container>
        </AvatarCardTemplate>
      </TouchableOpacity>
      <WithErrorBoundary
        resetKeys={[paymentStats?.totalOutstanding]}
        title="Kan betalen niet laden"
        description="Er is een fout opgetreden bij het laden van de betalen."
      >
        <FlowsListContainer header="Betalen" group={["finance"]} />
      </WithErrorBoundary>
    </InnerScreenTemplate>
  );
};

export default FinancialScreen;
