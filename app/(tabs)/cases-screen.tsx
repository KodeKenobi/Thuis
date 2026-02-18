import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { IconButton } from "@/components/ui/icon-button";
import { Container } from "@/components/ui/container";
import { AnimatedSearch } from "@/components/ui/animated-search";
import Ionicons from "@expo/vector-icons/Ionicons";
import CasesListContainer from "@/components/containers/cases/case-list-container";
import { HeaderTemplate } from "@/components/templates/header-template";
import { ComponentProfiler } from "@/utils/component-profiler";
import TabTemplate from "@/components/templates/tab-template";
import TabScreenTemplate from "@/components/templates/tab-screen-template";
import { useAuth } from "@/contexts/auth-context";
import { REPAIR_AS_CASES_CORPORATIONS_CONFIG } from "@/config/repair-cases-config";
import MaintanancesContainer from "@/components/containers/contract/maintanances-container";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";

export default function CasesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, [])
  );

  const renderCases = !REPAIR_AS_CASES_CORPORATIONS_CONFIG.includes(
    (user?.corporationName || "").toUpperCase()
  );

  const handleCancel = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  if (renderCases) {
    const tabs = ["Alle", "Open", "Opgelost"] as const;
    type TabKey = (typeof tabs)[number];

    const renderScene = ({ route }: { route: { key: TabKey } }) => (
      <WithErrorBoundary
        resetKeys={[route.key, searchQuery, refreshTrigger]}
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
      <TabScreenTemplate
        header={{
          title: "Zaken",
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
                onCancel={handleCancel}
              />
            </HeaderTemplate>
          ) : null
        }
        scrollable={false}
      >
        <TabTemplate
          key={`cases-tab-${refreshTrigger}`}
          tabs={tabs.map((tab) => ({
            key: tab,
            title: tab,
            content: renderScene({ route: { key: tab } }),
          }))}
        />
      </TabScreenTemplate>
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
      <ComponentProfiler componentName="CasesListContainer">
        <MaintanancesContainer tab={route.key} searchQuery={searchQuery} />
      </ComponentProfiler>
    </WithErrorBoundary>
  );

  return (
    <TabScreenTemplate
      header={{
        title: "Reparaties",
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
              onCancel={handleCancel}
            />
          </HeaderTemplate>
        ) : null
      }
      scrollable={false}
    >
      <TabTemplate
        key={`maintenance-tab-${refreshTrigger}`}
        tabs={tabs.map((tab) => ({
          key: tab,
          title: tab,
          content: renderScene({ route: { key: tab } }),
        }))}
      />
    </TabScreenTemplate>
  );
}
