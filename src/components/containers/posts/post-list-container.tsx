import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
} from "react";
import { registerScrollable } from "@/utils/scroll-helper";
import {
  SectionList,
  RefreshControl,
  TouchableOpacity,
  View,
  StyleSheet,
  SectionListData,
  InteractionManager,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

import { useFetchMessages } from "@/service/message";

import { Container } from "@/components/ui/container";
import { EmptyData } from "@/components/ui/empty-data";
import { ThemedText, useTextStyles } from "@/components/ui/themed-text";
import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import AvatarCardTemplateSkeleton from "@/components/templates/avatar-card-template-skeleton";
import { SIZES } from "@/constants";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  searchQuery?: string;
}

// Memoize static objects outside component to avoid recreation
const postCardStyle = { marginVertical: 8 };
const postCardAvatarProps = {
  variant: "gray" as const,
  size: 48,
  bgAlpha: 0.15,
  icon: <Ionicons name="mail-outline" size={24} />,
};

const PostCard: React.FC<{ item: any; onPress: (item: any) => void }> =
  React.memo(
    ({ item, onPress }) => {
      const textStyles = useTextStyles();
      return (
        <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(item)}>
          <AvatarCardTemplate
            variant="background"
            style={postCardStyle}
            avatar={postCardAvatarProps}
          >
            <Container gap={2}>
              <ThemedText
                {...textStyles.body}
                weight="semiBold"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.subject}
              </ThemedText>
              <ThemedText {...textStyles.gray} size="sm">
                {item.dateLabel}
              </ThemedText>
            </Container>
          </AvatarCardTemplate>
        </TouchableOpacity>
      );
    },
    (prevProps, nextProps) => {
      // Return true if props are equal (skip re-render), false if different (re-render)
      // Only compare item properties, not onPress (it's stable)
      return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.dateLabel === nextProps.item.dateLabel &&
        prevProps.item.subject === nextProps.item.subject
      );
    }
  );

PostCard.displayName = "PostCard";

const PostListContainer = React.forwardRef<SectionList<any>, Props>(
  ({ searchQuery = "" }, ref) => {
    const router = useRouter();
    const textStyles = useTextStyles();
    const [isRefetching, setRefetching] = useState(false);
    const [loading, setLoading] = useState(false);
    const { colors: { background } } = useCorporateBranding();

    // Platform-specific performance settings (Android needs more aggressive settings)
    const isAndroid = Platform.OS === "android";
    const performanceProps = useMemo(
      () => ({
        maxToRenderPerBatch: isAndroid ? 3 : 4,
        windowSize: isAndroid ? 4 : 5,
        initialNumToRender: isAndroid ? 4 : 5,
        updateCellsBatchingPeriod: isAndroid ? 300 : 250,
      }),
      [isAndroid]
    );

    const listRef = React.useRef<SectionList<any>>(null);
    const {
      messages = [],
      messagesLoading,
      messagesError,
      messagesRefetch,
    } = useFetchMessages({
      params: {},
    });

    // Memoize filtered data
    const filtered = useMemo(
      () =>
        messages.filter((m) =>
          m.subject.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      [messages, searchQuery]
    );

    // Group by month and year (MMMM YYYY format) and pre-compute date labels
    // Use InteractionManager to defer heavy computation during network operations
    const groupedData = useMemo(() => {
      if (!filtered.length) return [];

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const todayString = today.toDateString();
      const yesterdayString = yesterday.toDateString();

      const groups: Record<string, typeof filtered> = {};

      // Batch process items to avoid blocking main thread
      filtered.forEach((item) => {
        const date = new Date(item.createdOn);
        // Format as "MMMM YYYY" (e.g., "januari 2024")
        const formattedKey = format(date, "MMMM yyyy", { locale: nl });

        // Pre-compute date label to avoid doing it in PostCard render
        const createdString = date.toDateString();
        let dateLabel: string;
        if (createdString === todayString) {
          dateLabel = "Vandaag";
        } else if (createdString === yesterdayString) {
          dateLabel = "Gisteren";
        } else {
          dateLabel = format(date, "dd MMMM yyyy", { locale: nl });
        }

        // Add dateLabel to item to avoid computation in PostCard
        const itemWithLabel = { ...item, dateLabel };

        if (!groups[formattedKey]) {
          groups[formattedKey] = [];
        }
        groups[formattedKey].push(itemWithLabel);
      });

      // Convert to array and sort sections by date (newest first)
      return Object.entries(groups)
        .map(([title, data]) => ({
          title,
          data,
          sortKey: new Date(data[0].createdOn).getTime(),
        }))
        .sort((a, b) => b.sortKey - a.sortKey) // Descending (newest first)
        .map(({ title, data }) => ({ title, data }));
    }, [filtered]);

    // Memoize callbacks to prevent re-renders
    const handleCardPress = useCallback(
      (item: any) => {
        router.push({
          pathname: "/post/[id]",
          params: { id: item.id, subject: item.subject },
        });
      },
      [router]
    );

    const handleRefresh = useCallback(() => {
      setRefetching(true);
      messagesRefetch().finally(() => setRefetching(false));
    }, [messagesRefetch]);

    const handleRetry = useCallback(() => {
      setLoading(true);
      messagesRefetch().finally(() => setLoading(false));
    }, [messagesRefetch]);

    // Memoize render functions
    // Remove AnimatedCardTemplate completely for better performance with 226 items
    const renderItem = useCallback(
      ({ item }: { item: any }) => {
        return <PostCard item={item} onPress={handleCardPress} />;
      },
      [handleCardPress]
    );

    // Memoize skeleton style and avatar props
    const skeletonStyle = useMemo(() => ({ marginVertical: 8 }), []);
    const skeletonAvatarProps = useMemo(() => ({ size: 42 }), []);

    const renderSkeletonItem = useCallback(() => {
      return (
        <AvatarCardTemplateSkeleton
          variant="background"
          style={skeletonStyle}
          avatar={skeletonAvatarProps}
        />
      );
    }, [skeletonStyle, skeletonAvatarProps]);

    const keyExtractor = useCallback((item: any) => item.id, []);
    const skeletonKeyExtractor = useCallback(
      (_: any, i: number) => `s-${i}`,
      []
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
          const offset =
            info.highestMeasuredFrameIndex * info.averageItemLength;
          (listRef.current as any).scrollToOffset?.({ offset, animated: true });
        }
      },
      []
    );

    // Register scrollable ref (after groupedData is defined)
    useEffect(() => {
      registerScrollable("PostListContainer", {
        scrollTo: (options: { y?: number; animated?: boolean }) => {
          if (
            listRef.current &&
            options.y !== undefined &&
            groupedData.length > 0
          ) {
            // Use scrollToLocation with estimated index, failure handled by onScrollToIndexFailed
            const estimatedItemIndex = Math.max(0, Math.floor(options.y / 100));
            listRef.current.scrollToLocation({
              sectionIndex: 0,
              itemIndex: Math.min(
                estimatedItemIndex,
                groupedData[0]?.data?.length || 0
              ),
              animated: options.animated !== false,
            });
          }
        },
        scrollToEnd: (options?: { animated?: boolean }) => {
          if (listRef.current && groupedData.length > 0) {
            // Use scrollToLocation to last item, failure handled by onScrollToIndexFailed
            const lastSection = groupedData[groupedData.length - 1];
            listRef.current.scrollToLocation({
              sectionIndex: groupedData.length - 1,
              itemIndex: Math.max(0, (lastSection.data?.length || 1) - 1),
              animated: options?.animated !== false,
            });
          }
        },
      });
      return () => {
        registerScrollable("PostListContainer", null);
      };
    }, [groupedData]);

    // Forward ref to list
    useImperativeHandle(ref, () => listRef.current as SectionList<any>);

    // Render section header - memoize style object
    const sectionHeaderStyle = useMemo(
      () => [styles.sectionHeader, { backgroundColor: background }],
      [background]
    );

    const renderSectionHeader = useCallback(
      ({ section }: { section: SectionListData<any, any> }) => {
        if (!section.title || messagesLoading || loading) return null;
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
      [messagesLoading, loading, sectionHeaderStyle]
    );

    if (messagesLoading || loading) {
      return (
        <SectionList
          sections={[{ title: "", data: Array.from({ length: 8 }) }]}
          keyExtractor={skeletonKeyExtractor}
          renderItem={renderSkeletonItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SIZES.padding,
            paddingTop: SIZES.padding / 2,
            paddingBottom: SIZES.padding,
          }}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={12}
          windowSize={21}
          initialNumToRender={12}
          updateCellsBatchingPeriod={50}
          scrollEventThrottle={16}
        />
      );
    }

    if (messagesError || messages.length === 0) {
      return (
        <Container flex={1} justify="center">
          <EmptyData
            title={messagesError ? "Fout bij laden" : "Geen berichten"}
            description={
              messagesError
                ? String(messagesError)
                : "Er zijn geen berichten om weer te geven."
            }
            variant={messagesError ? "red" : undefined}
            actionText="Opnieuw"
            actionPress={handleRetry}
          />
        </Container>
      );
    }

    return (
      <SectionList
        ref={listRef}
        sections={groupedData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        ListEmptyComponent={
          <Container flex={1} justify="center">
            <EmptyData
              title="Geen resultaten"
              description={`Er zijn geen berichten gevonden voor "${searchQuery}"`}
              actionText="Opnieuw"
              actionPress={handleRetry}
            />
          </Container>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SIZES.padding,
          paddingTop: SIZES.padding / 2,
          paddingBottom: SIZES.padding,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl onRefresh={handleRefresh} refreshing={isRefetching} />
        }
        // Performance optimizations - Platform-specific (Android needs more aggressive settings)
        removeClippedSubviews={true}
        maxToRenderPerBatch={performanceProps.maxToRenderPerBatch}
        windowSize={performanceProps.windowSize}
        initialNumToRender={performanceProps.initialNumToRender}
        updateCellsBatchingPeriod={performanceProps.updateCellsBatchingPeriod}
        scrollEventThrottle={16}
        onEndReachedThreshold={0.5}
        // Reduce re-renders - only include searchQuery, not loading
        extraData={searchQuery}
        stickySectionHeadersEnabled={true}
      />
    );
  }
);

PostListContainer.displayName = "PostListContainer";

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

export default PostListContainer;
