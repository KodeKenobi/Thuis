import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useImperativeHandle,
} from "react";
import {
  registerScrollable,
  registerDetailOpener,
} from "@/utils/scroll-helper";
import {
  SectionList,
  RefreshControl,
  View,
  StyleSheet,
  SectionListData,
  Platform,
} from "react-native";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

import { useFetchCases } from "@/service/cases";

import RecordCard from "@/components/ui/record-card";
import RecordCardTemplateSkeleton from "@/components/templates/record-card-template-skeleton";

import { EmptyData } from "@/components/ui/empty-data";
import { Container } from "@/components/ui/container";
import { SIZES } from "@/constants";
import CaseCommentContainer from "./case-comment-container";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";

interface Props {
  selectedTab: "Alle" | "Open" | "Opgelost";
  searchQuery?: string;
}

// Memoized CaseItem component to prevent unnecessary re-renders
const CaseItem = React.memo<{
  item: ICase;
  onPress: (item: ICase) => void;
}>(
  ({ item, onPress }) => {
    return (
      <RecordCard
        title={item.title}
        idLabel={`#${item.ticketnumber}`}
        date={item.createdon}
        status={{
          variant: item.status?.label === "Open" ? "open" : "resolved",
          label: item.status?.label ?? "",
        }}
        onPress={() => onPress(item)}
      />
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if item properties change
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.title === nextProps.item.title &&
      prevProps.item.ticketnumber === nextProps.item.ticketnumber &&
      prevProps.item.createdon === nextProps.item.createdon &&
      prevProps.item.status?.label === nextProps.item.status?.label
    );
  }
);

CaseItem.displayName = "CaseItem";

const CasesListContainer = React.forwardRef<SectionList<any>, Props>(
  ({ selectedTab, searchQuery = "" }, ref) => {
    const textStyles = useTextStyles();
    const [selectedCase, setSelectedCase] = useState<ICase | null>(null);
    const [loading, setLoading] = useState(false);
    const listRef = React.useRef<SectionList<any>>(null);
    const [isRefetching, setRefetching] = useState(false);

    const subset =
      selectedTab === "Alle"
        ? undefined
        : selectedTab.toLowerCase() === "open"
        ? "open"
        : "closed";

    const { cases, casesLoading, casesError, casesRefetch } = useFetchCases({
      params: { subset: subset || "all" },
    });

    const isLoading = casesLoading || loading;
    const { colors: { background } } = useCorporateBranding();

    // Platform-specific performance settings (Android needs balanced aggressive settings)
    const isAndroid = Platform.OS === "android";
    const performanceProps = useMemo(
      () => ({
        maxToRenderPerBatch: isAndroid ? 4 : 5,
        windowSize: isAndroid ? 5 : 6,
        initialNumToRender: isAndroid ? 5 : 6,
        updateCellsBatchingPeriod: isAndroid ? 200 : 150,
      }),
      [isAndroid]
    );

    const filtered = useMemo(() => {
      if (!cases) return [];
      const statusFiltered = cases;
      return statusFiltered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.ticketnumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.omschrijving?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [cases, selectedTab, searchQuery]);

    // Sort filtered cases by date (newest first)
    const sortedData = useMemo(() => {
      if (!filtered.length) return [];
      return [...filtered].sort((a, b) => {
        const dateA = new Date(a.createdon).getTime();
        const dateB = new Date(b.createdon).getTime();
        return dateB - dateA; // Descending (newest first)
      });
    }, [filtered]);

    // Group by month and year (MMMM YYYY format) - same as posts list
    const groupedData = useMemo(() => {
      if (!sortedData.length) return [];

      const groups: Record<string, typeof sortedData> = {};

      sortedData.forEach((item) => {
        const date = new Date(item.createdon);
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
          sortKey: new Date(data[0].createdon).getTime(),
        }))
        .sort((a, b) => b.sortKey - a.sortKey) // Descending (newest first)
        .map(({ title, data }) => ({ title, data }));
    }, [sortedData]);

    type SkeletonItem = { __key: string; skeleton: true };
    type CaseListItem = ICase | SkeletonItem;

    const listData = isLoading
      ? [
          {
            title: "",
            data: Array.from({ length: 6 }).map((_, i) => ({
              __key: `skeleton-${i}`,
              skeleton: true,
            })) as SkeletonItem[],
          },
        ]
      : groupedData.map((group) => ({
          title: group.title,
          data: group.data as CaseListItem[],
        }));

    // Register scrollable ref - always register even with empty lists
    useEffect(() => {
      registerScrollable("CasesListContainer", {
        scrollTo: (options: { y?: number; animated?: boolean }) => {
          if (listRef.current && options.y !== undefined) {
            if (listData.length > 0 && listData[0]?.data?.length > 0) {
              // Use scrollToLocation when we have items
              listRef.current.scrollToLocation({
                sectionIndex: 0,
                itemIndex: Math.min(
                  Math.floor(options.y / 100),
                  listData[0]?.data?.length || 0
                ),
                animated: options.animated !== false,
              });
            } else {
              // Use scrollToOffset when list is empty (fallback)
              (listRef.current as any).scrollToOffset?.({
                offset: options.y || 0,
                animated: options.animated !== false,
              });
            }
          }
        },
        scrollToEnd: (options?: { animated?: boolean }) => {
          if (listRef.current) {
            if (listData.length > 0) {
              // Use scrollToLocation when we have items
              const lastSection = listData[listData.length - 1];
              listRef.current.scrollToLocation({
                sectionIndex: listData.length - 1,
                itemIndex: Math.max(0, (lastSection.data?.length || 1) - 1),
                animated: options?.animated !== false,
              });
            } else {
              // Use scrollToEnd when list is empty (fallback)
              (listRef.current as any).scrollToEnd?.({
                animated: options?.animated !== false,
              });
            }
          }
        },
      });
      return () => {
        registerScrollable("CasesListContainer", null);
      };
    }, [listData]);

    // Register detail opener
    useEffect(() => {
      registerDetailOpener("CasesListContainer", (item) =>
        setSelectedCase(item)
      );
      return () => registerDetailOpener("CasesListContainer", null);
    }, []);

    // Handle scroll to index failures
    const handleScrollToIndexFailed = useCallback(
      (info: {
        index: number;
        highestMeasuredFrameIndex: number;
        averageItemLength: number;
      }) => {
        // Fallback: scroll to offset instead (cast to access VirtualizedList methods)
        if (listRef.current) {
          const offset =
            info.highestMeasuredFrameIndex * info.averageItemLength;
          (listRef.current as any).scrollToOffset?.({ offset, animated: true });
        }
      },
      []
    );

    // Forward ref to list
    useImperativeHandle(ref, () => listRef.current as SectionList<any>);

    const handleRetry = useCallback(() => {
      setLoading(true);
      casesRefetch().finally(() => {
        setLoading(false);
      });
    }, [casesRefetch]);

    const renderEmptyData = useCallback(() => {
      const titleMap = {
        Alle: "Geen zaken gevonden",
        Open: "Geen open zaken",
        Opgelost: "Geen opgeloste zaken",
      } as const;
      const descMap = {
        Alle: "Er zijn geen zaken om weer te geven.",
        Open: "Er zijn geen openstaande zaken.",
        Opgelost: "Er zijn geen opgeloste zaken.",
      } as const;
      return (
        <Container flex={1} justify="center">
          <EmptyData
            title={
              casesError ? "Fout bij laden van zaken" : titleMap[selectedTab]
            }
            description={
              casesError ? "Probeer het later opnieuw" : descMap[selectedTab]
            }
            actionPress={handleRetry}
          />
        </Container>
      );
    }, [selectedTab, casesError, handleRetry]);

    if (!isLoading && casesError) {
      return renderEmptyData();
    }

    const handleCardPress = useCallback((caseData: ICase) => {
      setSelectedCase((prev) => (prev === caseData ? null : caseData));
    }, []);

    const keyExtractor = useCallback((item: CaseListItem, idx: number) => {
      return "skeleton" in item ? item.__key : item.id ?? String(idx);
    }, []);

    // Memoize renderItem - remove AnimatedCardTemplate completely for better performance
    const renderItem = useCallback(
      ({ item }: { item: CaseListItem }) => {
        if ("skeleton" in item) {
          return <RecordCardTemplateSkeleton />;
        }

        return <CaseItem item={item} onPress={handleCardPress} />;
      },
      [handleCardPress]
    );

    // Render section header - memoize style object
    const sectionHeaderStyle = useMemo(
      () => [styles.sectionHeader, { backgroundColor: background }],
      [background]
    );

    const renderSectionHeader = useCallback(
      ({ section }: { section: SectionListData<CaseListItem, any> }) => {
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
      [isLoading, sectionHeaderStyle]
    );

    return (
      <>
        <SectionList
          ref={listRef}
          sections={listData}
          keyExtractor={keyExtractor}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          ListEmptyComponent={renderEmptyData}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: SIZES.padding,
            paddingVertical: SIZES.padding / 2,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                setRefetching(true);
                casesRefetch().finally(() => setRefetching(false));
              }}
            />
          }
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          stickySectionHeadersEnabled={true}
          // Performance optimizations - Platform-specific (Android needs more aggressive settings)
          removeClippedSubviews={true}
          maxToRenderPerBatch={performanceProps.maxToRenderPerBatch}
          windowSize={performanceProps.windowSize}
          initialNumToRender={performanceProps.initialNumToRender}
          updateCellsBatchingPeriod={performanceProps.updateCellsBatchingPeriod}
          // Reduce re-renders - only include searchQuery and selectedTab
          extraData={[searchQuery, selectedTab]}
        />
        <CaseCommentContainer
          selectedCase={selectedCase}
          onClose={() => {
            setSelectedCase(null);
          }}
        />
      </>
    );
  }
);

CasesListContainer.displayName = "CasesListContainer";

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

export default CasesListContainer;
