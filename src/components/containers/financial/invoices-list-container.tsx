import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useImperativeHandle,
} from "react";
import { registerScrollable } from "@/utils/scroll-helper";
import {
  SectionList,
  RefreshControl,
  View,
  StyleSheet,
  SectionListData,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFetchPaymentOverview } from "@/service/financial";
import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import AvatarCardTemplateSkeleton from "@/components/templates/avatar-card-template-skeleton";
import { EmptyData } from "@/components/ui/empty-data";
import { Container } from "@/components/ui/container";
import { SIZES } from "@/constants";
import AnimatedCardTemplate from "@/components/templates/animated-card-template";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import AmountDetail from "@/components/ui/amount-detail";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

// Static styles moved outside component
const invoiceItemStyle = StyleSheet.create({
  container: { marginVertical: 8 },
});

type InvoicesListContainerProps = {
  selectedTab: "Alle" | "Openstaand";
  searchQuery: string;
};

// Memoized InvoiceItem component
interface InvoiceItemProps {
  item: any;
  parseDisplayTitle: (omschrijving: string) => { main: string; sub: string };
}

const InvoiceItem = React.memo<InvoiceItemProps>(
  ({ item, parseDisplayTitle }) => {
    const textStyles = useTextStyles();
    const { main, sub } = parseDisplayTitle(item.omschrijving);
    const isOutstanding = item.saldo > 0;
    const isPaid = item.saldo === 0;

    // Use pre-computed dates if available
    const vervaldatumText = item.formattedVervaldatum || item.vervaldatum || "";
    const boekdatumText = item.formattedBoekdatum || item.boekdatum || "";

    return (
      <View style={invoiceItemStyle.container}>
        <AvatarCardTemplate
          variant="background"
          showAvatar={false}
          showArrow={false}
        >
          <Container style={{ flex: 1 }}>
            <Container
              direction="horizontal"
              justify="space-between"
              align="flex-start"
            >
              <Container style={{ flex: 1, marginRight: 12 }}>
                <Container
                  direction="horizontal"
                  gap={8}
                  align="center"
                  style={{ marginBottom: 4 }}
                >
                  <ThemedText
                    weight="semiBold"
                    hyphenate={false}
                    style={{ fontSize: 16, flex: 1 }}
                  >
                    {main}
                  </ThemedText>
                </Container>

                {sub ? (
                  <ThemedText
                    {...textStyles.gray}
                    hyphenate={false}
                    style={{
                      fontSize: 14,
                      marginBottom: 4,
                      opacity: 0.8,
                    }}
                  >
                    {sub}
                  </ThemedText>
                ) : null}

                <ThemedText
                  {...textStyles.gray}
                  style={{ fontSize: 14, marginBottom: 2 }}
                >
                  {isOutstanding
                    ? `Betalen voor ${vervaldatumText}`
                    : `Betaling op ${boekdatumText}`}
                </ThemedText>
                {isOutstanding && <Badge variant="error">Openstaand</Badge>}
                {isPaid && <Badge variant="success">Betaald</Badge>}
              </Container>

              <Container align="flex-end" gap={2}>
                {isOutstanding ? (
                  <AmountDetail
                    amount={item.saldo}
                    dangerGreaterThan={true}
                    dangerCompareTo={0}
                    applyDangerColor={false}
                    applySuccessColor={false}
                  />
                ) : (
                  <>
                    <AmountDetail
                      amount={Math.abs(item.bedrag)}
                      dangerGreaterThan={false}
                      dangerLessThan={true}
                      dangerCompareTo={0}
                      applyDangerColor={false}
                      applySuccessColor={true}
                    />
                    <Container direction="horizontal" gap={4} align="center">
                      <ThemedText {...textStyles.gray} style={{ fontSize: 12 }}>
                        van
                      </ThemedText>
                      <AmountDetail
                        {...textStyles.gray}
                        amount={item.bedrag}
                        style={{ fontSize: 12 }}
                        applyDangerColor={false}
                        applySuccessColor={false}
                      />
                    </Container>
                  </>
                )}
              </Container>
            </Container>
          </Container>
        </AvatarCardTemplate>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render), false if different (re-render)
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.saldo === nextProps.item.saldo &&
      prevProps.item.bedrag === nextProps.item.bedrag &&
      prevProps.item.omschrijving === nextProps.item.omschrijving &&
      prevProps.item.boekdatum === nextProps.item.boekdatum &&
      prevProps.item.vervaldatum === nextProps.item.vervaldatum
    );
  }
);

InvoiceItem.displayName = "InvoiceItem";

const InvoicesListContainer = React.forwardRef<
  SectionList<any>,
  InvoicesListContainerProps
>(({ searchQuery, selectedTab }, ref) => {
  const textStyles = useTextStyles();
  const { bottom } = useSafeAreaInsets();
  const {
    paymentOverview,
    paymentOverviewLoading,
    paymentOverviewError,
    paymentOverviewRefetch,
  } = useFetchPaymentOverview();

  const { colors: { background } } = useCorporateBranding();
  const [loading, setLoading] = useState(false);
  const [isRefetching, setRefetching] = useState(false);
  const listRef = React.useRef<SectionList<any>>(null);

  const processedData = useMemo(() => {
    if (!paymentOverview) return [];
    return paymentOverview.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        groupCode: group.rentalUnitCode,
        isServiceContract: group.rentalUnitCode === "SERVICE_CONTRACTS",
      }))
    );
  }, [paymentOverview]);

  const filteredData = useMemo(() => {
    if (!processedData.length) return [];
    const tabFiltered = processedData.filter((item) =>
      selectedTab === "Alle" ? true : item.saldo > 0
    );
    if (!searchQuery.trim()) return tabFiltered;
    const searchLower = searchQuery.toLowerCase().trim();
    return tabFiltered.filter(
      (item) =>
        item.omschrijving.toLowerCase().includes(searchLower) ||
        (!item.isServiceContract &&
          item.groupCode.toLowerCase().includes(searchLower))
    );
  }, [processedData, selectedTab, searchQuery]);

  const uniqueData = useMemo(() => {
    const seen = new Set();
    const unique = filteredData.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    if (selectedTab === "Openstaand") {
      return unique.sort(
        (a, b) =>
          new Date(b.boekdatum).getTime() - new Date(a.boekdatum).getTime()
      );
    }
    return unique;
  }, [filteredData, selectedTab]);

  // Pre-compute date labels in groupedData to avoid computation in renderItem
  const groupedData = useMemo(() => {
    if (!uniqueData.length) return [];
    const groups: Record<string, typeof uniqueData> = {};
    uniqueData.forEach((item) => {
      const dateField = item?.boekdatum || "";
      const date = new Date(dateField);
      const month = date.toLocaleDateString("nl-NL", { month: "long" });
      const year = date.getFullYear();
      const formattedKey = `${month}, ${year}`;
      if (!groups[formattedKey]) groups[formattedKey] = [];

      // Pre-compute date labels to avoid computation in renderItem
      const itemWithDates = {
        ...item,
        formattedVervaldatum: item.vervaldatum
          ? format(new Date(item.vervaldatum), "d MMMM yyyy", { locale: nl })
          : "",
        formattedBoekdatum: item.boekdatum
          ? format(new Date(item.boekdatum), "d MMMM yyyy", { locale: nl })
          : "",
      };
      groups[formattedKey].push(itemWithDates);
    });

    return Object.entries(groups)
      .map(([title, data]) => ({
        title,
        data,
        sortKey: new Date(data?.[0]?.boekdatum || "").getTime(),
      }))
      .sort((a, b) => b.sortKey - a.sortKey)
      .map(({ title, data }) => ({ title, data }));
  }, [uniqueData, selectedTab]);

  type SkeletonItem = { __key: string; skeleton: true; id: string };
  type InvoiceListItem = SkeletonItem | (typeof uniqueData)[number];

  const isLoading = paymentOverviewLoading || loading;
  const skeletons: SkeletonItem[] = Array.from({ length: 6 }).map((_, i) => ({
    __key: `skeleton-${i}`,
    skeleton: true,
    id: `skeleton-${i}`,
  }));

  const listData = isLoading ? [{ title: "", data: skeletons }] : groupedData;

  const renderEmptyData = useCallback(
    () => (
      <Container flex={1} justify="center">
        <EmptyData
          title={
            paymentOverviewError
              ? "Fout bij laden van facturen"
              : "Geen facturen gevonden"
          }
          description={
            paymentOverviewError
              ? "Probeer het later opnieuw"
              : "Er zijn geen facturen om weer te geven."
          }
          actionPress={() => {
            setLoading(true);
            paymentOverviewRefetch().finally(() => setLoading(false));
          }}
          actionText="Opnieuw proberen"
        />
      </Container>
    ),
    [paymentOverviewError, paymentOverviewRefetch]
  );

  const parseDisplayTitle = useCallback((omschrijving: string) => {
    if (/^Betalingsovereenkomst\s+en/i.test(omschrijving)) {
      const rest = omschrijving
        .replace(/^Betalingsovereenkomst\s+en\s*/i, "")
        .trim();
      return { main: "Betaling - Betalingsovereenkomst en", sub: rest };
    }
    return { main: `Betaling - ${omschrijving}`, sub: "" };
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: nl });
    } catch {
      return dateString;
    }
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: InvoiceListItem; index: number }) => {
      if ("skeleton" in item) {
        return (
          <AnimatedCardTemplate index={index} key={index}>
            <AvatarCardTemplateSkeleton
              variant="background"
              style={{ marginVertical: 8 }}
            />
          </AnimatedCardTemplate>
        );
      }

      return <InvoiceItem item={item} parseDisplayTitle={parseDisplayTitle} />;
    },
    [parseDisplayTitle]
  );

  const keyExtractor = useCallback(
    (item: InvoiceListItem, idx: number) =>
      "skeleton" in item ? item.__key : item.id ?? String(idx),
    []
  );

  // Memoize section header style
  const sectionHeaderStyle = useMemo(
    () => [styles.sectionHeader, { backgroundColor: background }],
    [background]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<InvoiceListItem, any> }) => {
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

  // Handle scroll to index failures
  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      // Fallback: scroll to offset instead (cast to access VirtualizedList methods)
      if (listRef.current) {
        const offset = info.highestMeasuredFrameIndex * info.averageItemLength;
        (listRef.current as any).scrollToOffset?.({ offset, animated: true });
      }
    },
    []
  );

  // Register scrollable ref
  useEffect(() => {
    registerScrollable("InvoicesListContainer", {
      scrollTo: (options: { y?: number; animated?: boolean }) => {
        if (listRef.current && options.y !== undefined && listData.length > 0) {
          // Use scrollToLocation with estimated index, failure handled by onScrollToIndexFailed
          const estimatedItemIndex = Math.max(0, Math.floor(options.y / 100));
          listRef.current.scrollToLocation({
            sectionIndex: 0,
            itemIndex: Math.min(
              estimatedItemIndex,
              listData[0]?.data?.length || 0
            ),
            animated: options.animated !== false,
          });
        }
      },
      scrollToEnd: (options?: { animated?: boolean }) => {
        if (listRef.current && listData.length > 0) {
          // Use scrollToLocation to last item, failure handled by onScrollToIndexFailed
          const lastSection = listData[listData.length - 1];
          listRef.current.scrollToLocation({
            sectionIndex: listData.length - 1,
            itemIndex: Math.max(0, (lastSection.data?.length || 1) - 1),
            animated: options?.animated !== false,
          });
        }
      },
    });
    return () => {
      registerScrollable("InvoicesListContainer", null);
    };
  }, [listData]);

  // Forward ref to list
  useImperativeHandle(ref, () => listRef.current as SectionList<any>);

  // Platform-specific performance settings (Android needs more aggressive settings)
  const isAndroid = Platform.OS === "android";
  const performanceProps = useMemo(
    () => ({
      maxToRenderPerBatch: isAndroid ? 4 : 5,
      windowSize: isAndroid ? 5 : 6,
      initialNumToRender: isAndroid ? 4 : 5,
      updateCellsBatchingPeriod: isAndroid ? 300 : 200,
    }),
    [isAndroid]
  );

  return (
    <SectionList
      ref={listRef}
      sections={listData}
      keyExtractor={keyExtractor}
      onScrollToIndexFailed={handleScrollToIndexFailed}
      ListEmptyComponent={!isLoading ? renderEmptyData : null}
      contentContainerStyle={[
        {
          flexGrow: 1,
          paddingHorizontal: SIZES.padding,
          paddingVertical: SIZES.padding / 2,
        },
        listData.length === 0 && !isLoading && Platform.OS === "ios"
          ? { paddingBottom: (bottom || 0) + SIZES.padding / 2 }
          : null,
      ]}
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            setRefetching(true);
            paymentOverviewRefetch().finally(() => setRefetching(false));
          }}
        />
      }
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      removeClippedSubviews={true}
      maxToRenderPerBatch={performanceProps.maxToRenderPerBatch}
      windowSize={performanceProps.windowSize}
      initialNumToRender={performanceProps.initialNumToRender}
      updateCellsBatchingPeriod={performanceProps.updateCellsBatchingPeriod}
      onEndReachedThreshold={0.5}
      extraData={[isLoading, searchQuery, selectedTab]}
      stickySectionHeadersEnabled={true}
    />
  );
});

InvoicesListContainer.displayName = "InvoicesListContainer";

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

export default InvoicesListContainer;
