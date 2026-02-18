import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import SectionTemplate from "@/components/templates/section-template";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  DetailContentGroup,
  DetailContentItem,
} from "@/components/ui/detail-content";
import { formatDate } from "@/utils";
import { Container } from "@/components/ui/container";
import Divider from "@/components/ui/divider";
import { Badge } from "@/components/ui/badge";

const HouseValuationContainer = ({
  valuation,
}: {
  valuation: IHouseValuationData;
}) => {
  const textStyles = useTextStyles();
  return (
    <>
      <SectionTemplate
        style={{
          paddingHorizontal: 12,
        }}
      >
        <AvatarCardTemplate
          avatar={{
            icon: <Ionicons name="calculator" size={24} color={"#2196F3"} />,
            color: "#2196F3",
          }}
          showArrow={false}
        >
          <ThemedText {...textStyles.subtitle} size="lg">
            Overzicht
          </ThemedText>
        </AvatarCardTemplate>
        <DetailContentGroup
          items={[
            {
              label: "Periode",
              content: `${formatDate(valuation?.begindatum, {
                year: "numeric",
                month: "long",
                day: "2-digit",
              })} - ${
                valuation?.einddatum
                  ? formatDate(valuation?.einddatum, {
                      year: "numeric",
                      month: "long",
                      day: "2-digit",
                    })
                  : "Aanwezig"
              }`,
            },
            {
              label: "Totaal punten",
              content: valuation?.punten,
            },
            ...(valuation?.maximaleHuur > 0
              ? [
                  {
                    label: "Maximale Huur",
                    content: valuation?.maximaleHuur || 0,
                    contentType: "amount" as const,
                    amountProps: {
                      applyDangerColor: false,
                      applySuccessColor: false,
                      amount: valuation?.maximaleHuur || 0,
                    },
                  },
                ]
              : []),
          ]}
        />
      </SectionTemplate>
      <Container gap={12}>
        <ThemedText {...textStyles.subtitle} size="lg">
          Puntenverdeling per onderdeel
        </ThemedText>
        {valuation?.groepen.map((group, index) => (
          <SectionTemplate
            key={index}
            style={{
              paddingHorizontal: 12,
            }}
          >
            <Container
              justify="space-between"
              gap={12}
              direction="horizontal"
              align="center"
            >
              <DetailContentItem
                direction="vertical"
                label={group?.criteriumGroep?.naam}
                content={group?.criteriumGroep?.stelsel?.naam}
              />
              <Badge
                variant={group.punten > 0 ? "success" : "default"}
                textStyle={{ fontSize: 14 }}
              >
                {group?.punten} punten
              </Badge>
            </Container>
            {group?.woningwaarderingen?.length ? (
              <>
                <Divider />
                <ThemedText weight="medium">Details:</ThemedText>
                <DetailContentGroup
                  items={group?.woningwaarderingen?.map((waardering) => ({
                    label: `${waardering.criterium.naam}`,
                    content: `${waardering.aantal} ${waardering?.criterium?.meeteenheid?.naam}`,
                  }))}
                />
              </>
            ) : null}
          </SectionTemplate>
        ))}
      </Container>
    </>
  );
};

export default HouseValuationContainer;
