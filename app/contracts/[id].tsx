import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import SectionTemplate from "@/components/templates/section-template";
import { Container } from "@/components/ui/container";
import { EmptyData } from "@/components/ui/empty-data";
import ScreenLoader from "@/components/ui/screen-loader";
import { useFetchContract } from "@/service/contracts";
import { formatDate, formatErrorMessage, getBackgroundColor } from "@/utils";
import { router, useLocalSearchParams } from "expo-router";
import React, { ReactNode, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import {
  DetailContentGroup,
  DetailContentItemProps,
} from "@/components/ui/detail-content";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { RefreshControl, TextStyle } from "react-native";
import { AvatarProps } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SIZES } from "@/constants";
import { useFetchAppConfig } from "@/service/app-config";
import { ComponentProfiler } from "@/utils/component-profiler";

const ContractScreen = () => {
  const textStyles = useTextStyles();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { appConfig } = useFetchAppConfig({});

  const [isRefetching, setRefetching] = useState(false);
  const [loading, setLoading] = useState(false);

  const { contract, contractLoading, contractError, contractRefetch } =
    useFetchContract({
      contractId: id!,
    });

  const {
    colors: { grayishColor },
  } = useCorporateBranding();

  const isLoading = loading || contractLoading;

  const address = contract?.eenheden[0]?.adres;
  const unit = contract?.eenheden[0];
  const relation = contract?.relaties[0];
  const payment = contract?.betaalwijze;

  const commonStyles: TextStyle = {
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 0,
    textAlign: "right",
  };

  const sections: {
    avatar: AvatarProps;
    title: string;
    footer?: ReactNode;
    items: DetailContentItemProps[];
  }[] = [
    {
      avatar: {
        icon: <Ionicons name="home" size={24} color="#4CAF50" />,
        color: "#4CAF50",
      },
      title: "Gegevens",

      items: [
        {
          label: "Adres",
          content: (
            <ThemedText style={commonStyles} {...textStyles.link}>
              {address
                ? `${address?.straatnaam} ${address?.huisnummer}, ${address?.woonplaats}`
                : "Geen adres"}
            </ThemedText>
          ),
        },
        // {
        //   label: "Postcode",
        //   content:
        //     address
        //       ? `${address.postcode} ${address.woonplaats}`
        //       : "Onbekend",
        // },
        {
          label: "Huur",
          content: contract?.brutoHuur || 0,
          contentType: "amount",
          amountProps: {
            applyDangerColor: false,
            applySuccessColor: false,
            amount: contract?.brutoHuur || 0,
          },
        },
        {
          label: "Type",
          content: `${unit?.soort?.naam || "Onbekend"} - ${
            unit?.detailsoort?.naam || ""
          }`,
        },
        // ...(unit?.bestemming?.naam ? [
        //   {
        //     label: "Bestemming",
        //     content: unit?.bestemming?.naam,
        //   },
        // ] : []),
        // {
        //   label: "Energielabel",
        //   content: unit?.brutoHuur || "Onbekend",
        // },
        // ...(unit?.verhuurkanaal ? [
        //   {
        //     label: "Verhuurkanaal",
        //     content: unit?.verhuurkanaal,
        //   },
        // ] : []),
        // ...(unit?.inspectieAantal ? [
        //   {
        //     label: "Inspecties",
        //     content: `${unit?.inspectieAantal || 0} uitgevoerd`,
        //   },
        // ] : []),
      ],
      footer: (
        <Container
          gap={16}
          style={{
            marginTop: 8,
          }}
        >
          <Container direction="horizontal" gap={10}>
            <Badge variant="success">Woning</Badge>
            {!contract?.btw && <Badge variant="default">BTW vrij</Badge>}
          </Container>
          {appConfig?.appSettings.config.showHomeValuation ? (
            <Container>
              <Button
                title="Woningwaardering"
                onPress={() => {
                  if (unit?.id) {
                    router.push({
                      pathname: "/house-valuation/[unitId]",
                      params: {
                        unitId: unit?.id,
                      },
                    });
                  }
                }}
              />
            </Container>
          ) : null}
        </Container>
      ),
    },
    ...(relation
      ? [
          {
            items: [
              {
                label: "Huurder",
                content: (
                  <ThemedText style={commonStyles} {...textStyles.link}>
                    {relation.naam}
                  </ThemedText>
                ),
              },
              { label: "Relatiecode", content: relation.code },
            ],
            avatar: {
              icon: <Ionicons name="people" size={24} color="#FF9800" />,
              color: "#FF9800",
            },
            title: "Relaties",
          },
        ]
      : []),
    {
      avatar: {
        icon: <Ionicons name="document-text" size={24} color="#2196F3" />,
        color: "#2196F3",
      },
      items: [
        {
          label: "Bruto huur",
          content: contract?.brutoHuur || 0,
          contentType: "amount",
          amountProps: {
            applyDangerColor: false,
            applySuccessColor: false,
            amount: contract?.brutoHuur || 0,
            ...textStyles.link,
          },
        },
        {
          label: "Contract type",
          content: contract?.soort?.naam,
        },
        {
          label: "Detail type",
          content: contract?.bepaaldeTijd ? "Bepaalde tijd" : "Onbepaalde tijd",
        },
        {
          label: "Begindatum",
          content: formatDate(contract?.begindatum || ""),
        },
        ...(contract?.einddatum
          ? [
              {
                label: "Einddatum",
                content: formatDate(contract.einddatum),
              },
            ]
          : []),
        ...(contract?.opzegtermijn?.code
          ? [
              {
                label: "Opzegtermijn",
                content: contract?.opzegtermijn?.code,
              },
            ]
          : []),
      ],
      title: "Details",
      // footer: (
      //   <Container
      //     gap={16}
      //     style={{
      //       marginTop: 8,
      //     }}
      //   >
      //     <Container>
      //       <Button
      //         title="Huuropbouw"
      //         onPress={() => {
      //           router.push({
      //             pathname: "/rent-score/[contractId]",
      //             params: {
      //               contractId: contract?.id || "",
      //             },
      //           });
      //         }}
      //       />
      //     </Container>
      //   </Container>
      // ),
    },
    ...(payment
      ? [
          {
            avatar: {
              icon: <Ionicons name="card-outline" size={24} color="#9C27B0" />,
              color: "#9C27B0",
            },
            title: "Betaalinformatie",
            items: [
              {
                label: "Betaalwijze",
                content: payment.soort?.naam,
              },
              ...(payment.betaalgegeven?.iban
                ? [
                    {
                      label: "IBAN",
                      content: payment.betaalgegeven.iban,
                    },
                  ]
                : []),
              ...(payment.betaalgegeven?.rekeninghouder
                ? [
                    {
                      label: "Rekeninghouder",
                      content: payment.betaalgegeven.rekeninghouder,
                    },
                  ]
                : []),
              ...(payment.betaalgegeven?.rekeninghouder
                ? [
                    {
                      label: "Machtigingsnummer",
                      content: payment.betaalgegeven?.rekeninghouder,
                    },
                  ]
                : []),
            ],
            ...(payment.soort?.naam?.toLowerCase().includes("incasso")
              ? {
                  footer: (
                    <Container
                      direction="horizontal"
                      align="center"
                      gap={8}
                      style={{
                        marginTop: 8,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: getBackgroundColor(grayishColor, 0.15),
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#4CAF50"
                      />
                      <ThemedText weight="medium" style={{ color: "#4CAF50" }}>
                        Automatische incasso actief
                      </ThemedText>
                    </Container>
                  ),
                }
              : {}),
          },
        ]
      : []),
  ];

  return (
    <InnerScreenTemplate
      scrollableName="ContractsListContainer"
      header={{
        title: "Contract",
        backDestination: () => router.back(),
      }}
      contentStyle={{
        flexGrow: 1,
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding / 2,
        gap: 24,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            setRefetching(true);
            contractRefetch().finally(() => setRefetching(false));
          }}
        />
      }
    >
      <ComponentProfiler componentName="ContractDetailContainer">
        {isLoading ? <ScreenLoader /> : null}
        {!isLoading && (contractError || !contract) ? (
          <Container flex={1} justify="center">
            <EmptyData
              description={
                contractError
                  ? formatErrorMessage(contractError)
                  : "Contract niet gevonden"
              }
              variant={contractError ? "red" : "blue"}
              actionPress={() => {
                setLoading(true);
                contractRefetch().finally(() => setLoading(false));
              }}
            />
          </Container>
        ) : null}
        {contract &&
          sections?.map((section, index) => (
            <SectionTemplate key={index} style={{ paddingHorizontal: 12 }}>
              <AvatarCardTemplate avatar={section?.avatar} showArrow={false}>
                <ThemedText {...textStyles.subtitle} size="lg">
                  {section?.title}
                </ThemedText>
              </AvatarCardTemplate>
              <DetailContentGroup items={section?.items} />
              {section?.footer}
            </SectionTemplate>
          ))}
      </ComponentProfiler>
    </InnerScreenTemplate>
  );
};

export default ContractScreen;
