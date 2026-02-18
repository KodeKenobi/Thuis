import React from "react";
import { Pressable } from "react-native";
import { DrawerTrigger } from "@/components/ui/drawer";
import { router } from "expo-router";
import { Container } from "@/components/ui/container";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useFetchPaymentOverview } from "@/service/financial";
import Skeleton from "@/components/ui/skeleton";
import AmountDetail from "@/components/ui/amount-detail";
import { generatePaymentStats } from "@/utils";
import Avatar from "@/components/ui/avatar";
import { Header } from "@/components/ui/header";
import { API_URL, SIZES } from "@/constants";
import { Image } from "expo-image";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

export const HomeWelcomeHeaderContainer = () => {
  const textStyles = useTextStyles();
  const { user } = useAuth();
  const { paymentOverview, paymentOverviewLoading } = useFetchPaymentOverview(
    {},
  );

  const { corporateInfo, colors: { theme, secondary, grayishColor, white, background } } = useCorporateBranding();
  const paymentStats = generatePaymentStats(paymentOverview || []);

  let logo = corporateInfo?.logo;

  if (theme === "dark") {
    logo = corporateInfo?.logoAlt;
    if (!logo) {
      logo = user?.corporation?.logoAlt;
    }
  }

  if (!corporateInfo?.logo) {
    logo = user?.corporation?.logo;
  }

  logo = `${API_URL?.replace("/api/v1", "")}${logo}`;

  return (
    <>
      <Header
        left={
          <DrawerTrigger>
            <Avatar
              fallback={user?.name || user?.fullName}
              icon="person-outline"
              size={32}
              shape="square"
              backgroundColor={secondary}
              color={grayishColor}
            />
          </DrawerTrigger>
        }
        center={
          <Image
            source={{
              uri: logo,
            }}
            style={{
              height: 32,
              width: "100%",
              alignSelf: "center",
              overflow: "visible",
            }}
            contentFit="contain"
            contentPosition={"center"}
          />
        }
      />
      <Container
        gap={4}
        style={{
          paddingHorizontal: SIZES.padding,
          paddingBottom: SIZES.padding / 2,
          paddingTop: SIZES.padding / 3,
          backgroundColor:
            theme === "light"
              ? white
              : background,
        }}
      >
        <ThemedText {...textStyles.title} weight="bold" fontType="display">
          Welkom {user?.name || user?.fullName}
        </ThemedText>
        <Pressable
          onPress={() => router.navigate("/financial/financial-screen")}
        >
          <Container gap={4} direction="horizontal">
            <ThemedText>Openstaand saldo:</ThemedText>
            {paymentOverviewLoading ? (
              <Skeleton width={70} />
            ) : (
              <AmountDetail amount={paymentStats?.totalOutstanding || 0} />
            )}
            <ThemedText {...textStyles.gray}>{"\u203A"}</ThemedText>
          </Container>
        </Pressable>
      </Container>
    </>
  );
};
