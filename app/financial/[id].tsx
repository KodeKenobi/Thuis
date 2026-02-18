import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import SectionTemplate from "@/components/templates/section-template";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import { SIZES } from "@/constants";
import { useRouteParamsObject } from "@/hooks/use-route-params-object";
import { useFetchPaymentOverview } from "@/service/financial";
import { router } from "expo-router";
import React, { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { Container } from "@/components/ui/container";
import { DetailContentGroup } from "@/components/ui/detail-content";

const InvoiceDetailsScreen = () => {
  const textStyles = useTextStyles();
  const { colors: { successColor } } = useCorporateBranding();
  const params = useRouteParamsObject<
    IPaymentOverviewItem & {
      groupCode: string;
      isServiceContract: boolean;
    }
  >();

  const [isRefetching, setRefetching] = useState(false);
  const [loading, setLoading] = useState(false);

  const { paymentOverview, } = useFetchPaymentOverview();

  const invoice =
    paymentOverview
      ?.flatMap((group) =>
        group.items.map((item) => ({
          ...item,
          groupCode: group.rentalUnitCode,
          isServiceContract: group.rentalUnitCode === "SERVICE_CONTRACTS",
        }))
      )
      .find((item) => item.id === params?.id) || params;

  const isPaid = invoice.saldo === 0;
  const isPartiallyPaid = invoice.saldo > 0 && invoice.saldo < invoice.bedrag;
  const statusText = isPaid
    ? "Volledig betaald"
    : isPartiallyPaid
    ? "Gedeeltelijk betaald"
    : "Openstaand";
  const statusColor = isPaid
    ? successColor
    : isPartiallyPaid
    ? "#ff9800"
    : "#ff6b35";

  return (
    <InnerScreenTemplate
      header={{
        title: "Factuur Details",
        backDestination: () => router.back(),
      }}
      contentStyle={{
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding / 2,
        gap: 24,
      }}
    >
      <SectionTemplate>
        <AvatarCardTemplate
          avatar={{
            icon: (
              <Ionicons
                name={isPaid ? "checkmark-circle" : "time"}
                size={24}
                color={statusColor}
              />
            ),
            color: statusColor,
            size: 48,
          }}
          showArrow={false}
        >
          <Container style={{ flex: 1 }}>
            <ThemedText {...textStyles.subtitle} size="lg">
              {statusText}
            </ThemedText>
            <ThemedText {...textStyles.gray}>Factuur {invoice.code}</ThemedText>
          </Container>
        </AvatarCardTemplate>
      </SectionTemplate>
      <SectionTemplate>
        <DetailContentGroup
          items={[
            {
              label: "Factuur bedrag:",
              content: invoice.bedrag,
              contentType: "amount",
              amountProps: {
                amount: invoice.bedrag,
                applyDangerColor: false,
                applySuccessColor: false,
              },
            },
            {
              label: "Openstaand saldo:",
              content: invoice.saldo,
              contentType: "amount",
              amountProps: {
                dangerGreaterThan: true,
                amount: invoice.saldo,
              },
            },
            ...(invoice.saldo === invoice.bedrag
              ? [
                  {
                    label: "Reeds betaald:",
                    content: invoice.bedrag - invoice.saldo,
                    contentType: "amount" as const,
                    amountProps: {
                      dangerLessThan: true,
                      dangerGreaterThan: false,
                      amount: invoice.bedrag - invoice.saldo,
                    },
                  },
                ]
              : []),
            {
              label: "Omschrijving:",
              content: invoice.omschrijving,
            },
            ...(invoice.detailsoort?.naam
              ? [
                  {
                    label: "Type:",
                    content: invoice.detailsoort?.naam,
                  },
                ]
              : []),
            {
              label: "Factuurcode:",
              content: invoice.code,
            },
            ...(invoice?.factuurdatum
              ? [
                  {
                    label: "Factuurdatum:",
                    content: new Date(invoice.factuurdatum).toLocaleDateString(
                      "nl-NL"
                    ),
                  },
                ]
              : []),

            {
              label: "Boekdatum:",
              content: new Date(invoice.boekdatum).toLocaleDateString("nl-NL"),
            },
            {
              label: "Vervaldatum:",
              content: (
                <ThemedText
                  weight="medium"
                  style={{
                    textAlign: "right",
                    flexShrink: 1,
                    flexGrow: 1,
                    minWidth: 0,
                  }}
                  lightColor={
                    new Date(invoice.vervaldatum) < new Date() &&
                    invoice.saldo > 0
                      ? "#ff0000"
                      : undefined
                  }
                >
                  {new Date(invoice.vervaldatum).toLocaleDateString("nl-NL")}
                </ThemedText>
              ),
            },
            ...(invoice?.huurovereenkomst?.code
              ? [
                  {
                    label: "Huurovereenkomst:",
                    content: invoice?.huurovereenkomst?.code,
                  },
                ]
              : []),
            {
              label: "Betalingsregeling:",
              content: invoice.betalingsregeling ? "Ja" : "Nee",
            },
            {
              label: "Externe incasso:",
              content: invoice.externeIncasso ? "Ja" : "Nee",
            },
            {
              label: "Afletteringen beschikbaar:",
              content: invoice.afletteringenBeschikbaar ? "Ja" : "Nee",
            },
          ]}
        />
      </SectionTemplate>
    </InnerScreenTemplate>
  );
};

export default InvoiceDetailsScreen;
