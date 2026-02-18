import InnerScreenTemplate from "@/components/templates/inner-screen-template";
import { IconButton } from "@/components/ui/icon-button";
import { router } from "expo-router";
import React, { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { HeaderTemplate } from "@/components/templates/header-template";
import { AnimatedSearch } from "@/components/ui/animated-search";
import TabTemplate from "@/components/templates/tab-template";
import InvoicesListContainer from "@/components/containers/financial/invoices-list-container";
import { ComponentProfiler } from "@/utils/component-profiler";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";

const tabs = ["Alle", "Openstaand"] as const;
type TabKey = (typeof tabs)[number];
const InvoicesScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const handleSearchCancel = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };
  const renderScene = ({ route }: { route: { key: TabKey } }) => (
    <WithErrorBoundary
      resetKeys={[route.key, searchQuery]}
      title="Kan betalingen niet laden"
      description="Er is een fout opgetreden bij het laden van de betalingen. Probeer het opnieuw."
    >
      <ComponentProfiler componentName="InvoicesListContainer">
        <InvoicesListContainer
          selectedTab={route.key}
          searchQuery={searchQuery}
        />
      </ComponentProfiler>
    </WithErrorBoundary>
  );
  return (
    <InnerScreenTemplate
      scrollable={false}
      headerAction={
        <HeaderTemplate>
          <AnimatedSearch
            value={searchQuery}
            onChangeText={setSearchQuery}
            onCancel={handleSearchCancel}
          />
        </HeaderTemplate>
      }
      showHeaderAction={isSearchActive}
      header={{
        title: "Mijn betalingen",
        backDestination: () => router.back(),
        action: (
          <IconButton
            size={"sm"}
            variant="secondary"
            onPress={() => setIsSearchActive(true)}
          >
            <Ionicons name="search" />
          </IconButton>
        ),
      }}
    >
      <TabTemplate
        tabs={tabs?.map((tab) => ({
          key: tab,
          title: tab,
          content: renderScene({ route: { key: tab } }),
        }))}
      />
    </InnerScreenTemplate>
  );
};

export default InvoicesScreen;
