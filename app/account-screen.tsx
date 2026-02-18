import FlowsListContainer from "@/components/containers/flows/flows-list-container";
import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import SectionTemplate from "@/components/templates/section-template";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFetchUserData } from "@/service/auth";
import { router } from "expo-router";
import React, { useState } from "react";
import { SIZES } from "@/constants";
import { EmptyData } from "@/components/ui/empty-data";
import { formatErrorMessage } from "@/utils";
import { DetailContentGroup } from "@/components/ui/detail-content";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";
import { RefreshControl } from "react-native";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

const AccountScreen = () => {
  const textStyles = useTextStyles();
  const [loading, setLoading] = useState(false);
  const [isRefetching, setRefetching] = useState(false);
  const { userData, userDataError, userDataLoading, userDataRefetch } =
    useFetchUserData();
  const {
    corpColors: { primary },
  } = useCorporateBranding();

  const isLoading = loading || userDataLoading;

  return (
    <InnerScreenTemplate
      header={{
        title: "Account",
        backDestination: () => router.back(),
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            setRefetching(true);
            userDataRefetch().finally(() => setRefetching(false));
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
            icon: <Ionicons name="person-outline" size={24} color={primary} />,
            color: primary,
            size: 48,
          }}
          showArrow={false}
        >
          <ThemedText {...textStyles.subtitle} size="lg">
            Accountinformatie
          </ThemedText>
        </AvatarCardTemplate>
        {userDataError && !isLoading ? (
          <EmptyData
            description={formatErrorMessage(userDataError)}
            variant="red"
            actionPress={() => {
              setLoading(true);
              userDataRefetch().finally(() => setLoading(false));
            }}
          />
        ) : null}
        <DetailContentGroup
          items={[
            {
              label: "Naam:",
              content: userData?.name,
              loading: isLoading,
            },
            {
              label: "E-mailadres:",
              content: userData?.emailaddress1,
              loading: isLoading,
            },
            ...(userData?.telephone1
              ? [
                  {
                    label: userData?.telephone1Role || "Telefoon 1",
                    content: userData?.telephone1,
                    loading: isLoading,
                  },
                ]
              : []),
            ...(userData?.telephone2
              ? [
                  {
                    label: userData?.telephone2Role || "Telefoon 2",
                    content: userData?.telephone2,
                    loading: isLoading,
                  },
                ]
              : []),
          ]}
        />
      </SectionTemplate>
      <WithErrorBoundary
        resetKeys={[userData?.emailaddress1]}
        title="Kan contactopties niet laden"
        description="Er is een fout opgetreden bij het laden van de contactopties."
      >
        <FlowsListContainer header="Digitaal contact" group={["account"]} />
      </WithErrorBoundary>
    </InnerScreenTemplate>
  );
};

export default AccountScreen;
