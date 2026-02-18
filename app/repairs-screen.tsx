import React, { useState } from "react";
import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import { Redirect, router } from "expo-router";
import TabTemplate from "@/components/templates/tab-template";
import MaintanancesContainer from "@/components/containers/contract/maintanances-container";
import { IconButton } from "@/components/ui/icon-button";
import { Container } from "@/components/ui/container";
import Ionicons from "@expo/vector-icons/Ionicons";
import { HeaderTemplate } from "@/components/templates/header-template";
import { AnimatedSearch } from "@/components/ui/animated-search";
import { REPAIR_AS_CASES_CORPORATIONS_CONFIG } from "@/config/repair-cases-config";
import { useAuth } from "@/contexts/auth-context";
import CasesListContainer from "@/components/containers/cases/case-list-container";
import { ComponentProfiler } from "@/utils/component-profiler";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";

const RepairsScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { user } = useAuth();

  const handleSearchCancel = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  const renderRepairs = !REPAIR_AS_CASES_CORPORATIONS_CONFIG.includes(
    (user?.corporationName || "").toUpperCase()
  );

  if (!renderRepairs) {
    const tabs = ["Alle", "Open", "Opgelost"] as const;
    type TabKey = (typeof tabs)[number];

    const renderScene = ({ route }: { route: { key: TabKey } }) => (
      <WithErrorBoundary
        resetKeys={[route.key, searchQuery]}
        title="Kan zaken niet laden"
        description="Er is een fout opgetreden bij het laden van de zaken. Probeer het opnieuw."
      >
        <ComponentProfiler componentName="CasesListContainer">
          <CasesListContainer
            selectedTab={route.key}
            searchQuery={searchQuery}
          />
        </ComponentProfiler>
      </WithErrorBoundary>
    );

    return (
      <InnerScreenTemplate
        scrollable={false}
        header={{
          title: "Zaken",
          backDestination: () => router.back(),
          action: (
            <Container direction="horizontal" gap={8}>
              <IconButton
                size="sm"
                variant="secondary"
                onPress={() => setIsSearchActive(true)}
              >
                <Ionicons name="search" />
              </IconButton>
            </Container>
          ),
        }}
        showHeaderAction={isSearchActive}
        headerAction={
          isSearchActive ? (
            <HeaderTemplate>
              <AnimatedSearch
                value={searchQuery}
                onChangeText={setSearchQuery}
                onCancel={handleSearchCancel}
              />
            </HeaderTemplate>
          ) : null
        }
      >
        <TabTemplate
          tabs={tabs.map((tab) => ({
            key: tab,
            title: tab,
            content: renderScene({ route: { key: tab } }),
          }))}
        />
      </InnerScreenTemplate>
    );
  }

  const tabs = ["Eigen", "Collectief"] as const;
  type TabKey = (typeof tabs)[number];

  const renderScene = ({ route }: { route: { key: TabKey } }) => (
    <WithErrorBoundary
      resetKeys={[route.key, searchQuery]}
      title="Kan reparaties niet laden"
      description="Er is een fout opgetreden bij het laden van de reparaties. Probeer het opnieuw."
    >
      <ComponentProfiler componentName="MaintanancesContainer">
        <MaintanancesContainer tab={route.key} searchQuery={searchQuery} />
      </ComponentProfiler>
    </WithErrorBoundary>
  );

  return (
    <InnerScreenTemplate
      scrollable={false}
      header={{
        title: "Reparaties",
        backDestination: () => router.back(),
        action: (
          <Container direction="horizontal" gap={8}>
            <IconButton
              size="sm"
              variant="secondary"
              onPress={() => setIsSearchActive(true)}
            >
              <Ionicons name="search" />
            </IconButton>
          </Container>
        ),
      }}
      showHeaderAction={isSearchActive}
      headerAction={
        isSearchActive ? (
          <HeaderTemplate>
            <AnimatedSearch
              value={searchQuery}
              onChangeText={setSearchQuery}
              onCancel={handleSearchCancel}
            />
          </HeaderTemplate>
        ) : null
      }
    >
      <TabTemplate
        tabs={tabs.map((tab) => ({
          key: tab,
          title: tab,
          content: renderScene({ route: { key: tab } }),
        }))}
      />
    </InnerScreenTemplate>
  );
};

export default RepairsScreen;
