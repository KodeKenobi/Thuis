import React, { useMemo, useState, useCallback } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Container } from "@/components/ui/container";
import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import TabScreenTemplate from "@/components/templates/tab-screen-template";
import { ThemedText } from "@/components/ui/themed-text";
import { useGetFlowProcess } from "@/service/flows";
import { getActiveContracts, isFlowDisabled } from "@/utils";
import { useFetchContracts } from "@/service/contracts";
import { EmptyData } from "@/components/ui/empty-data";
import Skeleton from "@/components/ui/skeleton";
import AvatarCardTemplateSkeleton from "@/components/templates/avatar-card-template-skeleton";
import { AnimatedSearch } from "@/components/ui/animated-search";
import { HeaderTemplate } from "@/components/templates/header-template";
import { IconButton } from "@/components/ui/icon-button";
import { ComponentProfiler } from "@/utils/component-profiler";
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";
import { SIZES } from "@/constants";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

/**
 * Extracts numeric prefix from category label for sorting
 * Returns the numeric value if found, or Infinity for categories without prefix
 * Examples: "01.1 Woning" -> 1.1, "02. Huurcontract" -> 2, "Digitaal contact" -> Infinity
 */
const getCategorySortOrder = (label: string): number => {
  const match = label.match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : Infinity;
};

const getCategoryIcon = (
  categoryName: string,
): keyof typeof Ionicons.glyphMap => {
  const cleanCategoryName = categoryName.replace(/^\+?\d+(?:\.\s)?/, "");
  const normalized = cleanCategoryName.toLowerCase();

  if (normalized.includes("diensten")) {
    return "headset-outline"; // Diensten -> headset
  }
  if (normalized.includes("betalen")) {
    return "card-outline"; // Betalen -> card (finance)
  }
  if (normalized.includes("leefbaarheid")) {
    return "warning-outline"; // Leefbaarheid -> warning
  }
  if (normalized === "contact" || normalized.includes("contact ")) {
    return "mail-outline"; // Contact -> mail
  }
  if (normalized.includes("digitaal contact")) {
    return "person-outline"; // Digitaal contact -> person
  }
  if (
    normalized.includes("huurcontract beëindigen") ||
    normalized.includes("huurcontract beeindigen")
  ) {
    return "document-text-outline"; // Huurcontract beëindigen -> document-text
  }
  if (normalized.includes("verhuren")) {
    return "key-outline"; // Verhuren -> key
  }
  if (normalized.includes("reparat") || normalized.includes("onderhoud")) {
    return "construct-outline"; // Reparatie -> construct
  }
  if (normalized === "contract") {
    return "document-outline"; // Contract -> document
  }
  if (normalized.includes("huur") || normalized.includes("contract")) {
    return "document-text-outline"; // Huur/contract -> document-text
  }
  if (
    normalized.includes("account") ||
    normalized.includes("gegevens") ||
    normalized.includes("inlog")
  ) {
    return "person-outline"; // Account -> person
  }
  if (normalized.includes("contact") || normalized.includes("service")) {
    return "headset-outline"; // Contact/service -> headset
  }
  if (normalized.includes("bericht") || normalized.includes("melding")) {
    return "mail-outline"; // Bericht -> mail
  }
  if (normalized.includes("betaling") || normalized.includes("betaal")) {
    return "card-outline"; // Betaling -> card
  }
  if (normalized.includes("verhuur") || normalized.includes("verhuur")) {
    return "key-outline"; // Verhuur -> key
  }
  if (normalized.includes("koop") || normalized.includes("kopen")) {
    return "home-outline"; // Koop -> home (closest to "huur naar koop")
  }
  if (normalized.includes("jongeren")) {
    return "document-outline"; // Jongeren -> document
  }
  if (normalized.includes("alert") || normalized.includes("waarschuwing")) {
    return "warning-outline"; // Alert -> warning
  }

  // Default icon
  return "document-outline";
};

export default function FlowsScreen() {
  const { flowProcess, flowProcessLoading } = useGetFlowProcess();
  const { contracts } = useFetchContracts({ params: { subset: "ACTIEF" } });
  const activeContracts = getActiveContracts(contracts || []);
  const {
    corpColors: { primary },
  } = useCorporateBranding();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      // Increment key to force data refetch when screen gains focus
      setRefreshKey((prev) => prev + 1);
    }, []),
  );

  const handleCancel = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  const availableCategories = useMemo(() => {
    if (!flowProcess?.length) return [];

    let availableFlows = flowProcess.filter(
      (f) => !isFlowDisabled(f, activeContracts),
    );

    const categoryMap = new Map<
      string,
      {
        id: string;
        code: string;
        label: string;
        flowCount: number;
        priority: number;
      }
    >();

    const searchTerm = searchQuery.trim().toLowerCase();

    // First, build category map with all flows
    availableFlows.forEach((flow) => {
      if (flow.processCategory?.id) {
        const categoryId = flow.processCategory.id;
        const categoryLabel = flow.processCategory.label || "";

        if (categoryMap.has(categoryId)) {
          const existing = categoryMap.get(categoryId)!;
          categoryMap.set(categoryId, {
            ...existing,
            flowCount: existing.flowCount + 1,
          });
        } else {
          categoryMap.set(categoryId, {
            id: categoryId,
            code: flow.processCategory.code,
            label: categoryLabel,
            flowCount: 1,
            priority: 2, // Default to flow match priority
          });
        }
      }
    });

    // Then, filter and prioritize based on search
    if (searchTerm) {
      const filteredCategories = Array.from(categoryMap.values()).filter(
        (category) => {
          const categoryLabel = category.label.toLowerCase();

          // Priority 1: Category label matches
          if (categoryLabel.includes(searchTerm)) {
            category.priority = 1;
            return true;
          }

          // Priority 2: Check if any flow in this category matches
          const categoryFlows = availableFlows.filter(
            (f) =>
              (f.processCategoryId === category.id ||
                f.processCategory?.id === category.id) &&
              !isFlowDisabled(f, activeContracts),
          );

          const hasMatchingFlow = categoryFlows.some((flow) => {
            const flowLabel = (
              flow.defaultLabel ||
              flow.websiteLabel ||
              flow.label ||
              ""
            ).toLowerCase();
            const flowDesc = (
              flow.defaultDescription ||
              flow.description ||
              ""
            ).toLowerCase();
            const flowCode = (flow.code || flow.flowCode || "").toLowerCase();
            return (
              flowLabel.includes(searchTerm) ||
              flowDesc.includes(searchTerm) ||
              flowCode.includes(searchTerm)
            );
          });

          if (hasMatchingFlow) {
            category.priority = 2;
            return true;
          }

          return false;
        },
      );

      return filteredCategories.sort((a, b) => {
        // Sort by priority first (1 = category match, 2 = flow match)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // Then by numeric prefix (categories with numbers first, then alphabetically)
        const orderA = getCategorySortOrder(a.label);
        const orderB = getCategorySortOrder(b.label);
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // If same numeric prefix or both have no prefix, sort alphabetically
        return a.label.localeCompare(b.label);
      });
    }

    // No search - return all categories sorted by numeric prefix, then alphabetically
    return Array.from(categoryMap.values())
      .filter((cat) => cat.flowCount > 0)
      .sort((a, b) => {
        // Sort by numeric prefix (categories with numbers first, then alphabetically)
        const orderA = getCategorySortOrder(a.label);
        const orderB = getCategorySortOrder(b.label);
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // If same numeric prefix or both have no prefix, sort alphabetically
        return a.label.localeCompare(b.label);
      });
  }, [flowProcess, activeContracts, searchQuery]);

  const handleCategoryPress = (categoryId: string) => {
    router.push({
      pathname: "/flow-groups/category",
      params: { categoryId },
    });
  };

  if (flowProcessLoading) {
    return (
      <TabScreenTemplate
        header={{
          title: "Regelen",
        }}
        scrollable={false}
      >
        <Container style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <AvatarCardTemplateSkeleton
              key={index}
              avatar={{ size: 48 }}
              style={{ marginVertical: 8 }}
              variant="background"
            >
              <Container gap={8}>
                <Skeleton height={12} width={100} />
                <Skeleton height={10} width={130} />
              </Container>
            </AvatarCardTemplateSkeleton>
          ))}
        </Container>
      </TabScreenTemplate>
    );
  }

  return (
    <WithErrorBoundary
      resetKeys={[searchQuery, refreshKey, flowProcess?.length]}
      title="Kan processen niet laden"
      description="Er is een fout opgetreden bij het laden van de processen. Probeer het opnieuw."
    >
      <ComponentProfiler componentName="FlowsListContainer">
        <TabScreenTemplate
          header={{
            title: "Regelen",
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
          scrollable={true}
          scrollableName="FlowsListContainer"
        >
          <Container
            key={`flows-${refreshKey}`}
            style={{
              paddingHorizontal: 16,
              flex: 1,
              paddingVertical: SIZES.padding / 2,
            }}
          >
            {availableCategories.length === 0 ? (
              <Container style={{ flex: 1 }} justify="center" align="center">
                <EmptyData description="Er zijn geen processen om weer te geven." />
              </Container>
            ) : (
              availableCategories.map((category, index) => {
                const iconName = getCategoryIcon(category.label);
                const cleanCategoryName = category.label.replace(
                  /^\+?\d+(?:\.\s)?/,
                  "",
                );
                return (
                  <AvatarCardTemplate
                    key={category.id}
                    variant="background"
                    onPress={() => handleCategoryPress(category.id)}
                    style={{ marginVertical: 8 }}
                    avatar={{
                      icon: (
                        <Ionicons name={iconName} size={24} color={primary} />
                      ),
                      size: 30,
                      bgAlpha: 0.15,
                      color: primary,
                    }}
                  >
                    <Container gap={4}>
                      <ThemedText
                        weight="semiBold"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {cleanCategoryName}
                      </ThemedText>
                    </Container>
                  </AvatarCardTemplate>
                );
              })
            )}
          </Container>
        </TabScreenTemplate>
      </ComponentProfiler>
    </WithErrorBoundary>
  );
}
