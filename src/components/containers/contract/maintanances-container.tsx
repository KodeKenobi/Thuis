import React, { useMemo, useState, useCallback, useEffect } from "react";
import AvatarCardTemplateSkeleton from "@/components/templates/avatar-card-template-skeleton";
import { Container } from "@/components/ui/container";
import { EmptyData } from "@/components/ui/empty-data";
import RecordCard from "@/components/ui/record-card";
import { SIZES } from "@/constants";
import { useFetchMaintenanceForRelatie } from "@/service/maintanance";
import { formatErrorMessage } from "@/utils";
import {
  RefreshControl,
  SectionList,
  SectionListData,
  Platform,
  StyleSheet,
  View,
  DefaultSectionT,
} from "react-native";
import Maintanace from "./maintanace";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import {
  registerDetailOpener,
  registerScrollable,
} from "@/utils/scroll-helper";
import { nl } from "date-fns/locale";
import { format } from "date-fns";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

type MaintananceTab = "Eigen" | "Collectief" | "Collectie";

interface MaintanancesContainerProps {
  searchQuery?: string;
  tab: MaintananceTab;
}

const tabToRepairType = (tab: MaintananceTab): "EIGEN" | "COLLECTIEF" =>
  tab === "Collectief" || tab === "Collectie" ? "COLLECTIEF" : "EIGEN";

const statusToVariant = (
  name?: string,
): "open" | "resolved" | "closed" | "default" | "info" => {
  const s = (name || "").toLowerCase();

  if (s.includes("gemeld")) return "open";
  if (
    s.includes("opdracht") &&
    (s.includes("verstrekt") || s.includes("verstekt"))
  )
    return "info";
  if (s.includes("gepland")) return "info";
  if (s.includes("afgehandeld") || s.includes("gereed")) return "resolved";
  return "default";
};

// Memoized MaintenanceItem component to prevent unnecessary re-renders
const MaintenanceItem = React.memo<{
  item: IMaintenance;
  onPress: (item: IMaintenance) => void;
}>(
  ({ item, onPress }) => {
    const textStyles = useTextStyles();
    return (
      <RecordCard
        style={{ marginVertical: 8 }}
        title={item.omschrijving || ""}
        idLabel={item.code}
        date={item.melddatum}
        status={{
          variant: statusToVariant(item?.status?.naam),
          label: item?.status?.naam || "",
        }}
        extraElement={
          (item as any)?.collectiefObject?.naam ? (
            <ThemedText {...textStyles.gray}>
              Locatie: {(item as any).collectiefObject?.naam}
            </ThemedText>
          ) : null
        }
        onPress={() => onPress(item)}
      />
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if item properties change
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.omschrijving === nextProps.item.omschrijving &&
      prevProps.item.code === nextProps.item.code &&
      prevProps.item.melddatum === nextProps.item.melddatum &&
      prevProps.item.status?.naam === nextProps.item.status?.naam &&
      (prevProps.item as any)?.collectiefObject?.naam ===
        (nextProps.item as any)?.collectiefObject?.naam
    );
  },
);

MaintenanceItem.displayName = "MaintenanceItem";

const MaintanancesContainer = ({
  searchQuery = "",
  tab,
}: MaintanancesContainerProps) => {
  const { colors: { background } } = useCorporateBranding();
  const textStyles = useTextStyles();
  const [selectedMaintanance, setSelectedMaintanance] =
    useState<IMaintenance | null>(null);
  const [isRefetching, setRefetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const listRef = React.useRef<SectionList<any>>(null);

  // Platform-specific performance settings (Android needs balanced aggressive settings)
  const isAndroid = Platform.OS === "android";
  const performanceProps = useMemo(
    () => ({
      maxToRenderPerBatch: isAndroid ? 4 : 5,
      windowSize: isAndroid ? 5 : 6,
      initialNumToRender: isAndroid ? 5 : 6,
      updateCellsBatchingPeriod: isAndroid ? 200 : 150,
    }),
    [isAndroid],
  );

  // Handle scroll to index failures
  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      // Fallback: scroll to offset instead
      if (listRef.current) {
        const offset = info.highestMeasuredFrameIndex * info.averageItemLength;
        listRef.current.scrollToLocation({
          sectionIndex: 0,
          itemIndex: Math.min(Math.floor(offset / 100), listData.length - 1),
          animated: true,
        });
      }
    },
    [],
  );

  const repairType = tabToRepairType(tab);

  const {
    allMaintananceData,
    allMaintananceDataLoading,
    allMaintananceDataError,
    allMaintananceDataRefetch,
  } = useFetchMaintenanceForRelatie({
    repairType,
    repairStatusType: "OPEN",
  });

  const isLoading = allMaintananceDataLoading || loading;

  const maintananceToRender = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = allMaintananceData || [];

    const filtered = base.filter((m) => {
      if (!q) return true;
      return (
        m?.omschrijving?.toLowerCase().includes(q) ||
        m?.status?.naam?.toLowerCase().includes(q) ||
        m?.code?.toLowerCase().includes(q)
      );
    });

    const seen = new Set<string>();
    const deduped = filtered.filter((item: any, idx) => {
      const key = String(item?.id ?? `${item?.code ?? "row"}-${idx}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped;
  }, [allMaintananceData, searchQuery]);

  // Sort filtered cases by date (newest first)
  const sortedData = useMemo(() => {
    if (!maintananceToRender.length) return [];
    return [...maintananceToRender].sort((a, b) => {
      const dateA = new Date(a.melddatum).getTime();
      const dateB = new Date(b.melddatum).getTime();
      return dateA - dateB; // Descending (newest first)
    });
  }, [maintananceToRender]);

  const groupedData = useMemo(() => {
    if (!sortedData.length) return [];

    const groups: Record<string, typeof sortedData> = {};

    sortedData.forEach((item) => {
      const date = new Date(item.melddatum);
      // Format as "MMMM yyyy" (e.g., "januari 2024") - same format as posts list
      const formattedKey = format(date, "MMMM yyyy", { locale: nl });

      if (!groups[formattedKey]) {
        groups[formattedKey] = [];
      }
      groups[formattedKey].push(item);
    });

    // Convert to array and sort sections by date (newest first)
    return Object.entries(groups)
      .map(([title, data]) => ({
        title,
        data,
        sortKey: new Date(data[0].melddatum).getTime(),
      }))
      .sort((a, b) => a.sortKey - b.sortKey) // Descending (newest first)
      .map(({ title, data }) => ({ title, data }));
  }, [sortedData]);

  type SkeletonItem = { __key: string; skeleton: true };
  type MaintenanceListItem = IMaintenance | SkeletonItem;

  const listData: SectionListData<MaintenanceListItem, DefaultSectionT>[] =
    allMaintananceDataLoading || loading
      ? (Array.from({ length: 6 }).map((_, i) => ({
          __key: `skeleton-${i}`,
          skeleton: true,
          data: [],
        })) as SectionListData<MaintenanceListItem, DefaultSectionT>[])
      : groupedData;

  // Register scrollable ref - always register even with empty lists
  useEffect(() => {
    registerScrollable("MaintanancesContainer", {
      scrollTo: (options: { y?: number; animated?: boolean }) => {
        if (listRef.current && options.y !== undefined) {
          if (listData.length > 0) {
            // Use scrollToIndex when we have items
            listRef.current.scrollToLocation({
              sectionIndex: 0,
              itemIndex: Math.min(
                Math.floor(options.y / 100),
                listData.length - 1,
              ),
              animated: options.animated !== false,
            });
          } else {
            // Use scrollToOffset when list is empty (fallback)
            listRef.current.scrollToLocation({
              sectionIndex: 0,
              itemIndex: 0,
              animated: options.animated !== false,
            });
          }
        }
      },
      scrollToEnd: (options?: { animated?: boolean }) => {
        if (listRef.current) {
          if (listData.length > 0) {
            // Use scrollToIndex when we have items
            listRef.current.scrollToLocation({
              sectionIndex: 0,
              itemIndex: listData.length - 1,
              animated: options?.animated !== false,
            });
          } else {
            // Use scrollToEnd when list is empty (fallback)
            listRef.current.scrollToLocation({
              sectionIndex: 0,
              itemIndex: 0,
              animated: options?.animated !== false,
            });
          }
        }
      },
    });
    return () => {
      registerScrollable("MaintanancesContainer", null);
    };
  }, [listData]);

  // Register detail opener
  useEffect(() => {
    registerDetailOpener("MaintanancesContainer", (item) =>
      setSelectedMaintanance(item),
    );
    return () => registerDetailOpener("MaintanancesContainer", null);
  }, []);

  // Memoize renderItem - remove AnimatedCardTemplate completely for better performance
  const renderItem = useCallback(({ item }: { item: MaintenanceListItem }) => {
    if ("skeleton" in item) {
      return <AvatarCardTemplateSkeleton variant="background" />;
    }
    return <MaintenanceItem item={item} onPress={setSelectedMaintanance} />;
  }, []);

  const keyExtractor = useCallback((item: any, idx: number) => {
    if ("skeleton" in item) return item.__key;
    return String(item?.id ?? `${item?.code ?? "row"}-${idx}`);
  }, []);

  // Render section header - memoize style object
  const sectionHeaderStyle = useMemo(
    () => [styles.sectionHeader, { backgroundColor: background }],
    [background],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<MaintenanceListItem, any> }) => {
      if (!section.title || isLoading) return null;
      return (
        <View style={sectionHeaderStyle}>
          <ThemedText
            {...textStyles.subtitle}
            weight="semiBold"
            style={styles.sectionHeaderText}
            fontType="display"
          >
            {section.title}
          </ThemedText>
        </View>
      );
    },
    [isLoading, sectionHeaderStyle],
  );

  if (allMaintananceDataLoading || loading) {
    return (
      <Container
        flex={1}
        gap={12}
        style={{
          paddingHorizontal: SIZES.padding,
          paddingVertical: SIZES.padding / 2,
        }}
      >
        {Array.from({ length: 10 }).map((_, item) => (
          <AvatarCardTemplateSkeleton key={item} variant="background" />
        ))}
      </Container>
    );
  }

  if (allMaintananceDataError && !maintananceToRender.length) {
    return (
      <Container
        flex={1}
        justify="center"
        style={{
          paddingHorizontal: SIZES.padding,
          paddingVertical: SIZES.padding / 2,
        }}
      >
        <EmptyData
          description={formatErrorMessage(allMaintananceDataError)}
          variant="red"
          actionPress={() => {
            setLoading(true);
            allMaintananceDataRefetch().finally(() => setLoading(false));
          }}
        />
      </Container>
    );
  }

  return (
    <>
      <SectionList
        ref={listRef}
        sections={listData}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={true}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: SIZES.padding,
          paddingVertical: SIZES.padding / 2,
        }}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              setRefetching(true);
              allMaintananceDataRefetch().finally(() => setRefetching(false));
            }}
          />
        }
        // Performance optimizations - Platform-specific (Android needs more aggressive settings)
        removeClippedSubviews={true}
        maxToRenderPerBatch={performanceProps.maxToRenderPerBatch}
        windowSize={performanceProps.windowSize}
        initialNumToRender={performanceProps.initialNumToRender}
        updateCellsBatchingPeriod={performanceProps.updateCellsBatchingPeriod}
        scrollEventThrottle={16}
        extraData={[searchQuery, tab]}
        ListEmptyComponent={
          <Container flex={1} justify="center">
            <EmptyData
              description="Geen openstaande reparaties gevonden"
              actionText="Opnieuw proberen"
              actionPress={() => {
                setLoading(true);
                allMaintananceDataRefetch().finally(() => setLoading(false));
              }}
            />
          </Container>
        }
      />
      <Maintanace
        selectedMaintanance={selectedMaintanance}
        close={() => setSelectedMaintanance(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 16,
    textTransform: "capitalize",
  },
});

export default MaintanancesContainer;
